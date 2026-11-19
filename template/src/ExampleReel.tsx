// An example reel that renders without any footage, to see the pieces and test the setup:
// npx remotion still Example out/example.png --frame=20 --image-format=png
// A real reel copies this file to Reel<name>.tsx, sets DURATION to base.mp4's frame count (cut.py prints it), adds
// `base` and lists what happens when; every time is a word's onset from the transcript of base.mp4.
import captions from "./captions_example.json";
import { Fx, Scene, makeReel } from "./Reel";
import { Countdown, HookFigure, SeriesPill, Stickers, WordCard } from "./Pieces";
import { F } from "./ui";

export const DURATION_EXAMPLE = F(10);

// full-screen moments: they cover the creator and hide the captions; a word card cuts (xf: 0)
const SCENES: Scene[] = [
  { a: 6.4, b: 7.5, xf: 0, el: <WordCard a={6.4} b={7.5} words={[[6.4, "comment"], [6.95, "“app”"]]} /> },
];
// pieces in the creator's frame, above the head; captions keep running under the chin
const PIECES: Scene[] = [
  { a: 0, b: 3.7, el: <HookFigure a={0} b={3.7} to={10000} roll={[0.2, 1.0]} /> }, // "If we reach 10,000"
  { a: 3.7, b: 6.4, el: <SeriesPill a={3.7} b={6.4} day={12} total={40} at={4.4} /> }, // "this is day 12"
  { a: 7.5, b: 9.1, el: <Stickers a={7.5} b={9.1} items={[{ at: 7.5, label: "✓ Comment “app”", fill: "soft" }, { at: 7.9, label: "Share" }]} /> },
  { a: 9.1, b: 10, el: <Countdown a={9.1} b={10} total={40} done={12} /> }, // "see you tomorrow"
];
// sound effects: [time, name in sfx.json, volume]; none ship with the template (bring your own, references/style.md)
const FX: Fx[] = [];

// a real reel adds the cut: base: { src: "media/<name>/base.mp4", segments, focus: [540, 680], punches: [3.0, 7.9] }
export const ExampleReel = makeReel({ scenes: SCENES, pieces: PIECES, fx: FX, captions });
