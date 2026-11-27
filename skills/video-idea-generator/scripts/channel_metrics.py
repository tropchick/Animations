#!/usr/bin/env python3
"""Import normalized CSV or JSON analytics into a channel experience file."""

import argparse
import csv
import fcntl
import json
import math
import os
import re
import stat
import tempfile
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path


COUNTS = {"views", "likes", "comments", "shares", "saves", "gained_subscribers"}
METRICS = COUNTS | {
    "avg_view_duration_seconds",
    "avg_percentage_viewed",
    "viewed_instead_of_swiped_percentage",
}
ROW_FIELDS = METRICS | {
    "publication_id", "captured_at", "window", "window_start", "window_end",
    "source", "definitions",
}
TIMESTAMP = re.compile(
    r"(\d{4}-\d{2}-\d{2})[Tt](\d{2}:\d{2}:\d{2})(?:\.(\d+))?"
    r"([Zz]|[+-](?:[01]\d|2[0-3]):[0-5]\d)",
    flags=re.ASCII,
)


def timestamp(value, field):
    match = TIMESTAMP.fullmatch(value) if isinstance(value, str) else None
    if not match:
        raise ValueError(f"{field}: укажите дату и время RFC 3339 с часовым поясом")
    day, time, fraction, offset = match.groups()
    offset = "+00:00" if offset.upper() == "Z" else offset
    try:
        whole = datetime.fromisoformat(f"{day}T{time}{offset}").astimezone(timezone.utc)
    except (ValueError, OverflowError) as error:
        raise ValueError(f"{field}: некорректные дата или время") from error
    fraction = (fraction or "").rstrip("0")
    suffix = f".{fraction}" if fraction else ""
    return f"{whole.isoformat(timespec='seconds')[:-6]}{suffix}Z"


def required_text(value, field):
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{field}: требуется непустая строка")
    return value.strip()


def snapshot_key(row):
    publication = required_text(row.get("publication_id"), "publication_id")
    captured = timestamp(row.get("captured_at"), "captured_at")
    window = row.get("window")
    start = row.get("window_start")
    end = row.get("window_end")
    if window == "lifetime" and start in (None, "") and end in (None, ""):
        return publication, captured, window, None, None
    if window != "fixed":
        raise ValueError("window: используйте lifetime без границ или fixed с границами")
    start = timestamp(start, "window_start")
    end = timestamp(end, "window_end")
    if not start[:-1] < end[:-1] <= captured[:-1]:
        raise ValueError("окно должно удовлетворять window_start < window_end <= captured_at")
    return publication, captured, window, start, end


def metric_value(value, field, from_csv):
    if from_csv and isinstance(value, str):
        try:
            value = int(value) if field in COUNTS else float(value)
        except ValueError as error:
            raise ValueError(f"{field}: некорректное число") from error
    if field in COUNTS:
        if type(value) is not int or value < 0:
            raise ValueError(f"{field}: требуется целое неотрицательное число")
    elif (
        type(value) not in (int, float)
        or (isinstance(value, float) and not math.isfinite(value))
        or value < 0
        or (field == "viewed_instead_of_swiped_percentage" and value > 100)
    ):
        raise ValueError(f"{field}: значение вне допустимого диапазона")
    return value


def read_snapshot(row, from_csv):
    if not isinstance(row, dict) or None in row or (from_csv and None in row.values()):
        raise ValueError("неверная структура строки или число столбцов")
    unknown = row.keys() - ROW_FIELDS
    if unknown:
        raise ValueError(f"неизвестные поля: {', '.join(sorted(unknown))}")
    publication, captured, window, start, end = snapshot_key(row)
    source = required_text(row.get("source"), "source")
    metrics = {
        field: metric_value(value, field, from_csv)
        for field, value in row.items()
        if field in METRICS and value is not None and not (from_csv and not value.strip())
    }
    if not metrics:
        raise ValueError("укажите хотя бы одну измеренную метрику")
    definitions = row.get("definitions")
    if from_csv:
        definitions = json.loads(definitions) if definitions and definitions.strip() else None
    if definitions is not None:
        if not isinstance(definitions, dict) or definitions.keys() - METRICS:
            raise ValueError("definitions: требуется объект с именами известных метрик")
        definitions = {
            field: required_text(text, f"definitions.{field}")
            for field, text in definitions.items()
        }
    result = {
        "publication_id": publication,
        "captured_at": captured,
        "window": window,
        "window_start": start,
        "window_end": end,
        "source": source,
        "metrics": metrics,
    }
    if definitions:
        result["definitions"] = definitions
    return result


