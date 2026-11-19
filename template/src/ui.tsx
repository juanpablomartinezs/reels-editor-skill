// The look of every piece, in one place, and the motion primitives they share. The skill fills BRAND from
// references/creator.md on the first run; every piece reads its font and colours from here, never its own.
import React from "react";
import { Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/fonts";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

// ---- the creator's look --------------------------------------------------------------------------------------------
// `font`: their own typeface, files in public/fonts/ by weight (a variable font can serve several weights); null uses
// Inter (OFL, loaded from Google Fonts at render time).
// `colors`: roles, not names. One accent, used once at a time. Text pairs: `onDark` on card/deep, `text` on canvas/soft.
export const BRAND = {
  font: null as null | { family: string; files: [weight: number, file: string][] },
  colors: {
    canvas: "#F2F2F4", // light full-screen canvas
    card: "#0D0D0F", // dark card, pill and canvas
    deep: "#2C2C30", // a second dark, for a second layer
    soft: "#D4D4DA", // a light pill or sticker fill (dark text on it)
    muted: "#6E6E73", // labels
    accent: "#FF5A1F", // the one accent: a dot, a marker, one word
    text: "#0D0D0F", // text on canvas and soft
    onDark: "#FFFFFF", // text on card and deep
  },
  // `byWord`: each word fades in on its own onset and the line's key word ("big" in the captions json) sits larger on
  // the same baseline; false: the whole line cuts on at once, one size. `top`: the band's top edge (under the chin).
  // `ink`: "light" = white with a soft shadow (reads on any shot), "dark" = text colour, no shadow (a light shirt)
  captions: { size: 50, weight: 600, big: 96, byWord: true, top: 1166, ink: "light" as "light" | "dark" },
};
export const C = BRAND.colors;

if (BRAND.font) for (const [w, file] of BRAND.font.files) loadFont({ family: BRAND.font.family, url: staticFile(`fonts/${file}`), weight: String(w) });
export const FONT = BRAND.font?.family
  ?? loadInter("normal", { weights: ["300", "400", "500", "600", "700", "800"], subsets: ["latin", "latin-ext"] }).fontFamily;

// ---- time ------------------------------------------------------------------------------------------------------------
export const FPS = 30; // cut.py makes every base.mp4 at 30 fps; check.py refuses a reel that is not
export const W = 1080, H = 1920;
export const F = (s: number) => Math.round(s * FPS);
// the frame a time falls on, the way captions and word cards cut: on the frame the sound starts
export const fr = (s: number) => Math.floor(s * FPS + 1e-6);
// absolute seconds on the cut; inside a <Sequence from={F(a)}> pass a
export const useT = (offset = 0) => useCurrentFrame() / FPS + offset;
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ---- motion ----------------------------------------------------------------------------------------------------------
// Apple's spring (damping ratio + response, WWDC "Designing Fluid Interfaces"), the exact step response 0 -> 1.
// ratio 1: no overshoot; 0.8 overshoots ~1.5%, 0.75 ~2.8%; keep it at 0.75 or more (references/style.md, Motion)
export const appleSpring = (t: number, at: number, response = 0.42, ratio = 1) => {
  const x = t - at;
  if (x <= 0) return 0;
  const w = (2 * Math.PI) / response;
  if (ratio >= 1) return 1 - (1 + w * x) * Math.exp(-w * x);
  const wd = w * Math.sqrt(1 - ratio * ratio);
  return 1 - Math.exp(-ratio * w * x) * (Math.cos(wd * x) + ((ratio * w) / wd) * Math.sin(wd * x));
};
// 0 -> 1 eased between two times (fills, bars, counts)
export const ramp = (t: number, a: number, b: number, ease = Easing.bezier(0.25, 0.1, 0.25, 1)) =>
  interpolate(t, [a, b], [0, 1], { ...clamp, easing: ease });
export const easeOut = (p: number) => (x: number) => 1 - Math.pow(1 - x, p);
// a short fade out, finished exactly at b
export const fadeOut = (t: number, b: number, d = 0.3) => 1 - ramp(t, b - d, b);
// piecewise smooth keyframes [[time, value], ...] (camera moves: slow in, slow out)
const smooth = Easing.bezier(0.45, 0, 0.25, 1);
export const keys = (t: number, k: [number, number][]) =>
  interpolate(t, k.map((p) => p[0]), k.map((p) => p[1]), { ...clamp, easing: smooth });
// stagger a child: fade + small rise at `at`
export const rise = (t: number, at: number, dist = 16): React.CSSProperties => {
  const k = appleSpring(t, at, 0.4);
  return { opacity: Math.min(1, k), transform: `translateY(${(1 - k) * dist}px)` };
};

// ---- type ------------------------------------------------------------------------------------------------------------
// tracking by size: tight on display, a little on titles and captions, none on small UI text
export const track = (px: number): React.CSSProperties => {
  const em = px >= 120 ? 0.04 : px >= 70 ? 0.025 : px >= 40 ? 0.015 : 0;
  return { fontFamily: FONT, fontSize: px, letterSpacing: `-${em}em`, lineHeight: 1 };
};
// the Display line: word cards and figures, 140-170 px on 1080
export const display = (px: number): React.CSSProperties => ({ ...track(px), fontWeight: 800, lineHeight: 0.9 });
// type-on: characters appear at `cps` from `at`; the untyped rest keeps its place, so centred text never shifts
export const Typed: React.FC<{ text: string; t: number; at: number; cps?: number }> = ({ text, t, at, cps = 40 }) => {
  const n = Math.max(0, Math.min(text.length, Math.floor((t - at) * cps)));
  return <>{text.slice(0, n)}<span style={{ opacity: 0 }}>{text.slice(n)}</span></>;
};
// thousands separator by the reel's language ("es-CO": 10.000, "en-US": 10,000)
export const LOCALE = "en-US";
export const fmt = (n: number) => Math.round(n).toLocaleString(LOCALE);
