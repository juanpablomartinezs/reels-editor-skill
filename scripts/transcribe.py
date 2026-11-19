"""Transcript with word times set on the audio, on device.
Usage: transcribe.py VIDEO OUT_DIR [LANG] [--no-align]
  VIDEO: a raw take (to pick the story from) or the cut, base.mp4 (to time everything from); OUT_DIR: edit/<name>/...
  LANG: es, en, pt, fr, ... (default: detected by Whisper)
  -> OUT_DIR/transcript.json  [{start, end, text, lang, words: [{w, s, e, p}]}]   OUT_DIR/transcript.txt
Whisper (faster-whisper large-v3-turbo, ~1.6 GB, cached in ~/.cache/huggingface) writes the words; its word times drift
0.1-0.3 s, which shows as captions arriving early or late. So each word is placed again on the audio: Meta's MMS forced
aligner (torchaudio MMS_FA, ~1.2 GB in ~/.cache/torch) finds it, then the level of the audio sets its onset (the rise
after the quiet before it, or the dip between two words in running speech): 0-20 ms from the real onsets on clear
speech. Latin-script languages only (the aligner reads a-z). --no-align keeps Whisper's own times (the MMS weights are
CC BY-NC 4.0: skip it if that licence does not fit your use).
Words where Whisper and the audio disagree by over 0.3 s are listed at the end: usually a retake left in, a repeated or
missing phrase. Listen to them before timing anything there.
NAMES fixes names Whisper gets wrong (brands, apps, people); add the creator's at setup."""
import json, pathlib, re, subprocess, sys, unicodedata
import numpy as np

NAMES = {r"\bApp ?store\b": "App Store", r"\bTik ?tok\b": "TikTok", r"\bYou ?tube\b": "YouTube", r"\bChat ?GPT\b": "ChatGPT"}
args = [a for a in sys.argv[1:] if not a.startswith("--")]
audio, out = args[0], pathlib.Path(args[1])
lang = args[2] if len(args) > 2 else None
out.mkdir(parents=True, exist_ok=True)
fix = lambda s: [s := re.sub(k, v, s, flags=re.I) for k, v in NAMES.items()][-1] if NAMES else s

from faster_whisper import WhisperModel
model = WhisperModel("mobiuslabsgmbh/faster-whisper-large-v3-turbo", device="cpu", compute_type="int8")
pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", audio, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
                     capture_output=True, check=True).stdout
a = np.frombuffer(pcm, np.float32).copy()  # decoded with ffmpeg: faster-whisper's own decoder breaks on some av versions
segs, info = model.transcribe(a, language=lang, word_timestamps=True, vad_filter=False, beam_size=5)
lang = lang or info.language
data = [{"start": s.start, "end": s.end, "text": fix(s.text.strip()), "lang": lang,
         "words": [{"w": fix(w.word), "s": w.start, "e": w.end, "p": round(w.probability, 3)} for w in s.words]}
        for s in segs]
words = [w for s in data for w in s["words"]]

doubt = []
if "--no-align" not in sys.argv:
    import torch, torchaudio
    from num2words import num2words
    fa = torchaudio.pipelines.MMS_FA
    wav2vec, idx = fa.get_model(with_star=False).eval(), {c: i for i, c in enumerate(fa.get_labels(star=None))}
    em = []  # emissions every 20 ms, in 20 s pieces with 1 s of context so long cuts fit in memory
    for c0 in range(0, len(a), 320000):
        s0 = max(0, c0 - 16000)
        with torch.inference_mode():
            e = wav2vec(torch.from_numpy(a[s0:c0 + 336000])[None])[0][0]
        em.append(e[(c0 - s0) // 320:][:1000])
    lp = torch.cat(em)[None]
    def spoken(m):
        try: return num2words(int(m.group()), lang=lang)
        except NotImplementedError: return num2words(int(m.group()))
    # the aligner reads plain a-z: numbers spelled out in the reel's language, accents dropped
    spell = lambda w: [c for c in unicodedata.normalize("NFD", re.sub(r"\d+", spoken, w.lower())) if c in idx and c not in "-'"]
    chars = [spell(w["w"]) for w in words]
    ali, sc = torchaudio.functional.forced_align(lp, torch.tensor([[idx[c] for cs in chars for c in cs]], dtype=torch.int32))
    spans = iter(torchaudio.functional.merge_tokens(ali[0], sc[0].exp()))
    n = len(a) // 80  # the level every 5 ms; "quiet" sits 22 dB under the loud end of the speech
    db = np.convolve(20 * np.log10(np.sqrt((a[:n * 80].reshape(n, 80) ** 2).mean(1)) + 1e-9), np.ones(3) / 3, "same")
    quiet, prev = np.percentile(db, 80) - 22, 0.0
    for w, cs in zip(words, chars):
        if not cs:
            continue  # a lone symbol: nothing to align, keeps Whisper's times
        sp = [next(spans) for _ in cs]
        s, e = sp[0].start * 0.02, sp[-1].end * 0.02
        lo, hi = max(int(prev / 0.005), int((s - 0.25) / 0.005)), int(s / 0.005) + 4
        q = np.where(db[lo:hi] < quiet)[0]
        onset = (lo + (q[-1] + 1 if len(q) else int(np.argmin(db[lo:hi])))) * 0.005 if hi > lo else s
        if abs(onset - w["s"]) > 0.3:
            doubt.append(f'{w["s"]:.2f} "{w["w"].strip()}" -> {onset:.2f}')
        w["s"], w["e"], prev = round(onset, 3), round(max(e, onset + 0.05), 3), e
for s in data:
    ws = s["words"]  # Whisper splits "5.000" / "4.9" into " 5" + ".000": one word again
    for i in range(len(ws) - 1, 0, -1):
        if re.match(r"[.,]\d", ws[i]["w"]) and re.search(r"\d$", ws[i - 1]["w"]):
            ws[i - 1] = {**ws[i - 1], "w": ws[i - 1]["w"] + ws[i]["w"], "e": ws[i]["e"]}; del ws[i]
    s["start"], s["end"] = s["words"][0]["s"], s["words"][-1]["e"]

(out / "transcript.json").write_text(json.dumps(data, ensure_ascii=False, indent=0))
(out / "transcript.txt").write_text("\n".join(f"{s['start']:7.2f}-{s['end']:7.2f}  {s['text']}" for s in data) + "\n")
print(f"{len(data)} segments, {len(words)} words ({lang}) ->", out / "transcript.json")
if doubt:
    print("listen to these (Whisper and the audio disagree):", "; ".join(doubt))
