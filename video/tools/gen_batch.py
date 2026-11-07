"""Run many image jobs in parallel: python3 -I tools/gen_batch.py jobs.json
jobs.json: [{"out": "path.png", "model": "nano-banana-pro", "size": "1024x1536", "prompt": "...", "refs": ["a.png"]}, ...]
Jobs whose output already exists are skipped (delete the file to redo it)."""
import json
import os
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor

here = os.path.dirname(os.path.abspath(__file__))
jobs = json.load(open(sys.argv[1]))
par = int(os.environ.get("PAR", "4"))


def run(j):
    if os.path.exists(j["out"]) and not j.get("force"):
        return j["out"], 0, "exists"
    os.makedirs(os.path.dirname(os.path.abspath(j["out"])), exist_ok=True)
    cmd = [sys.executable, "-I", os.path.join(here, "gen_image.py"), j["out"], j["model"], j.get("size", "1024x1536"), j["prompt"], *j.get("refs", [])]
    p = subprocess.run(cmd, capture_output=True, text=True)
    return j["out"], p.returncode, (p.stdout + p.stderr).strip()[-600:]


with ThreadPoolExecutor(par) as ex:
    for out, code, msg in ex.map(run, jobs):
        print(code, out, msg, flush=True)
        if code == 3:
            print("BALANCE EXHAUSTED")
