// The machinery every reel shares: the cut (base.mp4 from cut.py) with its framing and punch-ins, two layers of
// graphics, the captions windowed around the full-screen moments, and the sound effects. A reel file (see
// ExampleReel.tsx) only lists what happens when.
import React from "react";
import { AbsoluteFill, Easing, Sequence, getInputProps, staticFile, useCurrentFrame } from "remotion";
import { Audio, Video } from "@remotion/media";
import SFX from "./sfx.json";
import { BRAND, C, F, FONT, appleSpring, fr, ramp, track, useT } from "./ui";

// a graphic from a to b (seconds on the cut). `xf`: its dissolve (scenes only; 0 cuts)
export type Scene = { a: number; b: number; el: React.ReactNode; xf?: number };
// [time on the cut, sound name in sfx.json, volume]; the sound's loudest moment (`peak`) lands on the time
export type Fx = [number, string, number];
// captions.py's output: each word with its onset; `big` marks the line's key word
export type Caption = { start: number; end: number; words: { w: string; t: number; big?: boolean }[] };
export type CaptionLook = Partial<typeof BRAND.captions>;

// caption pieces left over where no full-screen moment covers the face; slivers under 0.35 s are dropped
const windowed = (list: Caption[], graphics: [number, number][]) => list.flatMap((c) => {
  let pieces: [number, number][] = [[c.start, c.end]];
  for (const [a, b] of graphics) {
    pieces = pieces.flatMap(([s, e]): [number, number][] =>
      b <= s || a >= e ? [[s, e]] : ([[s, Math.min(e, a)], [Math.max(s, b), e]] as [number, number][]).filter(([x, y]) => y > x));
  }
  const whole = pieces.length === 1 && pieces[0][0] === c.start && pieces[0][1] === c.end;
  return pieces.filter(([s, e]) => whole || e - s >= 0.35).map(([s, e]) => ({ words: c.words, start: s, end: e }));
});

const SHADOW = "0 2px 14px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.35)"; // soft, never a glow or a hard drop
// `at`: one band, or [time, top] steps that change on the creator's cuts (a b-roll shot that needs the band lower)
const Captions: React.FC<{ list: Caption[]; at: number | [number, number][]; look: typeof BRAND.captions }> = ({ list, at, look }) => {
  const f = useCurrentFrame();
  const top = typeof at === "number" ? at : [...at].reverse().find(([t]) => f >= fr(t))?.[1] ?? at[0][1];
  const c = list.find((c) => f >= fr(c.start) && f < fr(c.end));
  if (!c) return null;
  const ink = look.ink === "dark" ? { color: C.text } : { color: "#fff", textShadow: SHADOW };
  if (!look.byWord) return (
    <div style={{ position: "absolute", left: 100, right: 100, top, textAlign: "center", ...track(look.size), fontWeight: look.weight, ...ink }}>
      {c.words.map((w) => w.w).join(" ")}
    </div>
  );
  // a long key word ("automatically") shrinks until the line fits x 150-930, clear of the platforms' buttons (~0.56 em per char)
  const words = c.words.map((w) => ({ ...w, txt: w.w.split(" ")[0] }));
  const small = words.filter((w) => !w.big).reduce((s, w) => s + w.txt.length * look.size * 0.56, 0) + (words.length - 1) * look.size * 0.22;
  const bigChars = words.filter((w) => w.big).reduce((s, w) => s + w.txt.length, 0);
  const big = bigChars ? Math.max(look.size, Math.min(look.big, (780 - small) / (bigChars * 0.56))) : look.big;
  return (
    // a zero-width strut at the big size keeps the baseline still whether or not the line has a big word
    <div style={{ position: "absolute", left: 100, right: 100, top: top - (look.big - look.size) * 0.8, display: "flex",
      justifyContent: "center", alignItems: "baseline", columnGap: look.size * 0.22, fontFamily: FONT, fontWeight: look.weight, ...ink }}>
      <span style={{ ...track(look.big), width: 0, overflow: "hidden" }}>{"​"}</span>
      {c.words.map((w) => {
        const k = ramp(f, fr(w.t) - 1, fr(w.t) + 3, Easing.out(Easing.cubic)); // ~60% on its onset frame, whole 3 frames on
        const [txt, ...emoji] = w.w.split(" ");
        return (
          <span key={w.t} style={{ ...track(w.big ? big : look.size), fontWeight: look.weight, opacity: k,
            filter: k < 1 ? `blur(${6 * (1 - k)}px)` : undefined }}>
            {txt}{emoji.length ? <span style={track(look.size)}> {emoji.join(" ")}</span> : null}
          </span>
        );
      })}
    </div>
  );
};

