"""Cut the raw take(s) into the tight vertical base of the reel, from the cut list you wrote.
Usage: cut.py edit/<name>/cutlist.json
cutlist.json: {"source": "raw/<name>.mp4", "cx": 0.5, "segments": [
  {"ws": 1.60, "we": 7.50, "text": "...", "why": "hook: the most surprising claim", "frame": "A", "src": "raw/<name>/take2.mov"}]}
  ws/we: the first word's start and the last word's end, from that take's transcript.json (seconds in the take)
  frame: "A" (wide) or "B" (punched in): alternate them on sentence starts so jump cuts look intentional
  src: only when a segment comes from another take; cx: the horizontal centre of the crop (0-1) for wide footage
-> edit/<name>/base.mp4 (1080x1920, 30 fps, H.264, the voice at -14 LUFS / -1 dBTP) and segments.json (where each
   segment and its framing sit on the reel's timeline), copied to remotion/public/media/<name>/ and
   remotion/src/segments_<name>.json for the reel. Re-transcribe base.mp4 afterwards: its transcript is the one
   the captions are timed from, and reading it shows any clipped or doubled word.
Edges are set on the audio, not the transcript: each segment starts 0.05 s before its first sound and ends 0.07 s
after the voice drops ~12 dB under its median level; inside it every pause of 0.14 s or more comes down to 0.12 s.
Every piece is cut on the 30 fps frame grid (audio trimmed to the same length), so sound and picture never drift.
iPhone HDR (HLG / PQ) is tone-mapped to SDR; colours are otherwise left exactly as shot."""
import json, pathlib, shutil, subprocess, sys, tempfile
import numpy as np

FPS, W, H = 30, 1080, 1920
spec_path = pathlib.Path(sys.argv[1]); E = spec_path.parent
spec = json.loads(spec_path.read_text())

def run(cmd): subprocess.run(cmd, check=True, capture_output=True)
def level(src):
    """dB every 10 ms of the take's (lightly denoised) voice"""
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-ac", "1", "-ar", "16000", "-af", "highpass=f=80,afftdn=nf=-25",
                          "-f", "f32le", "-"], capture_output=True, check=True).stdout
    a = np.frombuffer(pcm, np.float32); n = len(a) // 160
    return 20 * np.log10(np.sqrt((a[:n * 160].reshape(n, 160) ** 2).mean(1)) + 1e-9)
def probe(src):
    s = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                                   "stream=width,height,color_transfer:stream_side_data=rotation", "-of", "json", src],
                                  capture_output=True, text=True, check=True).stdout)["streams"][0]
    rot = abs(int(next((d.get("rotation", 0) for d in s.get("side_data_list", []) if "rotation" in d), 0)))
    w, h = (s["height"], s["width"]) if rot in (90, 270) else (s["width"], s["height"])
    return w, h, s.get("color_transfer", "")

levels, pieces = {}, []
for seg in spec["segments"]:
    src = seg.get("src", spec["source"])
    if src not in levels:
        L = level(src); voiced = L[L > np.percentile(L, 10) + 10]
        levels[src] = (L, np.median(voiced) - 12)
    L, thr = levels[src]
    i0, i1 = int(seg["ws"] * 100), int(seg["we"] * 100)
    on = i0  # the first sound: back from the word's start while it is still voiced (0.3 s at most)
    while on > max(0, i0 - 30) and L[on - 1] >= thr: on -= 1
    off = i1  # the voice dropping off: forward while voiced (0.4 s at most)
    while off < min(len(L) - 1, i1 + 40) and L[off] >= thr: off += 1
    a, b = max(0, on - 5), min(len(L), off + 7)  # 0.05 s before, 0.07 s after
    quiet = np.r_[False, L[a:b] < thr, False]  # pauses of 0.14 s or more inside: down to 0.12 s
    edges = np.flatnonzero(np.diff(quiet.astype(int)))
    cuts = [(a + s, a + e) for s, e in zip(edges[::2], edges[1::2]) if e - s >= 14 and s > 0 and a + e < b]
    s0 = a
    for ps, pe in cuts:
        pieces.append((src, s0 / 100, (ps + 6) / 100, seg)); s0 = pe - 6
    pieces.append((src, s0 / 100, b / 100, seg))

