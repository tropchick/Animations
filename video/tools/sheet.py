"""Contact sheet of the jpgs in a folder: python3 tools/sheet.py out/dir [cols]"""
import glob
import sys

from PIL import Image

d = sys.argv[1]
cols = int(sys.argv[2]) if len(sys.argv) > 2 else 7
fs = sorted(f for f in glob.glob(f"{d}/f*.jpg"))
ims = [Image.open(f) for f in fs]
w, h = ims[0].size
w2, h2 = w // 2, h // 2
rows = (len(ims) + cols - 1) // cols
sheet = Image.new("RGB", (cols * w2, rows * h2))
for i, im in enumerate(ims):
    sheet.paste(im.resize((w2, h2)), ((i % cols) * w2, (i // cols) * h2))
sheet.save(f"{d}/sheet.jpg")
print(f"{d}/sheet.jpg", sheet.size)
