# Style: what makes these reels read well and look premium

Defaults learned over dozens of real reels and hundreds of notes from a designer-creator. Sizes are for 1080x1920.
`creator.md` wins wherever it differs; the creator's notes win over both.

Contents: 1 The story and the cut · 2 Type · 3 Captions · 4 Full-screen moments · 5 Pieces in their frame ·
6 App demos · 7 Real proof · 8 Motion and camera · 9 Rhythm, length, safe zones · 10 Picture and sound ·
11 Sound effects · 12 Looks cheap · 13 Principles of the graphics

## 1. The story and the cut
Cuts that leave air read as amateur; this is the most important step.
- **Hook first**: the strongest sentence of the take (the most surprising claim, a number, a result), not the
  chronological start. Move it to the front. The face talks from the very first frame: never a silent lead-in or a
  graphic before the voice.
- **Retakes**: when a sentence is said twice, keep the LAST good take (creators repeat until it comes out right). Drop
  false starts, stutters, "um", "eh", repeated words, and a "so..." that starts a thought it never finishes.
- **Several takes**: build one story from the best sentence of each.
- **Tight on the audio**: each kept sentence starts 0.05 s before its first sound and ends 0.07 s after the voice drops;
  inside it, every pause of 0.14 s or more comes down to 0.12 s (cut.py). No gap over 0.25 s anywhere after a cut.
  Never cut inside a word; re-transcribe the cut and read it to be sure.
- Drop what repeats the hook's point or wanders; a 35-60 s reel says one thing.

## 2. Type
- One typeface for every word on screen: the creator's (creator.md), else Inter. No second "accent" font unless they ask.
- Display (word cards, figures): 140-170 px, Heavy/ExtraBold 800, tracking about -4%, leading ~0.9. Headlines 72-96 px
  Bold. Captions 48-56 px. Labels 36-40 px Regular, sentence case. **Nothing under 35 px**: it has to read on a phone.
- Tracking tightens as type grows (`track(px)` in ui.tsx); never tracked-out uppercase labels.
- Text on full-screen canvases is centred; a Display line over the creator's frame can anchor left on x 100.

## 3. Captions
- **3 words at most** on screen, never ending on a small word ("de", "the", "a") or a bare number; lowercase except
  names (or sentence case, per creator.md); no end punctuation; no box or pill behind them.
- **In sync with the voice, to the frame**: each line (or word) appears on the frame its first sound starts and the
  line leaves as the next one starts. Times come from transcribe.py (set on the audio), never from Whisper alone,
  which drifts 0.1-0.3 s; that drift is what makes captions feel cheap.
- Two looks (BRAND.captions in ui.tsx):
  - **by word** (default): the line set centred in place, each word fading in with a short blur on its own onset;
    filler words at ~50 px SemiBold, the line's one key word (the idea: "free", "10K", "follow") at ~96 px on the
    same baseline. A line with no clear key word stays all small. At most one big word per line.
  - **by line**: the whole line cuts on at once, one size. Calmer; good for long explanations.
- White with a soft dark shadow (it reads on any shot); never a glow, a hard drop shadow or an outline. Dark text with
  no shadow only on a plain light shirt, if the creator prefers it.
