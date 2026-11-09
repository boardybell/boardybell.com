"""Palette gradient map: every output pixel lies on a path between the site palette colors.

Usage: fontvenv python scripts/grade.py <navy|warm> in.png out.png [--lift 0.0] [--gamma 1.0] [--mix 0.0]
Luminance is computed in linear light, shaped by gamma/lift, then mapped through the stops below
with smooth (smoothstep) interpolation in linear RGB. A 0.6% monochrome grain prevents banding without defeating AVIF compression.
"""
import sys
import numpy as np
from PIL import Image

HEX = lambda h: np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], dtype=np.float64) / 255
MIX = lambda a, b, t: HEX(a) * (1 - t) + HEX(b) * t
STOPS = {
    # deep navy shadows, navy mids, a cool stone made only from navy + cream, cream at the very top
    'navy': [(0.00, HEX('#0D1626')), (0.40, HEX('#16233B')), (0.78, MIX('#16233B', '#FDF6EC', 0.55)), (1.00, HEX('#FDF6EC'))],
    # ink shadows, warm gray mids with a touch of gold-ink, cream highlights
    'warm': [(0.00, HEX('#14120F')), (0.42, MIX('#6E6759', '#8A6425', 0.25)), (0.72, MIX('#6E6759', '#FDF6EC', 0.55)), (1.00, HEX('#FDF6EC'))],
}

def lin(c): return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
def srgb(c): return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(np.clip(c, 0, None), 1 / 2.4) - 0.055)

def grade(kind, src, dst, lift=0.0, gamma=1.0, mix=0.0):
    im = np.asarray(Image.open(src).convert('RGB'), dtype=np.float64) / 255
    L = lin(im) @ np.array([0.2126, 0.7152, 0.0722])
    L = np.clip(L, 0, 1) ** (1 / 2.4)            # perceptual
    L = np.clip(lift + (1 - lift) * L, 0, 1) ** gamma
    gold = kind == 'navygold'
    stops = STOPS['navy' if gold else kind]
    out = np.zeros(L.shape + (3,))
    for (p0, c0), (p1, c1) in zip(stops, stops[1:]):
        m = (L >= p0) & (L <= p1)
        t = (L[m] - p0) / (p1 - p0); t = t * t * (3 - 2 * t)
        out[m] = srgb(lin(c0) * (1 - t[:, None]) + lin(c1) * t[:, None])
    if mix: out = srgb(lin(out) * (1 - mix) + lin(im) * mix)  # keep a little of the original colour
    if gold:
        # keep warm metal and lamplight: pixels whose hue is gold/amber and that carry real saturation
        mx, mn = im.max(-1), im.min(-1); sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
        r, g, b = im[..., 0], im[..., 1], im[..., 2]
        hue = (np.degrees(np.arctan2(np.sqrt(3) * (g - b), 2 * r - g - b)) + 360) % 360
        sm = lambda x, a, b: np.clip((x - a) / (b - a), 0, 1) ** 2 * (3 - 2 * np.clip((x - a) / (b - a), 0, 1))
        m = sm(sat, 0.18, 0.45) * sm(hue, 12, 26) * (1 - sm(hue, 58, 75)) * sm(L, 0.12, 0.3)
        # nudge kept pixels toward the family gold so brass, wood glow and lamps agree
        target = np.array([0.725, 0.545, 0.243])
        warm = srgb(lin(im) * 0.7 + lin(target * (im.mean(-1, keepdims=True) / target.mean())) * 0.3)
        out = out * (1 - m[..., None]) + np.clip(warm, 0, 1) * m[..., None]
    rng = np.random.default_rng(7)
    out = np.clip(out + rng.normal(0, 0.006, L.shape)[..., None], 0, 1)
    Image.fromarray((out * 255).round().astype(np.uint8)).save(dst, optimize=True)
    print(f'{kind} {src} -> {dst}')

if __name__ == '__main__':
    a = sys.argv[1:]
    opt = lambda k, d: float(a[a.index(k) + 1]) if k in a else d
    grade(a[0], a[1], a[2], opt('--lift', 0.0), opt('--gamma', 1.0), opt('--mix', 0.0))
