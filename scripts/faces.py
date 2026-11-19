"""Where the creator's face sits through the cut, so nothing lands on the face and captions sit under the chin.
Usage: faces.py CUT OUT_DIR  -> OUT_DIR/faces.json [{t, x, y, w, h}] (px on the cut, the largest face every 0.5 s)
Prints the free bands: above the head (for pieces) and under the chin (for captions). OpenCV's bundled face detector,
on device. Its box runs from mid-forehead to the chin: the hair rises ~0.35 of the box above it, so the room above the
head is estimated, not measured. Look at a frame to confirm before placing anything there."""
import json, pathlib, subprocess, sys
import cv2, numpy as np

cut, out = sys.argv[1], pathlib.Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)
probe = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
                                   "-of", "json", cut], capture_output=True, text=True, check=True).stdout)["streams"][0]
W, H = probe["width"], probe["height"]
w, h = 540, round(540 * H / W / 2) * 2
det = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", cut, "-vf", f"fps=2,scale={w}:{h}", "-f", "rawvideo", "-pix_fmt", "gray", "-"],
                     stdout=subprocess.PIPE)
frames, n, k = [], 0, W / w
while len(buf := p.stdout.read(w * h)) == w * h:
    img = np.frombuffer(buf, np.uint8).reshape(h, w)
    frames.append(det.detectMultiScale(img, scaleFactor=1.1, minNeighbors=6, minSize=(w // 8, w // 8)))
    n += 1
# the creator's face is where most frames find one: per frame, the box nearest that median (clasped hands or a poster
# can win on size), none if every box is far from it
big = [max(f, key=lambda b: b[2] * b[3]) for f in frames if len(f)]
mx, my, mw = (np.median([b[0] + b[2] / 2 for b in big]), np.median([b[1] + b[3] / 2 for b in big]), np.median([b[2] for b in big])) if big else (0, 0, 0)
faces = []
for i, f in enumerate(frames):
    near = sorted(f, key=lambda b: (b[0] + b[2] / 2 - mx) ** 2 + (b[1] + b[3] / 2 - my) ** 2)[:1]
    if near and abs(near[0][0] + near[0][2] / 2 - mx) < 0.6 * mw and abs(near[0][1] + near[0][3] / 2 - my) < 0.6 * mw:
        x, y, fw, fh = near[0]
        faces.append({"t": i / 2, "x": round(x * k), "y": round(y * k), "w": round(fw * k), "h": round(fh * k)})
(out / "faces.json").write_text(json.dumps(faces))
print(f"{len(faces)} of {n} frames with a face -> {out / 'faces.json'}")
if faces:
    top = round(np.percentile([f["y"] for f in faces], 5)); chin = round(np.percentile([f["y"] + f["h"] for f in faces], 95))
    fh = np.median([f["h"] for f in faces])
    hair = round(top - 0.35 * fh)
    print(f"face top {top}..chin {chin} px (of {H}); hair ~{hair}")
    print(f"above the head: y 250..{hair - 50} ({hair - 300} px; pieces there need 50 px clear of the hair)")
    print(f"captions: from ~{chin + 60} under the chin, unless hands, a held phone or a print sit there (check a frame)")
missing = [i / 2 for i in range(n) if i / 2 not in {f["t"] for f in faces}]
if missing and len(missing) < n:
    print("no face found at (b-roll, a turn, or a miss):", ", ".join(f"{t:g}" for t in missing[:40]), "..." if len(missing) > 40 else "")
