// An app demo on a flat canvas: the creator's screen recording (or screenshots) inside a product-shot iPhone, a slow
// camera that pushes to what is being named, a dimmed-screen spotlight that glides from control to control and presses
// in on a tap, iOS sheets that slide up, and blur over anything private. Render it as a scene:
// { a, b, el: <PhoneInsert ins={DEMO} /> }
import React from "react";
import { AbsoluteFill, Easing, Img, Sequence, interpolate, staticFile } from "remotion";
import { Video } from "@remotion/media";
import { C, F, FONT, Typed, appleSpring, clamp, keys, ramp, track, useT } from "./ui";

// iPhone geometry on the 1080x1920 canvas; the recording is transcoded to 1080x2348 (an iPhone's 1206x2622, scaled)
export const SW = 540, SH = 1174, BZ = 14, EDGE = 4, PX = (1080 - SW) / 2 - BZ - EDGE, PY = 296;
const DH = SH + 2 * (BZ + EDGE), R = 90;

// a box in fractions of the screen; r = corner radius as a fraction of the screen width; fit = a row or menu item,
// already its own edge (never padded)
export type Box = { x: number; y: number; w: number; h: number; r?: number; fit?: boolean };
// seconds of the recording, played back to back; xf: a crossfade (s) into this clip, centred on the join
export type Clip = { from: number; to: number; rate?: number; xf?: number };
// a still screenshot from `at`; with `sheet` (y fraction of its top edge) only the sheet slides up, like iOS
export type Shot = { src: string; at: number; sheet?: number };
export type Insert = {
  a: number; b: number;
  src?: string; clips?: Clip[]; // the recording in public/media and the stretches of it to play
  shots?: Shot[];
  cam: [number, number, number, number][]; // [time, scale, focusX, focusY], focus in screen fractions; scale up to ~2
  spots?: (Box & { t: number; until: number })[]; // dim all but this box; spots within 0.6 s of each other glide as one
  pad?: number; // screen px added around a control's measured edge (default 6)
  taps?: { t: number }[]; // the spotlight presses in a little and lets go
  blurs?: (Box & { from?: number; until?: number; dark?: boolean })[]; // other people's names, private numbers
  steps?: [number, string][]; // a step label in a capsule above the phone, typed on, held ~2 s
  screen?: React.ReactNode; // a screen built in code (rows arriving, a figure rolling), drawn over the clips and shots
  bg?: string; // the canvas behind the phone (default the brand's canvas)
  enter?: boolean; // false: it continues a touching insert, so the phone does not rise in again
};

const scr = (b: Box): React.CSSProperties => ({ position: "absolute", left: b.x * SW, top: b.y * SH, width: b.w * SW, height: b.h * SH });
type Spotted = Box & { t: number; until: number };
const padHole = (b: Box, pad: number): Box => b.fit ? { ...b, r: b.r ?? 0 }
  : { x: b.x - pad / SW, y: b.y - pad / SH, w: b.w + (2 * pad) / SW, h: b.h + (2 * pad) / SH, r: (b.r ?? 0.03) + pad / SW };
const lerpBox = (a: Box, b: Box, p: number): Box => ({ x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p, w: a.w + (b.w - a.w) * p,
  h: a.h + (b.h - a.h) * p, r: (a.r ?? 0) + ((b.r ?? 0) - (a.r ?? 0)) * p });

