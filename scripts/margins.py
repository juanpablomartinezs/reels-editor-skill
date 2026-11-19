"""Where the graphics reach, every 5th frame of a graphics-only render (`--props='{"bare":true}'`): flags anything
within 100 px of a side, past x 930 inside y 1000-1500 (Instagram's and TikTok's buttons), above y 250 or below y 1580
(on 1080x1920; scaled for other sizes, so a --scale=0.5 render works). Full-screen moments are skipped.
Usage: margins.py edit/<name>/graphics.mov"""
import json, subprocess, sys
import numpy as np

mov = sys.argv[1]
s = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate",
                               "-of", "json", mov], capture_output=True, text=True, check=True).stdout)["streams"][0]
W, H = s["width"], s["height"]; num, den = map(int, s["r_frame_rate"].split("/")); fps = num / den
k = W / 1080
p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", mov, "-vf", "select=not(mod(n\\,5)),alphaextract", "-fps_mode", "passthrough",
                      "-f", "rawvideo", "-pix_fmt", "gray", "-"], stdout=subprocess.PIPE)
n, bad = 0, []
while len(buf := p.stdout.read(W * H)) == W * H:
    a = np.frombuffer(buf, np.uint8).reshape(H, W) > 24
    t = n * 5 / fps; n += 1
    if a.mean() > 0.85 or not a.any(): continue
    ys, xs = np.where(a)
    xr = np.where(a[int(1000 * k):int(1500 * k)].any(0))[0]
    issues = [m for m, hit in [(f"x0 {xs.min()}", xs.min() < 100 * k), (f"x1 {xs.max()}", xs.max() > 980 * k),
                               (f"x1@buttons {xr.max() if len(xr) else 0}", len(xr) and xr.max() > 930 * k),
                               (f"y0 {ys.min()}", ys.min() < 250 * k), (f"y1 {ys.max()}", ys.max() > 1580 * k)] if hit]
    if issues: bad.append((round(t, 2), issues))
for b in bad: print(*b)
print("frames checked", n, "flagged", len(bad))
