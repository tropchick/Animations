"""Print word timings: python3 tools/show_words.py words.json"""
import json
import sys

d = json.load(open(sys.argv[1]))
for k, v in d.items():
    print("==", k)
    print(" ".join(f"{w[2]}[{w[0]}-{w[1]}]" for w in v))
