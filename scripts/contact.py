# contact.py out.jpg dir1 dir2 ... : raw-1 | raw-2 side by side per row, labelled
import sys
from PIL import Image, ImageDraw
out, dirs = sys.argv[1], sys.argv[2:]
H = 300; rows = []
for d in dirs:
    ims = []
    for n in (1, 2):
        try: im = Image.open(f'{d}/raw-{n}.png').convert('RGB')
        except FileNotFoundError: continue
        ims.append(im.resize((int(im.width * H / im.height), H)))
    w = sum(i.width for i in ims) + 10 * len(ims)
    row = Image.new('RGB', (w + 10, H + 26), 'white'); x = 5
    for i in ims: row.paste(i, (x, 22)); x += i.width + 10
    ImageDraw.Draw(row).text((6, 5), d.split('/')[-1] + '   (left raw-1, right raw-2)', fill='black'); rows.append(row)
W = max(r.width for r in rows); sheet = Image.new('RGB', (W, sum(r.height for r in rows)), 'white'); y = 0
for r in rows: sheet.paste(r, (0, y)); y += r.height
sheet.save(out, quality=82)