- **Where**: under the chin by default (faces.py prints the band). Move them where the shot needs it: off hands, a held
  phone, a print on a shirt; lower over b-roll so they cover nothing the shot shows (`capTop` takes [time, top] steps
  on the creator's cuts). Never over the mouth.
- **When**: captions run under pieces above the head and over the creator's own b-roll; only full-screen moments
  hide them (the face is gone). Set every full-screen edge inside a sentence on a word's onset and pass it to
  captions.py as a break, or the face comes back showing words already said under the card.
- A line under 0.45 s cannot be read: captions.py joins it to a neighbour when the two still make 3 words.
- Emojis, if the creator likes them: one at the end of a line, on a moment with feeling or a concrete thing, a handful
  per reel, never two in a row, never instead of a word.

## 4. Full-screen moments (they cover the face; captions hide)
Hold every moment with words on it for at least 2 s plus 0.3 s per word beyond three, counted while fully visible.
The state the viewer must read (the final number, "it's yours") rests 1.5-2.5 s; land each change a word early rather
than cut the rest short.
- **Word card**: the punch of a sentence, 1-3 words, at most one every 8-12 s. Display type on the brand's dark card or
  light canvas, flat (never scales). One word at a time, each replacing the last on the frame its sound starts; every
  word of the phrase, small ones too. A word said in 3 frames comes in during the end of the word before it so it
  holds ~10 frames. The card cuts in on its first word and out on the next phrase (`xf: 0`), no dissolve.
- **Status, platform by platform**: full-width flat bands (dark, second dark, light), the first filling the screen and
  each next rising under it on its figure, each with its real logo, name, the figure and "/ goal" with a progress pill.
- **Real comments** (section 7) stacking on the dark card.
- **A demo** (section 6).
- **Drawn moments**, for what has no real asset: a vector drawing (simple geometry, lines drawing themselves on), a
  typographic composition (a word with icons or construction lines: data and keywords, never the sentence) or motion
  UI (small cards, a list stacking with a count, a chart with a scrubber, a checklist lighting up). Vary the approach,
  never the same device twice in a row.
- **Quality bar**: render a still of every drawn moment and put it beside the reference it comes from. If it reads as
  clip art, a template or placeholder boxes (thin outlines, letter tiles, a card that only swaps screenshots), redraw
  it. Check mid-transition frames too: no two texts blended, no type cut by a mask, no jumps when a number gains a digit.

## 5. Pieces in their frame (captions keep running)
- **Above the head**: the hook's figure, the series pill ("Day 12 of 40"), stickers, a goal, an app banner. Clear the
  HAIR, not just the face, by 50 px (the face box starts mid-forehead; faces.py estimates the hair). Design for the real
  height there at real type sizes (35 px or more), never by shrinking a bigger card.
- **The hook's figure**: just the number counting up as they say it, white Display over the background; no canvas,
  logo or label. Centred on x 540 even if a hand is near.
- **Pills lean**: a row of pills tilts opposite ways (about -4..+4°) with small vertical offsets; a straight row reads
  static. The series pill stays level.
- **Stickers** on a figure or a phone overlap its edge by about a third of their height, 2-4 per frame, each a
  different fill.
- **An app banner** when the creator names their app: App Store-style (real icon, name, two short lines, the button),
  2 s from the frame the name is said. Prefer the app's real screen when the moment is about what the app does.
- Over the background, pieces are white or the brand's dark pill; dark type only where it sits on a light shirt.
- A small corner chip can run a joke on a word they repeat ("profile ×3 😅"), held ~1.6 s, the count ticking.

## 6. App demos (the creator's screen recording in an iPhone, `PhoneInsert`)
- The recording (iPhone: 1206x2622 variable frame rate) transcoded to H.264 1080x2348 **60 fps** CFR, so speed-ups
  step evenly: `ffmpeg -i rec.MP4 -vf "scale=1080:2348,fps=60" -c:v libx264 -crf 16 -an public/media/<name>.mp4`.
- **On their words, and fluid**: map the recording's events first (frame differences: every sheet, push, keypad,
  scroll), then cut stretches so each tap lands a beat before its word and each native animation plays at its own speed
  (rate ~1); speed up only still stretches (typing up to ~1.9x). Join stretches on identical frames or with a 0.4 s
  crossfade (`xf`); never a hard jump between different screens. Show an in-app transition whole.
- **Camera**: few, slow moves (0.6-0.8 s each, eased), pushing to what is named, up to ~2x; holds drift a few percent.
- **Spotlight** on what is named: the rest dims to ~34%, the hole shaped like the control. MEASURED on the exact frame
  shown at that time, never guessed (flood fill, edges, OCR plus even padding), then drawn on that frame and looked at.
  A control's hole is its edge plus ~6 screen px (`pad`); a row or menu item is its own edge (`fit`). Consecutive spots
  glide as one hole. A tap presses the hole in a little; no grey touch circles, no coloured rings.
- An iOS sheet just slides up with its rounded top corners; the screen behind is not dimmed.
- The creator's own data can show; other people's names, photos and messages are blurred or kept out.
- **Never leave them reading their phone on camera**: carry the demo over every frame where they look down at it.
- No recording for a flow? Ask for one; draw the UI only if there is none to give.

## 7. Real proof
- **Comments**: screenshots in dark mode (as most people see the apps), cropped to avatar + name + text (no reply row,
  no like count), all at one scale. Many when they open a point, one by one with a soft click when they prove it;
  a hand-drawn marker across the words that say it. Other people's names are public there; private messages are not.
- **Numbers**: only the ones the creator says, checked against the audio. A count that runs fast ticks in fixed-width
  digits (`Count`); a word or number that changes swaps through a slot window (`Slot`), never two crossfading in place.
- Their Instagram, App Store or analytics screens: fresh screenshots taken for this reel (counts change).

## 8. Motion and camera
- **Camera life on the cut**: two framings, wide (A) and punched in 8% (B), alternating on sentence starts so every jump
  cut looks intentional; a soft 6% punch-in on a handful of emphasis words, easing back (`punches`). Both scale around
  the face, so the head stays in frame. No other zooms, shakes or whip pans on the face.
- Springs, never fixed tweens (`appleSpring`): critically damped (ratio 1) or at most ~3% overshoot (ratio 0.75+),
  response 0.4-0.5 s. Entries 0.3-0.5 s; exits short fades (0.3 s) along the same path; children staggered 0.06-0.1 s.
