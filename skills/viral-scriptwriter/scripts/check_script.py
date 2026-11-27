#!/usr/bin/env python3
"""Проверь согласованность таймлайна и озвучки в сценарии JSON v1."""

import argparse
import json
import sys
from decimal import Decimal
from pathlib import Path


def normalized(text):
    return " ".join(text.split())


def seconds(value, label, *, positive=False):
    if type(value) not in (int, Decimal) or value < 0 or (positive and value == 0):
        raise ValueError(f"{label} — ожидается {'положительное' if positive else 'неотрицательное'} число")
    return value


def check_duration(data, errors, warnings):
    duration = data["duration"]
    minimum = seconds(duration["target_min_s"], "duration.target_min_s", positive=True)
    maximum = seconds(duration["target_max_s"], "duration.target_max_s", positive=True)
    total = seconds(duration["total_s"], "duration.total_s", positive=True)
    if "fps" in duration:
        seconds(duration["fps"], "duration.fps", positive=True)
    if minimum > maximum:
        errors.append("Целевая продолжительность задана в обратном порядке")
    elif not minimum <= total <= maximum:
        warnings.append(f"Продолжительность {total} с выходит за целевой диапазон {minimum}–{maximum} с")
    if duration["status"] not in ("preliminary", "aligned"):
        errors.append("duration.status должен быть preliminary или aligned")
    return total, duration["status"] == "aligned"


def check_track(data, total, aligned, errors):
    duration = data["duration"]
    voice = data["voice"]
    audio_duration = duration.get("audio_s")
    audio_offset = voice.get("audio_offset_s")
    if voice["mode"] not in ("single", "dialogue", "none"):
        errors.append("voice.mode должен быть single, dialogue или none")
    if aligned and voice["mode"] != "none":
        if audio_duration is None:
            errors.append("Для сверенного сценария с речью нужна фактическая duration.audio_s")
            return None
        offset = 0 if audio_offset is None else seconds(audio_offset, "voice.audio_offset_s")
        end = offset + seconds(audio_duration, "duration.audio_s", positive=True)
        if end > total:
            errors.append("Дорожка озвучки выходит за границу ролика")
        return offset, end

    if "audio_s" in duration or "audio_offset_s" in voice:
        errors.append("Фактические параметры дорожки допустимы для сверенного сценария с речью")
    return None


def check_scenes(scenes, total, track, errors):
    previous_end = 0
    previous_voice_end = track[0] if track else 0
    seen_ids = set()
    lines = []
    if not scenes:
        errors.append("Нужна хотя бы одна сцена")
    for scene in scenes:
        scene_id = scene["id"]
        if scene_id in seen_ids:
            errors.append(f"Повторяется ID сцены {scene_id}")
        seen_ids.add(scene_id)

        start = seconds(scene["start_s"], f"{scene_id}.start_s")
        end = seconds(scene["end_s"], f"{scene_id}.end_s", positive=True)
        if start != previous_end:
            errors.append(f"Сцена {scene_id} должна начаться в {previous_end} с")
        if end <= start:
            errors.append(f"Сцена {scene_id} должна иметь положительную длительность")
        previous_end = end

        for line in scene["voice_lines"]:
            speaker = normalized(line["speaker"])
            text = normalized(line["text"])
            if not speaker or not text:
                errors.append(f"В сцене {scene_id} у реплики должен быть говорящий и текст")
            lines.append((speaker, text))
            has_times = "start_s" in line or "end_s" in line
            if track is None and has_times:
                errors.append(f"В сцене {scene_id} ещё нельзя указывать измеренные границы реплики")
            if track is None:
                continue
            if "start_s" not in line or "end_s" not in line:
                errors.append(f"В сцене {scene_id} нужны обе измеренные границы реплики")
                continue

            voice_start = seconds(line["start_s"], f"{scene_id}.voice_lines.start_s")
            voice_end = seconds(line["end_s"], f"{scene_id}.voice_lines.end_s", positive=True)
            if not start <= voice_start < end:
                errors.append(f"Реплика сцены {scene_id} должна начаться в пределах этой сцены")
            if not previous_voice_end <= voice_start < voice_end <= track[1]:
                errors.append(f"Реплика сцены {scene_id} выходит за дорожку или пересекает соседнюю реплику")
            previous_voice_end = voice_end

    if previous_end != total:
        errors.append(f"Конец последней сцены должен совпасть с duration.total_s ({total} с)")
    return lines


def check_voice(data, lines, errors):
    voice = data["voice"]
    spoken = data["selected_hook"]["spoken"]
    clean_text = voice["clean_text"]
    if voice["mode"] == "none":
        if clean_text is not None or spoken is not None or lines or "dialogue" in voice:
            errors.append("В режиме none чистый текст и произнесённый хук должны быть null, а реплики пустыми")
        return

    if not lines:
        errors.append("Нужна хотя бы одна реплика для сценария с речью")
    expected_text = " ".join(text for _, text in lines)
    if not isinstance(clean_text, str) or normalized(clean_text) != expected_text:
        errors.append("Чистый текст должен совпадать с репликами сцен по порядку")
    if spoken is not None and (not lines or not lines[0][1].startswith(normalized(spoken))):
        errors.append("Произнесённый хук должен совпадать с началом первой реплики")
    if voice["mode"] == "single" and len({speaker for speaker, _ in lines}) > 1:
        errors.append("В режиме single реплики принадлежат одному голосу")
    if voice["mode"] == "dialogue":
        payload = [(normalized(turn["speaker"]), normalized(turn["text"])) for turn in voice["dialogue"]]
        if payload != lines:
            errors.append("Очередь диалога должна совпадать с репликами сцен")
    elif "dialogue" in voice:
        errors.append("Очередь диалога допустима только в режиме dialogue")


def check(data):
    errors = []
    warnings = []
    version = data["format_version"]
    if type(version) not in (int, Decimal) or version != 1:
        errors.append("Поддерживается format_version 1")
    if data["aspect_ratio"] != "9:16":
        errors.append("Ожидается кадр 9:16")
    total, aligned = check_duration(data, errors, warnings)
    track = check_track(data, total, aligned, errors)
    lines = check_scenes(data["scenes"], total, track, errors)
    check_voice(data, lines, errors)
    return errors, warnings


def reject_constant(value):
    raise ValueError(f"{value} не входит в JSON")


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"Повторяется ключ {key}")
        result[key] = value
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("scenario", type=Path, nargs="+", help="Сценарии в JSON")
    paths = parser.parse_args().scenario
    failed = False
    for path in paths:
        try:
            data = json.loads(
                path.read_text(encoding="utf-8"),
                parse_float=Decimal,
                parse_constant=reject_constant,
                object_pairs_hook=unique_object,
            )
            errors, warnings = check(data)
        except (ValueError, AttributeError, KeyError, TypeError, OSError, ArithmeticError) as error:
            errors = [f"Ошибка данных — {error}"]
            warnings = []
        for warning in warnings:
            print(f"{path}: предупреждение — {warning}", file=sys.stderr)
        if errors:
            failed = True
            for error in errors:
                print(f"{path}: {error}", file=sys.stderr)
        else:
            print(f"{path}: таймлайн и реплики согласованы")
    return int(failed)


if __name__ == "__main__":
    sys.exit(main())