def load_rows(path):
    with path.open(encoding="utf-8-sig", newline="") as stream:
        if path.suffix.lower() == ".csv":
            reader = csv.DictReader(stream, strict=True)
            fields = reader.fieldnames
            if not fields or len(fields) != len(set(fields)):
                raise ValueError("CSV требует строку с уникальными названиями полей")
            return list(reader), True
        if path.suffix.lower() == ".json":
            rows = json.load(stream)
            if isinstance(rows, list):
                return rows, False
            raise ValueError("JSON должен содержать массив строк")
    raise ValueError("формат входных данных должен быть .csv или .json")


def merge_mapping(previous, incoming, replace_conflicts):
    for field, value in incoming.items():
        if previous.get(field) not in (None, value) and not replace_conflicts:
            raise ValueError(f"конфликт в {field}, для исправления используйте --replace-conflicts")
    return previous | incoming


def merge_snapshot(previous, incoming, replace_conflicts):
    if previous["source"] != incoming["source"]:
        known = {field for field, value in previous["metrics"].items() if value is not None}
        if not replace_conflicts or known - incoming["metrics"].keys():
            raise ValueError("смена источника требует --replace-conflicts и все известные метрики")
        return incoming
    merged = previous.copy()
    merged["metrics"] = merge_mapping(previous["metrics"], incoming["metrics"], replace_conflicts)
    definitions = merge_mapping(
        previous.get("definitions", {}), incoming.get("definitions", {}), replace_conflicts,
    )
    if definitions:
        merged["definitions"] = definitions
    return merged


def import_rows(database, rows, from_csv, replace_conflicts):
    if database.get("schema_version") != 1:
        raise ValueError("поддерживается база с schema_version 1")
    publication_ids = [
        publication["id"]
        for video in database["published_videos"]
        for publication in video["publications"]
    ]
    known_publications = set(publication_ids)
    if len(known_publications) != len(publication_ids):
        raise ValueError("в базе повторяются идентификаторы публикаций")

    snapshots = database["metric_snapshots"]
    positions = {snapshot_key(snapshot): pos for pos, snapshot in enumerate(snapshots)}
    if len(positions) != len(snapshots):
        raise ValueError("в базе повторяются ключи снимков метрик")

    counts = Counter(added=0, updated=0, unchanged=0)
    for number, row in enumerate(rows, 1):
        try:
            incoming = read_snapshot(row, from_csv)
            key = snapshot_key(incoming)
            if key[0] not in known_publications:
                raise ValueError(f"неизвестная публикация {key[0]!r}")
            if key not in positions:
                positions[key] = len(snapshots)
                snapshots.append(incoming)
                counts["added"] += 1
                continue
            pos = positions[key]
            merged = merge_snapshot(snapshots[pos], incoming, replace_conflicts)
            counts["unchanged" if merged == snapshots[pos] else "updated"] += 1
            snapshots[pos] = merged
        except ValueError as error:
            raise ValueError(f"запись {number}: {error}") from error
    return dict(counts)


def write_atomic(path, database):
    mode = stat.S_IMODE(path.stat().st_mode)
    data = json.dumps(database, indent=2, ensure_ascii=False, allow_nan=False) + "\n"
    with tempfile.NamedTemporaryFile(dir=path.parent, mode="w", encoding="utf-8", delete=False) as file:
        temp = Path(file.name)
        try:
            os.fchmod(file.fileno(), mode)
            file.write(data)
            file.flush()
            os.fsync(file.fileno())
            file.close()
            os.replace(temp, path)
        finally:
            temp.unlink(missing_ok=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--database", required=True, type=Path)
    parser.add_argument("input", type=Path)
    parser.add_argument("--apply", action="store_true", help="записать изменения в базу")
    parser.add_argument("--replace-conflicts", action="store_true", help="разрешить исправление сохранённых значений")
    args = parser.parse_args()
    try:
        rows, from_csv = load_rows(args.input)
        path = args.database.resolve(strict=True)
        if args.input.resolve() == path:
            raise ValueError("укажите отдельные файлы для входных данных и базы")
        directory = os.open(path.parent, os.O_RDONLY)
        try:
            # Lock the directory because replacing the database changes its inode.
            if args.apply:
                fcntl.flock(directory, fcntl.LOCK_EX)
            database = json.loads(path.read_text(encoding="utf-8"))
            counts = import_rows(database, rows, from_csv, args.replace_conflicts)
            written = args.apply and bool(counts["added"] or counts["updated"])
            if written:
                write_atomic(path, database)
        finally:
            os.close(directory)
    except (OSError, ValueError, csv.Error, TypeError, KeyError, AttributeError) as error:
        parser.exit(1, f"Ошибка импорта: {error}\n")
    print(json.dumps({**counts, "written": written}))


if __name__ == "__main__":
    main()
