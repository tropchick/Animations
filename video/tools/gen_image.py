"""Generate or edit an image through the gateway (key in env API_WORK, never printed).
Usage: python3 -I tools/gen_image.py OUT.png MODEL SIZE "prompt" [ref1.png ref2.png ...]
With reference images it calls /v1/images/edits (multipart), otherwise /v1/images/generations."""
import base64
import json
import os
import sys
import time
import urllib.error
import urllib.request
import uuid

BASE = "https://api.claudexia.tech"
out, model, size, prompt, *refs = sys.argv[1:]
key = os.environ["API_WORK"]


def send(r, timeout=900):
    for attempt in range(3):
        try:
            with urllib.request.urlopen(r, timeout=timeout) as f:
                return json.loads(f.read())
        except urllib.error.HTTPError as e:
            msg = e.read().decode(errors="replace")[:1500]
            if e.code in (402,) or "insufficient" in msg.lower() or "balance" in msg.lower():
                print("BALANCE:", e.code, msg)
                sys.exit(3)
            print("HTTP", e.code, msg, file=sys.stderr)
            if e.code < 500 and e.code != 429:
                sys.exit(2)
        except Exception as e:  # timeouts, resets
            print("ERR", e, file=sys.stderr)
        time.sleep(10 * (attempt + 1))
    sys.exit(1)


if refs:
    bnd = uuid.uuid4().hex
    parts = []

    def field(name, val):
        parts.append(f"--{bnd}\r\nContent-Disposition: form-data; name=\"{name}\"\r\n\r\n{val}\r\n".encode())

    field("model", model)
    field("prompt", prompt)
    field("size", size)
    field("n", "1")
    for p in refs:
        data = open(p, "rb").read()
        mime = "image/png" if p.endswith(".png") else "image/jpeg"
        parts.append(
            f"--{bnd}\r\nContent-Disposition: form-data; name=\"image[]\"; filename=\"{os.path.basename(p)}\"\r\nContent-Type: {mime}\r\n\r\n".encode()
            + data + b"\r\n")
    parts.append(f"--{bnd}--\r\n".encode())
    body = b"".join(parts)
    r = urllib.request.Request(BASE + "/v1/images/edits", data=body, method="POST",
                               headers={"Authorization": "Bearer " + key, "Content-Type": f"multipart/form-data; boundary={bnd}"})
else:
    body = json.dumps({"model": model, "prompt": prompt, "size": size, "n": 1}).encode()
    r = urllib.request.Request(BASE + "/v1/images/generations", data=body, method="POST",
                               headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"})

t0 = time.time()
d = send(r)
item = (d.get("data") or [{}])[0]
if item.get("b64_json"):
    img = base64.b64decode(item["b64_json"])
elif item.get("url"):
    img = urllib.request.urlopen(item["url"], timeout=300).read()
else:
    print("no image in response:", json.dumps(d)[:1500])
    sys.exit(1)
open(out, "wb").write(img)
print(f"wrote {out} ({len(img)//1024} KB, {time.time()-t0:.0f} s)")
