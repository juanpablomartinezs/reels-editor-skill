"""Caption lines for the reel, from transcribe.py's transcript of the cut (base.mp4).
Usage: captions.py TRANSCRIPT.json OUT.json [BREAKS] [--lower]
  -> [{"start", "end", "words": [{"w", "t"}]}] seconds; each word keeps its onset, so it appears on the frame its sound
     starts and never before it is said
Rules: never more than 3 words; never ending a line on a small word ("de", "the", "a") or a bare number; a small word
stays with what follows even across a pause; a break on a breath beats one inside a run-together pair; a line under
0.45 s joins a neighbour (still 3 words at most, never across a sentence end). Punctuation goes, except inside numbers.
BREAKS: comma-separated times; the first word at or after each starts a new line. Pass every full-screen moment's edges
that fall inside a sentence and the first word of each word card, so no line straddles a graphic.
--lower: lowercase everything except words Whisper capitalised mid-sentence (names); NAMES below fixes the rest.
Lines still under 0.45 s are listed at the end: cover them with a graphic or accept them knowingly."""
import json, pathlib, re, sys

args = [a for a in sys.argv[1:] if not a.startswith("--")]
data = json.loads(pathlib.Path(args[0]).read_text())
lang = (data[0].get("lang") if data else None) or "en"
SMALL = {
    "es": "el la los las de del a al y o en que un una lo le se te me mi tu con por para su es si este esta estos estas ese esa "
          "esos esas mis tus sus nuestro nuestra",
    "en": "the a an and or of to in on at for with by from my your our their his her its is are was be that this these those as if",
    "pt": "o a os as de do da dos das e ou em no na nos nas um uma que se com por para meu minha seu sua é",
    "fr": "le la les de du des un une et ou en au aux à que qui se ce cette ces mon ma mes ton ta son sa est pour par avec",
    "it": "il lo la i gli le di del della e o in a al da che un una per con mio mia è",
    "de": "der die das den dem des ein eine einen und oder in im zu zum zur mit von für auf an ist mein meine",
}
FUNC = set(SMALL.get(lang, SMALL["en"]).split())
NAMES = {"app store": "App Store", "tiktok": "TikTok", "youtube": "YouTube", "instagram": "Instagram", "facebook": "Facebook",
         "whatsapp": "WhatsApp", "google": "Google", "apple": "Apple", "iphone": "iPhone", "ios": "iOS", "chatgpt": "ChatGPT"}

clean = lambda w: re.sub(r"[.,](?!\d)|(?<!\d)[.,]|[;:!?¿¡…\"]", "", w)  # punctuation out, not the point inside "5.000"
words = [{"w": w["w"].strip(), "s": w["s"], "e": w["e"]} for seg in data for w in seg["words"]]
for i in range(len(words) - 1, 0, -1):  # "App" + "Store" is one name, never split across lines
    if clean(words[i]["w"]).lower() == "store" and clean(words[i - 1]["w"]).lower() == "app":
        words[i - 1] = {"w": "App " + words[i]["w"], "s": words[i - 1]["s"], "e": words[i]["e"]}; del words[i]
# a capital after the start of a sentence is a name: keep it under --lower
for i, w in enumerate(words):
    w["name"] = i > 0 and not re.search(r"[.?!]$", words[i - 1]["w"]) and clean(w["w"])[:1].isupper()
def show(w):
    c = clean(w["w"])
    if c.lower() in NAMES: return NAMES[c.lower()]
    return c.lower() if "--lower" in sys.argv and not w["name"] else c
small = lambda w: clean(w["w"]).lower() in FUNC
number = lambda w: re.fullmatch(r"\d[\d.,]*", clean(w["w"]))
BREAKS = [float(x) for x in args[2].split(",")] if len(args) > 2 else []
FORCED = {id(next(w for w in words if w["s"] >= b - 0.05)) for b in BREAKS if any(w["s"] >= b - 0.05 for w in words)}
forced = lambda w: id(w) in FORCED
punct = lambda w: re.search(r"[.,;:?!]$", w["w"])
sentence_end = lambda w: re.search(r"[.?!]$", w["w"])