// one hole, shaped like the control, gliding between controls with the dim held; everything around it at ~34% dark
const Spots: React.FC<{ spots: Spotted[]; pad: number; t: number; press: number }> = ({ spots, pad, t, press }) => {
  const runs: Spotted[][] = [];
  for (const s of spots) {
    const r = runs[runs.length - 1];
    if (r && s.t - r[r.length - 1].until <= 0.6) r.push(s); else runs.push([s]);
  }
  const run = runs.find((r) => t >= r[0].t && t < r[r.length - 1].until);
  if (!run) return null;
  const k = Math.min(appleSpring(t, run[0].t, 0.45), 1 - ramp(t, run[run.length - 1].until - 0.3, run[run.length - 1].until));
  let h = padHole(run[0], pad);
  for (let i = 0; i + 1 < run.length; i++) {
    const g0 = Math.min(run[i].until, run[i + 1].t) - 0.05, g1 = Math.max(run[i + 1].t + 0.15, g0 + 0.45); // >= 0.45 s glide
    if (t >= g0) h = lerpBox(padHole(run[i], pad), padHole(run[i + 1], pad), ramp(t, g0, g1, Easing.inOut(Easing.cubic)));
  }
  const d = 0.8 * pad * press;
  const b = { x: h.x + d / SW, y: h.y + d / SH, w: h.w - (2 * d) / SW, h: h.h - (2 * d) / SH };
  const x0 = Math.max(0.012, b.x), x1 = Math.min(0.988, b.x + b.w); // no hole reaches past the screen
  return <div style={{ ...scr({ x: x0, y: b.y, w: x1 - x0, h: b.h }), borderRadius: Math.max(0, (h.r ?? 0) * SW - d),
    boxShadow: `0 0 10px 3000px rgba(0,0,0,${0.34 * k})` }} />;
};

