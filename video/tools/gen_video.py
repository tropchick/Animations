"""Image-to-video (or text-to-video) through the gateway's OpenAI-style /v1/videos API. Key in env API_WORK, never printed.
Usage: python3 -I tools/gen_video.py OUT.mp4 MODEL SECONDS SIZE prompt.txt [start_image.png]
SIZE like 720x1280. Submits a job, polls until done, downloads the mp4. Exit 3 = balance exhausted."""
import json
import os
import sys
import time
import urllib.error
import urllib.request
import uuid

BASE = "https://api.claudexia.tech"
out, model, seconds, size, prompt_file, *img = sys.argv[1:]
prompt = open(prompt_file).read().strip()
key = os.environ["API_WORK"]


def call(method, path, body=None, ctype=None, raw=False, timeout=300):
    h = {"Authorization": "Bearer " + key}
    if ctype:
        h["Content-Type"] = ctype
    r = urllib.request.Request(BASE + path, data=body, headers=h, method=method)
    try:
        with urllib.request.urlopen(r, timeout=timeout) as f:
            b = f.read()
            return b if raw else json.loads(b)
    except urllib.error.HTTPError as e:
        msg = e.read().decode(errors="replace")[:1500]
        if e.code == 402 or "insufficient" in msg.lower() or "balance" in msg.lower():
            print("BALANCE:", e.code, msg)
            sys.exit(3)
        raise RuntimeError(f"HTTP {e.code}: {msg}")


bnd = uuid.uuid4().hex
parts = []
for k, v in (("model", model), ("prompt", prompt), ("seconds", seconds), ("size", size)):
    parts.append(f"--{bnd}\r\nContent-Disposition: form-data; name=\"{k}\"\r\n\r\n{v}\r\n".encode())
if img:
    data = open(img[0], "rb").read()
    mime = "image/png" if img[0].endswith(".png") else "image/jpeg"
    parts.append(f"--{bnd}\r\nContent-Disposition: form-data; name=\"input_reference\"; filename=\"{os.path.basename(img[0])}\"\r\nContent-Type: {mime}\r\n\r\n".encode() + data + b"\r\n")
parts.append(f"--{bnd}--\r\n".encode())

t0 = time.time()
job = None
for attempt in range(3):
    try:
        job = call("POST", "/v1/videos", b"".join(parts), f"multipart/form-data; boundary={bnd}")
        break
    except RuntimeError as e:
        print("submit failed:", e, file=sys.stderr)
        if "HTTP 4" in str(e) and "429" not in str(e):
            sys.exit(2)
        time.sleep(20)
if not job:
    sys.exit(1)
vid = job.get("id")
print("job", vid, job.get("status"), flush=True)
while True:
    time.sleep(15)
    try:
        st = call("GET", f"/v1/videos/{vid}")
    except Exception as e:
        print("poll err", e, file=sys.stderr)
        continue
    s = st.get("status")
    if s in ("completed", "succeeded", "success"):
        break
    if s in ("failed", "error", "cancelled"):
        print("FAILED", json.dumps(st)[:1500])
        sys.exit(1)
    if time.time() - t0 > 3600:
        print("TIMEOUT", json.dumps(st)[:500])
        sys.exit(1)
b = call("GET", f"/v1/videos/{vid}/content", raw=True, timeout=600)
open(out, "wb").write(b)
print(f"wrote {out} ({len(b)//1024} KB, {time.time()-t0:.0f} s)")
