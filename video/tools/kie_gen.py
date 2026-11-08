"""Generate AI video clips on kie.ai (key in env API_VIDEO, never printed).
Usage: python3 -I tools/kie_gen.py SHOTS.json OUT_DIR [name ...]
SHOTS.json: {"name": {"model": "veo-3-1" | "bytedance/seedance-2-5", "input": {...}}, ...}
Submits every listed shot at once, polls, downloads OUT_DIR/<name>.mp4 and prints credits per shot.
Shots whose mp4 already exists are skipped, so a rerun never pays twice."""
import json, os, sys, time, urllib.request

BASE = 'https://api.kie.ai'
KEY = os.environ['API_VIDEO']


def call(method, path, body=None):
    req = urllib.request.Request(BASE + path, method=method, data=json.dumps(body).encode() if body else None,
                                 headers={'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.load(r)


shots_file, out = sys.argv[1], sys.argv[2]
shots = json.load(open(shots_file))
names = sys.argv[3:] or list(shots)
os.makedirs(out, exist_ok=True)
tasks = {}
for n in names:
    if os.path.exists(f'{out}/{n}.mp4'):
        print(n, 'exists, skipped')
        continue
    r = call('POST', '/api/v1/jobs/createTask', shots[n])
    if r.get('code') != 200:
        print(n, 'SUBMIT FAILED', r.get('code'), r.get('msg'))
        continue
    tasks[n] = r['data']['taskId']
    print(n, 'submitted', tasks[n], flush=True)
total = 0
while tasks:
    time.sleep(15)
    for n, t in list(tasks.items()):
        d = call('GET', f'/api/v1/jobs/recordInfo?taskId={t}')['data']
        if d.get('state') == 'success':
            url = json.loads(d['resultJson'])['resultUrls'][0]
            urllib.request.urlretrieve(url, f'{out}/{n}.mp4')
            total += d.get('creditsConsumed') or 0
            print(n, 'done', d.get('creditsConsumed'), 'credits', flush=True)
            del tasks[n]
        elif d.get('state') == 'fail':
            print(n, 'FAILED', d.get('failCode'), d.get('failMsg'), flush=True)
            del tasks[n]
print('total credits', total)
print('balance', call('GET', '/api/v1/chat/credit')['data'])