// an iPhone like a product shot: titanium edge, black bezel, side buttons, one soft shadow. A phone is rigid: move it,
// float it, turn it, never stretch it
export const Device: React.FC<{ style?: React.CSSProperties; children: React.ReactNode }> = ({ style, children }) => {
  const x = PX + EDGE + BZ, y = PY + EDGE + BZ, r = R - EDGE - BZ, ow = SW + 2 * (EDGE + BZ), oh = SH + 2 * (EDGE + BZ);
  return (
    <div style={{ position: "absolute", left: x - EDGE - BZ, top: y - EDGE - BZ, width: ow, height: oh, ...style }}>
      {[[0, 250, 70], [0, 350, 120], [0, 490, 120], [1, 380, 180]].map(([side, top, len], i) => (
        <div key={i} style={{ position: "absolute", left: side ? ow - 3 : -3, top: (top / DH) * oh, width: 6, height: (len / DH) * oh,
          borderRadius: 3, background: "linear-gradient(90deg,#8E8E93,#D1D1D6,#8E8E93)" }} />
      ))}
      <div style={{ position: "absolute", inset: 0, borderRadius: r + EDGE + BZ, padding: EDGE, boxSizing: "border-box",
        background: "linear-gradient(145deg,#E5E5EA 0%,#8E8E93 35%,#D8D8DC 60%,#7C7C80 100%)",
        boxShadow: "0 40px 80px rgba(0,0,0,0.16), 0 8px 20px rgba(0,0,0,0.08)" }}>
        <div style={{ width: "100%", height: "100%", borderRadius: r + BZ, background: "#0A0A0C", padding: BZ, boxSizing: "border-box" }}>
          <div style={{ position: "relative", width: SW, height: SH, borderRadius: r, overflow: "hidden", background: "#fff" }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

const Screen: React.FC<{ ins: Insert; t: number }> = ({ ins, t }) => {
  let at = 0;
  const clips = (ins.clips ?? []).map((c, i, all) => {
    const rate = c.rate ?? 1, dur = (c.to - c.from) / rate, start = at;
    at += dur;
    const xin = c.xf ?? 0, xout = all[i + 1]?.xf ?? 0, from = F(start - xin / 2);
    const tail = i === all.length - 1 ? 0.5 : 0; // the last clip runs on under a dissolve, so it never goes white
    return (
      <Sequence key={i} from={from} durationInFrames={F(at + xout / 2 + tail) - from} layout="none">
        <Video src={staticFile(ins.src ?? "media/screenrec.mp4")} trimBefore={F(c.from - (xin / 2) * rate)} playbackRate={rate} muted
          style={{ position: "absolute", width: SW, height: SH,
            opacity: xin ? ramp(t, ins.a + start - xin / 2, ins.a + start + xin / 2, Easing.inOut(Easing.quad)) : 1 }} />
      </Sequence>
    );
  });
  const press = Math.max(0, ...(ins.taps ?? []).map((p) => appleSpring(t, p.t - 0.06, 0.16) * (1 - appleSpring(t, p.t + 0.1, 0.35))));
  return (
    <>
      {clips}
      {(ins.shots ?? []).filter((sh) => t >= sh.at).map((sh, i) => {
        const img = (clip: string, style: React.CSSProperties) => (
          <Img src={staticFile(sh.src)} style={{ position: "absolute", width: SW, height: SH, clipPath: clip, ...style }} />
        );
        if (sh.sheet === undefined) return <React.Fragment key={i}>{img("none", { opacity: i ? ramp(t, sh.at, sh.at + 0.08) : 1 })}</React.Fragment>;
        const k = appleSpring(t, sh.at, 0.5); // only the sheet rises; the screen behind is not dimmed
        return <React.Fragment key={i}>{img(`inset(${sh.sheet * 100}% 0 0 0 round 45px 45px 0 0)`, { transform: `translateY(${(1 - k) * SH}px)` })}</React.Fragment>;
      })}
      {ins.screen}
      {(ins.blurs ?? []).filter((b) => t >= (b.from ?? 0) && t < (b.until ?? 1e9)).map((b, i) => (
        <div key={`b${i}`} style={{ ...scr(b), backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
          background: b.dark ? "rgba(16,16,20,0.35)" : "rgba(242,242,247,0.35)", borderRadius: 14 }} />
      ))}
      <Spots spots={ins.spots ?? []} pad={ins.pad ?? 6} t={t} press={press} />
    </>
  );
};

export const PhoneInsert: React.FC<{ ins: Insert }> = ({ ins }) => {
  const t = useT(ins.a);
  const s = keys(t, ins.cam.map((c) => [c[0], c[1]]));
  const fx = keys(t, ins.cam.map((c) => [c[0], c[2]])), fy = keys(t, ins.cam.map((c) => [c[0], c[3]]));
  // the camera: scale s around the focus point, sliding that point toward the frame centre as it pushes in
  const P = [PX + EDGE + BZ + fx * SW, PY + EDGE + BZ + fy * SH];
  const k = interpolate(s, [1, 1.5], [0, 1], clamp);
  const T = [P[0] + (540 - P[0]) * k, P[1] + (880 - P[1]) * k];
  const enter = ins.enter === false ? 1 : appleSpring(t, ins.a, 0.5);
  return (
    <AbsoluteFill style={{ background: ins.bg ?? C.canvas }}>
      <div style={{ position: "absolute", width: 1080, height: 1920, transformOrigin: "0 0",
        transform: `translate(${T[0] - s * P[0]}px, ${T[1] - s * P[1]}px) scale(${s})` }}>
        <Device style={{ transform: `translateY(${(1 - enter) * 50}px) scale(${0.97 + 0.03 * enter})` }}>
          <Screen ins={ins} t={t} />
        </Device>
      </div>
      {(ins.steps ?? []).filter(([from]) => t >= from && t < from + 2.8).map(([from, step]) => {
        const k = Math.min(appleSpring(t, from + 0.15, 0.45), 1 - appleSpring(t, from + 2.4, 0.3));
        return (
          <div key={from} style={{ position: "absolute", top: 262, left: 0, right: 0, display: "flex", justifyContent: "center",
            transform: `translateY(${(1 - k) * -16}px) scale(${0.95 + 0.05 * k})` }}>
            <div style={{ padding: "18px 36px", borderRadius: 999, background: C.card, color: C.onDark, fontFamily: FONT,
              fontWeight: 600, ...track(38), lineHeight: 1.2, opacity: Math.min(1, k * 1.4) }}>
              <Typed text={step} t={t} at={from + 0.25} />
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
