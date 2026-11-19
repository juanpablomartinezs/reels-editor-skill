// Ready pieces, each one tested on real reels. Every piece takes its window (a, b: seconds on the cut) and renders
// inside <Sequence from={F(a)}>, so useT(a) gives absolute seconds. Times inside (at, roll, items) are also seconds on
// the cut: word onsets from transcript.json. Font and colours come from BRAND (ui.tsx).
// Pieces in the creator's frame sit above the head (top ~250-370 on most framings: measure the hair with faces.py and
// leave 50 px); scenes (WordCard, CommentsFeed) paint the whole frame.
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { C, F, FONT, FPS, appleSpring, display, easeOut, fadeOut, fmt, fr, ramp, track, useT } from "./ui";

const W60 = "rgba(255,255,255,0.6)", W22 = "rgba(255,255,255,0.22)";
const enter = (t: number, at: number) => appleSpring(t, at, 0.45, 0.8);
// a pill row above the head: in on a soft spring from 24 px lower, out as a short fade
const Above: React.FC<{ t: number; a: number; b: number; top?: number; children: React.ReactNode }> = ({ t, a, b, top = 266, children }) => {
  const k = enter(t, a);
  return (
    <AbsoluteFill style={{ fontFamily: FONT, opacity: Math.min(1, k * 2.5) * fadeOut(t, b) }}>
      <div style={{ position: "absolute", left: 0, right: 0, top, display: "flex", justifyContent: "center",
        transform: `translateY(${(1 - k) * 24}px) scale(${0.94 + 0.06 * k})` }}>{children}</div>
    </AbsoluteFill>
  );
};

// ---- numbers ---------------------------------------------------------------------------------------------------------
// a fast count ticks in fixed-width digit boxes (no drum); `pad` holds the final width from the first frame, so the
// figure never jumps when it gains a digit
export const Count: React.FC<{ n: number; size: number; color: string; pad?: string; weight?: number }> = ({ n, size, color, pad, weight = 800 }) => {
  const s = fmt(n), full = pad ?? s, chars = [...full.slice(0, Math.max(0, full.length - s.length)).replace(/./g, " "), ...s];
  return (
    <span style={{ display: "inline-flex", ...display(size), fontWeight: weight, lineHeight: 1, color }}>
      {chars.map((c, i) => <span key={i} style={{ display: "inline-block", width: /[.,]/.test(c) ? 0.26 * size : 0.6 * size, textAlign: "center" }}>{c}</span>)}
    </span>
  );
};
// a word or number swapping through a window: each item rises in on its frame, the one before leaves out the top
// just before (`lead`); `stagger` brings a string in character by character. Never two items crossfading in place
export const Slot: React.FC<{ t: number; h: number; items: [number, React.ReactNode][]; stagger?: number; lead?: number;
  style?: React.CSSProperties }> = ({ t, h, items, stagger = 0, lead = 0.22, style }) => {
  const f = Math.round(t * FPS);
  return (
    // the window clips only above and below: glyphs reach past their own boxes at the sides
    <div style={{ position: "relative", height: h, clipPath: "inset(0 -100% 0 -100%)" }}>
      {items.map(([at, node], i) => {
        const next = items[i + 1]?.[0] ?? 1e9;
        if (f < fr(at) || t > next + 0.2) return null;
        const parts = typeof node === "string" && stagger ? [...node] : [node];
        return (
          <div key={i} style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "center", alignItems: "center", ...style }}>
            {parts.map((c, j) => {
              const k = appleSpring(t, at + j * stagger, 0.42), x = appleSpring(t, next - lead + j * stagger * 0.5, 0.26);
              return <span key={j} style={{ display: "inline-flex", alignItems: "center", whiteSpace: "pre",
                transform: `translateY(${(1 - k) * h - x * h}px)` }}>{c}</span>;
            })}
          </div>
        );
      })}
    </div>
  );
};
// a single digit that turns like a drum (for a step of one: day 11 -> 12)
const Drum: React.FC<{ v: number; size: number; blank0?: boolean; w?: number }> = ({ v, size, blank0, w = size * 0.62 }) => (
  <span style={{ display: "inline-block", width: w, height: size * 1.1, overflow: "hidden", verticalAlign: "bottom" }}>
    <span style={{ display: "block", transform: `translateY(${-v * size * 1.1}px)` }}>
      {Array.from({ length: 11 }, (_, i) => <span key={i} style={{ display: "block", height: size * 1.1, lineHeight: `${size * 1.1}px`,
        textAlign: "center" }}>{blank0 && i === 0 ? "" : i % 10}</span>)}
    </span>
  </span>
);
const Ticks: React.FC<{ n: number; on: (i: number) => number }> = ({ n, on }) => (
  <div style={{ display: "flex", gap: n > 30 ? 4 : 6 }}>
    {Array.from({ length: n }, (_, i) => (
      <div key={i} style={{ width: n > 30 ? 6 : 10, height: 34, borderRadius: 3, background: W22, overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: `${on(i) * 100}%`, background: "#fff" }} />
      </div>
    ))}
  </div>
);

