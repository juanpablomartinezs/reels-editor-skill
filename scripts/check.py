"""Check a finished reel before showing it.
Usage: check.py edit/<name>/<name>_vN.mp4
Stops loudly on the wrong size, frame rate or codec, or a length that is not base.mp4's; measures loudness (target
-14 LUFS integrated, true peak under -1 dBTP) and fixes it in place when it is more than 1 LU off (the sound effects
add a little); lists the silences over 0.25 s (after a cut there should be none)."""
import json, pathlib, re, subprocess, sys

final = pathlib.Path(sys.argv[1]); base = final.parent / "base.mp4"
def probe(p):
    s = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,codec_name,width,height,r_frame_rate,pix_fmt:"
                                   "format=duration", "-of", "json", str(p)], capture_output=True, text=True, check=True).stdout)
    v = next(x for x in s["streams"] if x["codec_type"] == "video"); n, d = map(int, v["r_frame_rate"].split("/"))
    return {"w": v["width"], "h": v["height"], "fps": n / d, "codec": v["codec_name"], "pix": v["pix_fmt"],
            "audio": any(x["codec_type"] == "audio" for x in s["streams"]), "dur": float(s["format"]["duration"])}
def loud(p):
    r = subprocess.run(["ffmpeg", "-v", "info", "-i", str(p), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
                       capture_output=True, text=True).stderr
    return json.loads(r[r.rindex("{"):r.rindex("}") + 1])

f = probe(final)
problems = [m for m, bad in [(f"size {f['w']}x{f['h']}", (f["w"], f["h"]) != (1080, 1920)), (f"{f['fps']:.3f} fps", abs(f["fps"] - 30) > 0.01),
    (f"codec {f['codec']}/{f['pix']}", f["codec"] != "h264" or f["pix"] != "yuv420p"), ("no audio", not f["audio"])] if bad]
if base.exists() and abs(probe(base)["dur"] - f["dur"]) > 0.05:
    problems.append(f"{f['dur']:.2f} s, base.mp4 is {probe(base)['dur']:.2f} s (DURATION in the reel file)")
print(f"{final.name}: {f['w']}x{f['h']} {f['fps']:.2f} fps {f['dur']:.2f} s " + ("OK" if not problems else "PROBLEMS: " + "; ".join(problems)))
if problems:
    sys.exit(1)

m = loud(final)
print(f"loudness {float(m['input_i']):.1f} LUFS, true peak {float(m['input_tp']):.1f} dBTP")
if abs(float(m["input_i"]) + 14) > 1 or float(m["input_tp"]) > -1:
    ln = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
          f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true,aresample=48000")
    tmp = final.with_suffix(".fix.mp4")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(final), "-c:v", "copy", "-af", ln, "-c:a", "aac", "-b:a", "192k",
                    "-movflags", "+faststart", str(tmp)], check=True)
    tmp.replace(final)
    m = loud(final)
    print(f"fixed: {float(m['input_i']):.1f} LUFS, {float(m['input_tp']):.1f} dBTP")

r = subprocess.run(["ffmpeg", "-v", "info", "-i", str(final), "-af", "silencedetect=n=-40dB:d=0.25", "-f", "null", "-"],
                   capture_output=True, text=True).stderr
gaps = [(float(a), float(b)) for a, b in re.findall(r"silence_end: ([\d.]+) \| silence_duration: ([\d.]+)", r)]
gaps = [(round(e - d, 2), d) for e, d in gaps if e < f["dur"] - 0.3]
print("silences over 0.25 s: " + (", ".join(f"{s} s ({d:.2f})" for s, d in gaps) if gaps else "none"))