tmp = pathlib.Path(tempfile.mkdtemp(prefix="cut_"))
listing, timeline, t = [], [], 0.0
for k, (src, s, e, seg) in enumerate(pieces):
    n = max(1, round((e - s) * FPS)); d = n / FPS; s = round(s * FPS) / FPS  # on the frame grid
    w, h, trc = probe(src)
    cx = spec.get("cx", 0.5)
    hdr = "zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv," \
        if trc in ("arib-std-b67", "smpte2084") else ""
    vf = (f"{hdr}scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}:(iw-{W})*{cx}:(ih-{H})/2,"
          f"fps={FPS},format=yuv420p,setsar=1")
    out = tmp / f"p{k:04d}.mov"
    run(["ffmpeg", "-v", "error", "-y", "-ss", f"{s:.4f}", "-i", src, "-t", f"{d + 0.2:.4f}", "-vf", vf, "-frames:v", str(n),
         "-af", f"atrim=0:{d:.4f},asetpts=N/SR/TB,afade=t=in:d=0.01,afade=t=out:st={max(0, d - 0.04):.4f}:d=0.04,"
                f"apad=whole_dur={d:.4f}",
         "-ar", "48000", "-ac", "2", "-c:v", "libx264", "-crf", "12", "-preset", "fast", "-c:a", "pcm_s16le", str(out)])
    listing.append(f"file '{out}'")
    if not timeline or timeline[-1]["id"] != id(seg):
        timeline.append({"id": id(seg), "at": round(t, 4), "frame": seg.get("frame", "A"), "text": seg.get("text", "")})
    t += d
(tmp / "list.txt").write_text("\n".join(listing) + "\n")
joined = tmp / "joined.mov"
run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(tmp / "list.txt"), "-c", "copy", str(joined)])

# loudness: two passes, to -14 LUFS integrated and -1 dBTP (what Instagram, TikTok and YouTube normalise to)
r = subprocess.run(["ffmpeg", "-v", "info", "-i", str(joined), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json",
                    "-f", "null", "-"], capture_output=True, text=True).stderr
m = json.loads(r[r.rindex("{"):r.rindex("}") + 1])
ln = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
      f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
run(["ffmpeg", "-v", "error", "-y", "-i", str(joined), "-af", ln + ",aresample=48000", "-c:v", "libx264", "-crf", "16", "-preset",
     "slow", "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-c:a", "aac", "-b:a", "192k",
     "-movflags", "+faststart", str(E / "base.mp4")])
segs = [{"a": s["at"], "b": (timeline[i + 1]["at"] if i + 1 < len(timeline) else round(t, 4)), "frame": s["frame"], "text": s["text"]}
        for i, s in enumerate(timeline)]
(E / "segments.json").write_text(json.dumps(segs, ensure_ascii=False, indent=0))
R = E.resolve().parent.parent / "remotion"  # where the reel reads them: public/media/<name>/base.mp4, src/segments_<name>.json
if R.exists():
    (R / "public" / "media" / E.name).mkdir(parents=True, exist_ok=True)
    shutil.copy(E / "base.mp4", R / "public" / "media" / E.name / "base.mp4")
    shutil.copy(E / "segments.json", R / "src" / f"segments_{E.name}.json")
print(f"base.mp4: {t:.2f} s, {len(spec['segments'])} segments in {len(pieces)} pieces -> {E / 'base.mp4'}, {E / 'segments.json'}")
print(f"frames: {round(t * FPS)}  (set the reel's DURATION to this)")