// The hook's figure above the head: it counts up as the creator says it (`roll`: [start, end] seconds), white Display
// over the background; just the number (no canvas, no logo, no label), captions keep running under the chin
export const HookFigure: React.FC<{ a: number; b: number; to: number; from?: number; roll: [number, number]; top?: number; size?: number;
  suffix?: string }> = ({ a, b, to, from = 0, roll, top = 250, size = 150, suffix = "" }) => {
  const t = useT(a), k = enter(t, a), n = from + (to - from) * ramp(t, roll[0], roll[1], easeOut(3));
  return (
    <AbsoluteFill style={{ opacity: Math.min(1, k * 2.5) * fadeOut(t, b) }}>
      <div style={{ position: "absolute", left: 0, right: 0, top, display: "flex", justifyContent: "center",
        textShadow: "0 2px 18px rgba(0,0,0,0.25)" }}>
        <Count n={n} size={size} color="#fff" pad={fmt(to)} />
        {suffix && <span style={{ ...display(size), color: "#fff" }}>{suffix}</span>}
      </div>
    </AbsoluteFill>
  );
};

// The series counter, "Day 12 of 40": the day turns from yesterday's on `at` while its tick fills
export const SeriesPill: React.FC<{ a: number; b: number; day: number; total: number; at: number; label?: string; of?: string; top?: number }> = ({
  a, b, day, total, at, label = "Day", of = "of", top }) => {
  const t = useT(a), roll = ramp(t, at - 0.05, at + 0.4, easeOut(2.5)), fill = ramp(t, at, at + 0.45, easeOut(2)), FS = 46;
  const d0 = Math.floor((day - 1) / 10), d1 = Math.floor(day / 10);
  return (
    <Above t={t} a={a} b={b} top={top}>
      <div style={{ height: 96, borderRadius: 48, background: C.card, color: C.onDark, display: "flex", alignItems: "center", gap: 30, padding: "0 44px" }}>
        <span style={{ fontWeight: 700, ...track(FS), display: "flex", alignItems: "center", whiteSpace: "nowrap" }}>
          {label}&nbsp;
          {(d0 > 0 || d1 > 0) && <Drum v={d0 + (d1 - d0) * roll} size={FS} blank0 w={FS * 0.62 * (d0 === 0 ? roll : 1)} />}
          <Drum v={((day - 1) % 10) + roll} size={FS} />
          &nbsp;<span style={{ fontWeight: 400, color: W60 }}>{of} {total}</span>
        </span>
        {total <= 60 && <Ticks n={total} on={(i) => (i < day - 1 ? 1 : i === day - 1 ? fill : 0)} />}
      </div>
    </Above>
  );
};