const peakOf = (name: string) => (SFX as { name: string; peak: number }[]).find((s) => s.name === name)?.peak ?? 0;
const Sounds: React.FC<{ fx: Fx[] }> = ({ fx }) => (
  <>{fx.map(([t, name, v]) => (
    <Sequence key={`${t}${name}`} from={Math.max(0, F(t - peakOf(name)))} layout="none">
      <Audio src={staticFile(`sfx/${name}.wav`)} volume={v} />
    </Sequence>
  ))}</>
);

const XF = 0.15; // the default dissolve between the face and a full-screen moment
const Fade: React.FC<{ a: number; b: number; xf: number; out: boolean; children: React.ReactNode }> = ({ a, b, xf, out, children }) => {
  const t = useT(a);
  const o = xf ? Math.min(ramp(t, a, a + xf), out ? 1 - ramp(t, b - xf, b) : 1) : 1;
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};
const Layer: React.FC<{ list: Scene[]; fade: boolean }> = ({ list, fade }) => (
  <>{list.map((s, i) => {
    const touches = i + 1 < list.length && Math.abs(list[i + 1].a - s.b) < 0.01;
    const end = touches ? s.b + (list[i + 1].xf ?? XF) : s.b; // stay opaque under the next scene while it dissolves in
    return (
      <Sequence key={s.a} from={F(s.a)} durationInFrames={Math.max(1, F(end) - F(s.a))} premountFor={30}>
        {fade ? <Fade a={s.a} b={s.b} xf={s.xf ?? XF} out={!touches}>{s.el}</Fade> : s.el}
      </Sequence>
    );
  })}</>
);

// The cut. `segments` (cut.py's segments.json) give each sentence its framing: "A" wide, "B" punched in 8%, switching
// on the jump cut; `punches`: emphasis words (onsets) that push in 6% and ease back; both scale around `focus`, the
// face's centre (faces.py on base.mp4), so the head stays in frame
export type Base = { src: string; segments: { a: number; b: number; frame: string }[]; focus?: [number, number]; punches?: number[] };
const BaseVideo: React.FC<{ base: Base }> = ({ base }) => {
  const t = useT();
  const seg = base.segments.find((s) => t >= s.a && t < s.b);
  const punch = Math.max(0, ...(base.punches ?? []).map((p) => appleSpring(t, p - 0.08, 0.35) - appleSpring(t, p + 0.9, 0.7)));
  const [fx, fy] = base.focus ?? [540, 700];
  return (
    <AbsoluteFill style={{ transform: `scale(${(seg?.frame === "B" ? 1.08 : 1) * (1 + 0.06 * punch)})`, transformOrigin: `${fx}px ${fy}px` }}>
      <Video src={staticFile(base.src)} style={{ width: 1080, height: 1920 }} />
    </AbsoluteFill>
  );
};

// A reel: the cut underneath, everything else above it.
// `scenes`: full-screen moments in time order (they cover the face; captions hide under them; touching ones dissolve).
// `pieces`: graphics in the creator's frame (above the head, a card, a chip; captions keep running under them).
// `hide`: extra windows with no captions (a b-roll shot whose own text would clash), on top of the scenes.
// Props for a test render: `--props='{"capTop":1060}'` moves the caption band; `--props='{"bare":true}'` leaves the cut
// out (graphics on a transparent ground, for margins.py)
export const makeReel = (r: { base?: Base; scenes: Scene[]; pieces: Scene[]; fx: Fx[]; captions: Caption[]; hide?: [number, number][];
  capTop?: number | [number, number][]; look?: CaptionLook }) => {
  const list = windowed(r.captions, [...r.scenes.map((s) => [s.a, s.b] as [number, number]), ...(r.hide ?? [])]);
  const P = getInputProps() as Record<string, string>;
  const look = { ...BRAND.captions, ...r.look };
  const top = P.capTop ? Number(P.capTop) : r.capTop ?? look.top;
  const bare = Boolean(P.bare);
  const Reel: React.FC = () => (
    <AbsoluteFill style={{ background: r.base && !bare ? "#000" : undefined }}>
      {r.base && !bare && <BaseVideo base={r.base} />}
      <Layer list={r.pieces} fade={false} />
      <Layer list={r.scenes} fade />
      <Captions list={list} at={top} look={look} />
      {!bare && <Sounds fx={r.fx} />}
    </AbsoluteFill>
  );
  return Reel;
};
