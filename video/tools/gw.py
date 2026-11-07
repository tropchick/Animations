"""Tiny client for the OpenAI-compatible gateway (key in env API_WORK, never printed).
Usage:
  python3 tools/gw.py models
  python3 tools/gw.py get PATH
  python3 tools/gw.py post PATH body.json [out.json]
"""
import json
import os
import sys
import urllib.error
import urllib.request

BASE = "https://api.claudexia.tech"


def req(method, path, body=None, timeout=600, raw=False):
    url = path if path.startswith("http") else BASE + path
    data = None
    headers = {"Authorization": "Bearer " + os.environ["API_WORK"]}
    if body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=timeout) as f:
            b = f.read()
            return b if raw else json.loads(b)
    except urllib.error.HTTPError as e:
        msg = e.read().decode(errors="replace")[:2000]
        raise RuntimeError(f"HTTP {e.code}: {msg}")


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "models":
        d = req("GET", "/v1/models")
        for m in d.get("data", []):
            print(m.get("id"), m.get("owned_by", ""), m.get("type", ""))
    elif cmd == "get":
        print(json.dumps(req("GET", sys.argv[2]), ensure_ascii=False, indent=1)[:5000])
    elif cmd == "post":
        body = json.load(open(sys.argv[3]))
        d = req("POST", sys.argv[2], body)
        s = json.dumps(d, ensure_ascii=False)
        if len(sys.argv) > 4:
            open(sys.argv[4], "w").write(s)
        print(s[:3000])