// A countdown in the series pill: "28 days left", the figure counting down from `total` as `done` of the bars fill
export const Countdown: React.FC<{ a: number; b: number; total: number; done: number; before?: string; after?: string; top?: number }> = ({
  a, b, total, done, before = "", after = "days left", top }) => {
  const t = useT(a), p = ramp(t, a + 0.15, a + 0.85, easeOut(2.5)), left = Math.round(total - done * p), FS = 46;
  return (
    <Above t={t} a={a} b={b} top={top}>
      <div style={{ height: 96, borderRadius: 48, background: C.card, color: C.onDark, display: "flex", alignItems: "center", gap: 28, padding: "0 44px" }}>
        <span style={{ fontWeight: 700, ...track(FS), whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 12 }}>
          {before && <span style={{ fontWeight: 400, color: W60 }}>{before}</span>}
          <span style={{ display: "inline-block", width: 0.62 * FS * String(total).length, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{left}</span>
          <span>{after}</span>
        </span>
        {total <= 60 && <Ticks n={total} on={(i) => Math.min(1, Math.max(0, p * done - i))} />}
      </div>
    </Above>
  );
};

// Stickers above the head: pills landing one by one on their words, tilted opposite ways with small vertical offsets
// (a straight row reads static). `icon`: a real logo or icon in public/media, never a letter tile
export type StickerItem = { at: number; label: React.ReactNode; icon?: string; fill?: "card" | "soft" | "accent" };
export const Stickers: React.FC<{ a: number; b: number; items: StickerItem[]; top?: number; h?: number }> = ({ a, b, items, top = 266, h = 96 }) => {
  const t = useT(a), tilt = [-4, 3, -3, 4], dy = [0, 14, 2, 12];
  const fills = { card: [C.card, C.onDark], soft: [C.soft, C.text], accent: [C.accent, C.onDark] };
  return (
    <AbsoluteFill style={{ fontFamily: FONT, opacity: fadeOut(t, b) }}>
      <div style={{ position: "absolute", top, left: 100, right: 100, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 16 }}>
        {items.map((s, i) => {
          const k = appleSpring(t, s.at, 0.42, 0.8), [bg, ink] = fills[s.fill ?? "card"];
          return (
            <div key={i} style={{ height: h, borderRadius: h / 2, background: bg, color: ink, display: "flex", alignItems: "center", gap: 14,
              padding: s.icon ? `0 ${h * 0.32}px 0 ${h * 0.22}px` : `0 ${h * 0.42}px`, opacity: Math.min(1, k * 2.5),
              transform: `translateY(${(1 - k) * 24 + dy[i % 4]}px) rotate(${tilt[i % 4] * k}deg) scale(${0.9 + 0.1 * k})` }}>
              {s.icon && <Img src={staticFile(s.icon)} style={{ width: h * 0.58, height: h * 0.58, display: "block" }} />}
              <span style={{ fontWeight: 700, ...track(h * 0.44), whiteSpace: "nowrap" }}>{s.label}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---- full-screen scenes (captions hide under them) -------------------------------------------------------------------
// The word card: the punch of a sentence, 1-3 words, one word at a time, each replacing the last on the frame its
// sound starts; every word of the phrase, small ones too. Use it as a scene with xf: 0 (it cuts in and out)
export const WordCard: React.FC<{ a: number; b: number; words: [number, string][]; dark?: boolean }> = ({ a, words, dark = true }) => {
  const f = useCurrentFrame() + F(a);
  const [, word] = words[Math.max(0, words.filter(([at]) => f >= fr(at)).length - 1)];
  return (
    <AbsoluteFill style={{ background: dark ? C.card : C.canvas, justifyContent: "center", alignItems: "center" }}>
      <div style={{ ...display(160), color: dark ? C.onDark : C.text, marginTop: -80 }}>{word}</div>
    </AbsoluteFill>
  );
};

// Real comments (screenshots in public/media, cropped to avatar + name + text, all at one scale): stacking from the
// centre on the dark card, each new one rising exactly as far as the others climb, the oldest fading out the top
export type Cmt = { src: string; w: number; h: number; at: number };
export const CommentsFeed: React.FC<{ a: number; b: number; items: Cmt[]; scale?: number }> = ({ a, items, scale = 1 }) => {
  const t = useT(a), GAP = 22;
  const k = items.map((c) => appleSpring(t, c.at, 0.45, 0.9));
  const stack = items.reduce((s, c, i) => s + k[i] * (c.h * scale + GAP), 0) - GAP, YB = Math.min(1440, 860 + stack / 2);
  return (
    <AbsoluteFill style={{ background: C.card }}>
      {items.map((c, i) => {
        if (k[i] < 0.001) return null;
        const w = c.w * scale, h = c.h * scale, above = items.slice(i + 1).reduce((s, d, j) => s + k[i + 1 + j] * (d.h * scale + GAP), 0);
        const top = YB - h - above + (1 - k[i]) * (h + GAP), fade = Math.min(1, Math.max(0, (top - 170) / 110));
        return (
          <div key={c.src} style={{ position: "absolute", left: Math.max(100, (1080 - w) / 2), top, width: w, height: h, borderRadius: 30, overflow: "hidden",
            boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.08)", opacity: Math.min(1, k[i] * 2) * fade,
            transform: `scale(${0.96 + 0.04 * k[i]})`, transformOrigin: "0 100%" }}>
            <Img src={staticFile(c.src)} style={{ width: w, height: h, display: "block" }} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---- an app ----------------------------------------------------------------------------------------------------------
// An App Store-style banner when the creator names their app: real icon, name, two short lines, the button. 2 s from
// the frame the name is said; captions keep running under it
export const AppBanner: React.FC<{ a: number; b: number; icon: string; name: string; line1?: string; line2?: string; button?: string;
  top?: number }> = ({ a, b, icon, name, line1, line2, button = "Get", top = 240 }) => {
  const t = useT(a), k = ramp(t, a, a + 0.35, easeOut(3)), pulse = Math.sin(Math.PI * ramp(t, a + 0.8, a + 1.3)) * 0.05;
  return (
    <AbsoluteFill style={{ fontFamily: FONT, opacity: k * fadeOut(t, b, 0.4) }}>
      <div style={{ position: "absolute", left: 100, right: 100, top, height: 200, boxSizing: "border-box", borderRadius: 48, background: C.card,
        boxShadow: "0 18px 40px rgba(0,0,0,0.28), inset 0 0 0 1.5px rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 28,
        padding: "0 32px", transform: `translateY(${(1 - k) * 24}px)` }}>
        <Img src={staticFile(icon)} style={{ width: 136, height: 136, borderRadius: 136 * 0.2237, flex: "none" }} />
        <div style={{ flex: 1, minWidth: 0, color: C.onDark, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontWeight: 800, ...track(42), lineHeight: 1.05 }}>{name}</div>
          {line1 && <div style={{ fontWeight: 400, ...track(28), lineHeight: 1.2, opacity: 0.9 }}>{line1}</div>}
          {line2 && <div style={{ fontWeight: 400, ...track(24), lineHeight: 1.2, opacity: 0.75 }}>{line2}</div>}
        </div>
        <div style={{ height: 64, padding: "0 30px", borderRadius: 32, background: C.onDark, color: C.card, fontWeight: 700, ...track(30),
          display: "flex", alignItems: "center", flex: "none", transform: `scale(${1 + pulse})` }}>{button}</div>
      </div>
    </AbsoluteFill>
  );
};
