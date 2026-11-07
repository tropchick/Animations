"""Run many video jobs in parallel: python3 -I tools/gen_vbatch.py jobs.json
jobs.json: [{"out": "x.mp4", "model": "kling-v3.0", "seconds": "5", "size": "720x1280", "prompt": "...", "image": "kf.png"}, ...]
Existing outputs are skipped. Prints one line per job."""
import json
import os
import subprocess
import sys
import tempfile
from concurrent.futures import ThreadPoolExecutor

here = os.path.dirname(os.path.abspath(__file__))
jobs = json.load(open(sys.argv[1]))
par = int(os.environ.get("PAR", "4"))


def run(j):
    if os.path.exists(j["out"]) and not j.get("force"):
        return j["out"], 0, "exists"
    os.makedirs(os.path.dirname(os.path.abspath(j["out"])), exist_ok=True)
    pf = tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False)
    pf.write(j["prompt"])
    pf.close()
    cmd = [sys.executable, "-I", os.path.join(here, "gen_video.py"), j["out"], j["model"], str(j.get("seconds", "5")), j.get("size", "720x1280"), pf.name]
    if j.get("image"):
        cmd.append(j["image"])
    p = subprocess.run(cmd, capture_output=True, text=True)
    os.unlink(pf.name)
    return j["out"], p.returncode, (p.stdout + p.stderr).strip()[-700:]


with ThreadPoolExecutor(par) as ex:
    for out, code, msg in ex.map(run, jobs):
        print(code, out, msg.replace("\n", " | "), flush=True)