# phrases: split at punctuation, a forced break, or a pause over 0.25 s that is not after a small word or a number
phrases, cur = [], []
for w in words:
    tied = (small(cur[-1]) or number(cur[-1])) if cur else False
    if cur and (forced(w) or punct(cur[-1]) or (w["s"] - cur[-1]["e"] > 0.25 and not tied)):
        phrases.append(cur); cur = []
    cur.append(w)
if cur: phrases.append(cur)

def cost(ph, i, j, nxt):
    """ph[i:j] as one line, followed by something starting at nxt"""
    last, inner = ph[j - 1], j < len(ph)
    c = 1.0  # fewer, fuller lines
    if inner and (small(last) or number(last)): c += 2  # never end on "de", "the" or a bare "12"
    if j - i == 1 and small(ph[i]): c += 1.5  # a lone "y" / "and"
    if nxt - ph[i]["s"] < 0.45: c += 1.5  # too short to read
    if inner: c -= min(ph[j]["s"] - last["e"], 0.2) * 5  # break on a breath
    return c

merged = []  # each phrase split into 1-3 word lines, cheapest first
for k, ph in enumerate(phrases):
    nxt_s = phrases[k + 1][0]["s"] if k + 1 < len(phrases) else 1e9
    after = nxt_s if nxt_s - ph[-1]["e"] < 0.6 else ph[-1]["e"] + 0.25
    best = [(0.0, 0)] + [(float("inf"), 0)] * len(ph)
    for j in range(1, len(ph) + 1):
        for i in range(max(0, j - 3), j):
            c = best[i][0] + cost(ph, i, j, ph[j]["s"] if j < len(ph) else after)
            if c < best[j][0]: best[j] = (c, i)
    cut, j = [], len(ph)
    while j:
        cut.insert(0, ph[best[j][1]:j]); j = best[j][1]
    merged += cut

dur = lambda i: (merged[i + 1][0]["s"] if i + 1 < len(merged) else merged[i][-1]["e"] + 0.25) - merged[i][0]["s"]
i = 0
while i < len(merged):  # a line under 0.45 s cannot be read: it joins a neighbour
    if dur(i) < 0.45:
        ends = punct(merged[i][-1])
        if not ends and i + 1 < len(merged) and len(merged[i]) + len(merged[i + 1]) <= 3 and not forced(merged[i + 1][0]):
            merged[i:i + 2] = [merged[i] + merged[i + 1]]; continue
        if i > 0 and len(merged[i - 1]) + len(merged[i]) <= 3 and not forced(merged[i][0]) and not sentence_end(merged[i - 1][-1]):
            merged[i - 1:i + 1] = [merged[i - 1] + merged[i]]; i -= 1; continue
    i += 1

out = []
for i, ch in enumerate(merged):
    nxt = merged[i + 1][0]["s"] if i + 1 < len(merged) else None
    end = nxt if nxt is not None and nxt - ch[-1]["e"] < 0.6 else ch[-1]["e"] + 0.25
    out.append({"start": round(ch[0]["s"], 3), "end": round(end, 3), "words": [{"w": show(w), "t": round(w["s"], 3)} for w in ch]})
pathlib.Path(args[1]).write_text(json.dumps(out, ensure_ascii=False, indent=0))
text = lambda c: " ".join(w["w"] for w in c["words"])
print(len(out), "lines;", " | ".join(map(text, out)))
short = [f'{c["start"]:.2f} "{text(c)}" {c["end"] - c["start"]:.2f}s' for c in out if c["end"] - c["start"] < 0.45]
if short:
    print("under 0.45 s (cover with a graphic, or accept knowingly):", "; ".join(short))