- Motion never stops dead: on holds, a slow drift or push of a few percent; springs that add up between targets;
  numbers rolling with what they measure.
- Quiet transitions: a 0.15 s dissolve between the face and a full-screen moment; a word card cuts.
- Phones are rigid: they rise, float, slide or turn; they never stretch, morph or grow from a point.
- Never cut type with its own mask: a slot window clips only above and below (`clipPath: inset(0 -100% 0 -100%)`),
  1.5x the type size, because display glyphs reach past their boxes at the sides.
- Everything is driven by the frame in Remotion; no CSS animations.

## 9. Rhythm, length, safe zones
- The face talks from frame 1; the first graphic lands by ~1.2 s. Something new every ~2 s; nothing static over 3 s.
  Come back to the face between ideas: an opinion reel shows them about half the time, a tutorial at least a quarter.
- Their own b-roll and product shots are footage, not gaps: no graphics over them (captions yes, placed off them).
- **Safe zones** (Instagram, TikTok, Shorts): nothing that matters above y 250 or below y 1500 (captions to ~1580), nothing
  in the right button column (x over 930) between y 1000 and 1500, nothing within 100 px of the left or right edge.
  Content lives in x 100-980. When a layout does not fit, shrink or split it, never the margin.

## 10. Picture and sound
- **Colour stays as shot**: no filters, LUTs, "warming" or skin smoothing unless the creator asks (creator.md says if
  they want a grade). iPhone HDR is tone-mapped to SDR once (cut.py); nothing else touches the colour.
- A full-screen moment paints its own opaque canvas; a piece paints only itself; captions only their words. Never
  split the screen with the face, shrink it into a card or add a vignette.
- **Loudness**: the voice at -14 LUFS integrated, true peak under -1 dBTP (what the platforms normalise to); cut.py
  sets it, check.py re-checks after the sound effects.
- **Music**: none unless the creator wants it; then low under the voice (about -20 dB under it), ducked further while
  they talk, from a licensed source.
- End on their face and their last words, with captions; a closing logo card reads as an ad.

## 11. Sound effects
- None ship with the skill (sound libraries are licensed). The creator brings their own (their library, Epidemic
  Sound, Artlist, or free ones from Pixabay or Mixkit, each under its own licence) into `remotion/public/sfx/<name>.wav`,
  and each gets an entry in `remotion/src/sfx.json`: `{"name", "role", "desc", "dur", "peak"}` (peak: seconds to its
  loudest moment, which is what lands on the cue: `ffmpeg -i x.wav -af astats=metadata=1:reset=1,ametadata=print -f null -`
  or just look at the waveform).
- Roles: a whoosh on the cut into or out of a full-screen moment; a soft click as each item lands; a tick under a
  count while it rolls; a confirmation on a done state; a riser at most once per reel, on a reveal.
- Sparse, like the visuals: not every graphic gets a sound; one choice per role within a reel; taps inside a demo
  silent or very soft. Peaks ~15 dB under the voice, never covering a word.

## 12. Looks cheap (avoid unless the creator asks)
- Glows, gradients, light sweeps, lens flares; pure black canvases when the brand has a dark colour.
- Diagonal wipes, glitch, spins, a phone flying in on a tilted plane with motion blur, any morph that deforms a phone.
- Rippling or coloured rings and grey touch circles on taps; a dark dim behind an iOS sheet.
- Caption boxes, pills, glows, outlines, bounce or letter-spacing animation; captions over 3 words.
- The spoken sentence typeset as a graphic; labels repeating the words; letter tiles instead of real logos.
- Thin-outline placeholder drawings; a check badge on a word card; a block of colour behind a number.
- Split screen, vignettes, A/B punch-in jumps on the creator's clip; a closing logo or "download now" card.

## 13. Principles of the graphics
- **Graphics support, they never transcribe.** The voice carries the sentence; the graphic shows the idea: the
  number, the logos, the app, the result. Never typeset the sentence being said as the graphic (it reads like a
  sing-along and fights the voice). Text on a graphic is data: a figure, a label, a name, an app's own UI. The one
  exception is the word card (section 4), the punch of a sentence.
- **Every concrete thing named gets a picture at that moment**: an app its real icon, a tool its real logo, a number a
  figure that counts, a website its real page, "my app" its real screen. It lands 0.1-0.2 s before the word.
- **Real first, then drawn.** When a real recording or screenshot exists, use it, in the state a viewer would see.
  For anything else they name, draw it, well (section 4, "Drawn moments"). Never present a generated image as a real
  screenshot, result or number; use only the numbers the creator says.
- **One idea per moment, one object per idea.** One object carries the sentence and changes state on the words (a
  pill whose number rolls, then whose label swaps, then that gets a sticker), instead of a new card for every clause.
- **Their brand, every time.** Their font and colours from creator.md, one accent used once at a time. Flat fields,
  no gradients or glows. Consistency is what makes a series recognisable.
