# Remotion kit: how a reel is built

The project lives in `remotion/` (a copy of the skill's `template/`). For Remotion's own APIs and flags, the official
Remotion skills (`remotion-best-practices`) help when installed; this file covers only what is ours.

## Files
- `src/ui.tsx`: BRAND (font, colours, caption look), FPS, LOCALE, and the motion primitives: `appleSpring(t, at,
  response, ratio)`, `ramp(t, a, b)`, `keys(t, [[time, value]...])`, `fadeOut`, `rise`, `track(px)`, `display(px)`,
  `Typed`, `fmt(n)`, `F(seconds)`, `fr(seconds)` (the frame a sound starting at that time lands on), `useT(a)`.
- `src/Reel.tsx`: `makeReel({ base, scenes, pieces, fx, captions, hide?, capTop?, look? })` and the types `Base`,
  `Scene {a, b, el, xf?}`, `Fx [time, sound, volume]`, `Caption`.
- `src/Pieces.tsx`: the ready pieces (below). `src/Phone.tsx`: `PhoneInsert` for app demos.
- `src/ExampleReel.tsx` + `captions_example.json`: a reel with no footage, to copy from and to test the setup.
- `src/Root.tsx`: one `<Composition>` per reel. `src/sfx.json`: the sound catalogue. `public/`: fonts, media, sfx.
- From cut.py: `public/media/<name>/base.mp4` (the cut) and `src/segments_<name>.json` (its sentences and framings).

## A reel
`src/Reel<name>.tsx`, copied from ExampleReel:
```tsx
import captions from "./captions_<name>.json";
import segments from "./segments_<name>.json";
export const DURATION_<name> = 1343;                      // base.mp4's frame count (cut.py prints it)
const SCENES: Scene[] = [ /* full screen, time order; captions hide under them; touching ones dissolve */ ];
const PIECES: Scene[] = [ /* in their frame; captions keep running */ ];
const FX: Fx[] = [[14.03, "whoosh", 0.1]];                // the sound's loudest moment lands on the time
export const Reel<name> = makeReel({
  base: { src: "media/<name>/base.mp4", segments, focus: [530, 730], punches: [2.33, 8.24] },
  scenes: SCENES, pieces: PIECES, fx: FX, captions, capTop: 1025 });
```
Every time is a word's onset in the cut's `edit/<name>/transcript.json` (word `s`), with a comment of the words it
lands on. Register it in Root.tsx: `<Composition id="Reel<name>" component={Reel<name>}
durationInFrames={DURATION_<name>} fps={FPS} width={W} height={H} />`.

- `base.focus`: the face's centre in px (faces.py: the median box's centre); framings and punch-ins scale around it.
- `base.punches`: onsets of the emphasis words (a handful per reel: the number, the result, the turn).
- `segments`: framing "A" or "B" per sentence, from the cut list; edit the json to change one without cutting again.
- `capTop`: the caption band's top edge (one number, or `[[time, top], ...]` steps that change on their b-roll).
- `hide`: extra windows with no captions. `look`: overrides BRAND.captions for this reel.

## Pieces (`Pieces.tsx`)
| piece | where | props |
|---|---|---|
| `HookFigure` | above the head | `to`, `from?`, `roll: [start, end]`, `top?`, `size?`, `suffix?` |
| `SeriesPill` | above the head | `day`, `total`, `at` (the day turns), `label?` ("Día"), `of?` ("de") |
| `Countdown` | above the head | `total`, `done`, `before?` ("Quedan"), `after?` ("días") |
| `Stickers` | above the head | `items: [{at, label, icon?, fill?: card/soft/accent}]`, `top?`, `h?` |
| `AppBanner` | above the head | `icon` (public/media path), `name`, `line1?`, `line2?`, `button?` ("Obtener") |
| `WordCard` | full screen, `xf: 0` | `words: [[onset, word], ...]`, `dark?` |
| `CommentsFeed` | full screen | `items: [{src, w, h, at}]` (screenshots at their pixel size), `scale?` |
| `Count`, `Slot` | inside your own pieces | fixed-width counting digits; a slot window swapping items on times |

A new piece follows the same shape: `({ a, b, ...times })`, `const t = useT(a)`, springs on the times, `fadeOut(t, b)`.
Read BRAND (`C.card`, `FONT`), never hard-code a colour or font. Pieces above the head sit at top ~250-370: measure
the hair (faces.py) and keep 50 px clear.

## App demos (`Phone.tsx`)
```tsx
const DEMO: Insert = {
  a: 19.1, b: 28.9, src: "media/rec_add.mp4",
  clips: [{ from: 1.5, to: 4.4, rate: 1.7 }, { from: 4.4, to: 8.1, xf: 0.4 }],    // stretches of the recording, back to back
  cam: [[19.1, 1, 0.5, 0.5], [20.1, 1.4, 0.5, 0.3], [22.5, 1.4, 0.5, 0.3]],     // [time, scale, focusX, focusY]
  spots: [{ x: 0.06, y: 0.09, w: 0.88, h: 0.1, r: 0.05, t: 19.7, until: 20.6 }], // screen fractions, measured
  taps: [{ t: 20.4 }], steps: [[19.1, "Step 1 · Add"]],
  shots: [{ src: "media/sheet.png", at: 24, sheet: 0.14 }],                       // a still; `sheet` slides up like iOS
  blurs: [{ x: 0.1, y: 0.5, w: 0.8, h: 0.06 }],
};
// as a scene: { a: DEMO.a, b: DEMO.b, el: <PhoneInsert ins={DEMO} /> }
```
Measure spot boxes on the frame shown at that time: pull it (`ffmpeg -ss <recording time> -i rec.mp4 -frames:v 1`),
find the control's edges (flood fill, OCR, or the pixel rows where the colour changes), divide by 1080x2348, and draw
the boxes on that frame to check before rendering.

## Stills (look while you build)
```bash
cd remotion && npx remotion still Reel<name> out/f.png --frame=N --image-format=png
```
The still includes the cut. To see the Example's pieces over one of the creator's videos:
`ffmpeg -ss 3 -i <video> -i out/example.png -frames:v 1 -filter_complex overlay still.png`. For many frames at once,
render the reel and pull frames from it. Test a caption band without editing code: `--props='{"capTop":1060}'`.

## Render
```bash
npx tsc --noEmit
npx remotion render Reel<name> ../edit/<name>/<name>_vN.mp4 --codec=h264 --crf=18
```
The voice comes from base.mp4 and the sound effects are mixed in. For margins.py, the same composition with
`--props='{"bare":true}'` renders the graphics alone on a transparent ground (`--codec=prores --prores-profile=4444
--pixel-format=yuva444p10le --image-format=png --scale=0.5` keeps it quick).

## Things that bite
- Inter loads from Google Fonts at render time (needs a connection); the creator's own font loads from public/fonts.
- `@remotion/media`'s `<Video>` needs CFR H.264; variable-rate phone recordings stutter until transcoded.
- `premountFor` is set on every layer so videos are ready when their scene starts.
- An unused import is a type error (`noUnusedLocals`): run `npx tsc --noEmit` before rendering.
