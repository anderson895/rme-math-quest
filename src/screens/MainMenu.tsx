/* ============================================================
   MainMenu — Barangay Masagana community map.
   A stylized barangay scene (original CSS/SVG + emoji
   placeholder art): grass, a winding barangay road, houses,
   and three community locations = the three game modules:
     1. Bukid ni Tatay Ben   (farm)
     2. Tindahan ni Ate Lalay (sari-sari store)
     3. Plaza ng Barangay     (fiesta grounds)
   The player's avatar travels the road according to progress.
   Clicking a location opens a LEVEL SELECT so any previously
   reached screen can be replayed.
   ============================================================ */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Box, Chip, Dialog, DialogContent, DialogTitle, IconButton, Tooltip, Typography, Button,
  TextField, ToggleButton, ToggleButtonGroup,
} from "@mui/material";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import MusicOffRoundedIcon from "@mui/icons-material/MusicOffRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import { MODULES } from "../data/modules";
import { useGame } from "../state/GameContext";
import type { Gender } from "../state/GameContext";
import { setMusic, sfxClick, sfxWrong } from "../sound";
import GameIcon, { iconSources } from "../components/GameIcon";
import FullscreenButton from "../components/FullscreenButton";
import { UNLOCK_ALL_LEVELS } from "../dev";
import type { Screen } from "../types";

/** SVG icon with override fallback chain: custom image → next source → emoji text. */
function MapIcon({
  icon, imgX, imgY, imgSize, textY, fontSize = 34, className,
}: {
  icon: string; imgX: number; imgY: number; imgSize: number; textY: number; fontSize?: number; className?: string;
}) {
  const sources = iconSources(icon);
  const [idx, setIdx] = useState(0);
  if (idx < sources.length) {
    return (
      <image
        className={className}
        href={sources[idx]}
        x={imgX} y={imgY} width={imgSize} height={imgSize}
        onError={() => setIdx((i) => i + 1)}
      />
    );
  }
  return <text y={textY} textAnchor="middle" fontSize={fontSize}>{icon}</text>;
}

const SCREENS_PER_MODULE = 14;
/* screen 1 (mission briefing) is narrative — NOT a stop point; the
   road only counts the 13 actual lessons (screens 2–14) */
const NARRATIVE_SCREENS = 1;
const LESSON_COUNT = SCREENS_PER_MODULE - NARRATIVE_SCREENS; // 13
const lessonsDoneOf = (screenIndex: number, completed: boolean) =>
  completed ? LESSON_COUNT : Math.max(0, Math.min(screenIndex - NARRATIVE_SCREENS, LESSON_COUNT));

/* where each community location sits along the barangay road —
   EQUALLY spaced by arc length so every lesson stopover is the
   same walking distance (~46px apart, computed by tools/path_points.mjs) */
const NODE_F = [0.34, 0.67, 1.0];
const TRAIL_START_F = 0.02;

/* per-station offset for the status label ("Start here!" etc.) */
const LABEL_OFF = [
  { x: 85, y: 52 },
  { x: 80, y: -95 },
  { x: 42, y: 122 },   // right under Kuya Onyok's feet
];

/* NPC characters stand BESIDE the road (offset from their node) so
   they never cover the stop points; the node itself stays visible
   as the module's final stop */
const CHAR = [
  { x: 85, y: -12, s: 110 },
  { x: 80, y: -30, s: 110 },
  { x: 42, y: 70, s: 100 },
];

/* clickable map objects: hover pop + info card when tapped */
interface Poi {
  href: string; x: number; y: number; w: number; h: number;
  title: string; text: string;
}
const MAP_POIS: Poi[] = [
  {
    href: "/icons/game/bahay-kubo.png", x: 82, y: 58, w: 118, h: 108,
    title: "Bahay Kubo ni Bunso",
    text: "Dito nakatira si Bunso — dito nagsisimula ang iyong math adventure sa barangay!",
  },
  {
    href: "/icons/game/festival-stall.png", x: 285, y: 36, w: 105, h: 84,
    title: "Harvest Festival",
    text: "Ang gantimpala ng masipag na pag-aaral sa Bukid: masaganang ani at masayang pagdiriwang!",
  },
  {
    href: "/icons/game/church.png", x: 230, y: 195, w: 165, h: 195,
    title: "Simbahan ng Barangay",
    text: "Sentro ng pamayanan. Tuwing pista, sinasabitan ito ng makukulay na parol.",
  },
  {
    href: "/icons/game/flower-box.png", x: 300, y: 380, w: 52, h: 32,
    title: "Hardin ng Barangay",
    text: "Mga bulaklak na alaga ng mga kabataan — pinapaganda ang paligid ng simbahan.",
  },
  {
    href: "/icons/game/cart.png", x: 590, y: 210, w: 110, h: 76,
    title: "Kariton ng Bukid",
    text: "Hila ng kalabaw — dito isinasakay ang ani mula sa bukid papunta sa palengke.",
  },
  {
    href: "/icons/game/trophy.png", x: 935, y: 322, w: 36, h: 40,
    title: "Tropeo ng Barangay",
    text: "Para sa magiging Master Math Coordinator — tapusin ang lahat ng 45 aralin!",
  },
  {
    href: "/icons/game/road-flag.png", x: 932, y: 268, w: 40, h: 52,
    title: "Finish Flag",
    text: "Dito magtatapos ang paglalakbay — 45 aralin ang tatawirin mo para marating ito. Kaya mo 'yan!",
  },
];

const PLACE_NAMES = ["Bukid ni Tatay Ben", "Tindahan ni Ate Lalay", "Plaza ng Barangay"];

/* buildings/props rendered right BESIDE their station (offsets are
   relative to the station node, so they always stay together) */
const STATION_DECOR: { href: string; x: number; y: number; w: number; h: number }[][] = [
  // 1. Bukid — palay harvest beside Tatay Ben
  [{ href: "/icons/game/palay.png", x: 50, y: -46, w: 56, h: 72 }],
  // 2. Tindahan — the sari-sari store on Manang Lalay's LEFT side,
  // with a hanging parol, its timbangan, and a basket in front
  [
    { href: "/icons/game/sari-sari-store.png", x: -150, y: -76, w: 92, h: 104 },
    { href: "/icons/game/parol.png",           x: -160, y: -68, w: 24, h: 44 },
    { href: "/icons/game/scale.png",           x: -112, y: 30,  w: 34, h: 44 },
    { href: "/icons/game/basket.png",          x: -66,  y: 36,  w: 30, h: 26 },
  ],
  // 3. Plaza — the whole fiesta grounds on the RIGHT side of the road,
  // grouped together below Kuya Onyok: stage (with its wooden sign),
  // balloons beside it, plants and a gift around it
  [
    { href: "/icons/game/stage.png",           x: -90,  y: 134, w: 128, h: 88 },
    { href: "/icons/game/banderitas-sign.png", x: -62,  y: 130, w: 96,  h: 26 },
    { href: "/icons/game/balloons.png",        x: -136, y: 150, w: 40,  h: 54 },
    { href: "/icons/game/plants.png",          x: 34,   y: 152, w: 44,  h: 32 },
    { href: "/icons/game/gift.png",            x: 10,   y: 190, w: 32,  h: 32 },
  ],
];

const TRAIL_D =
  "M 100 195 C 280 125 500 110 670 155 C 830 200 850 275 700 312 " +
  "C 500 358 320 305 260 385 C 210 452 350 522 560 502 C 720 487 830 432 900 352";

/* small icon per screen type for the level-select list */
const TYPE_ICONS: Record<Screen["type"], string> = {
  dialogue: "💬", "cut-share": "✂️", "bridge-build": "🌉", "jar-fill": "🫙",
  "punch-mix": "🥤", numberline: "🛤️", "model-shade": "🌱", mcq: "❓",
  order: "🐃", "sort-bins": "📦", balance: "⚖️", simplify: "🏷️",
  equation: "➕", boss: "🏁",
};

interface Pt { x: number; y: number }
interface Stop extends Pt { m: number; k: number }  // module index, lesson number

/* remembers where the traveler stood before the last lesson so we can
   animate the walk to the new stop when the map re-opens */
let lastAvatarF: number | null = null;

/* usable walk frames per character (boy frame 1 was dropped —
   inconsistent art: no basket) */
const WALK_FRAMES: Record<string, number[]> = {
  boy: [0, 2, 3],
  girl: [0, 1, 2, 3],
};

/** The traveler, animated with the walking packs. */
function WalkingAvatar({ gender }: { gender: string }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => s + 1), 180);
    return () => clearInterval(t);
  }, []);
  const who = gender === "female" ? "girl" : "boy";
  const frames = WALK_FRAMES[who];
  return (
    <image
      href={`/icons/game/walk/${who}-walk-${frames[step % frames.length]}.png`}
      x={-22} y={-52} width={44} height={58}
    />
  );
}

export default function MainMenu({
  onPlay,
}: {
  onPlay: (moduleIdx: number, startIndex?: number) => void;
}) {
  const { progress, resetProgress, setProfile } = useGame();
  // profile setup shows the moment the game opens (no separate title screen)
  const needsProfile = !progress.name || !progress.gender;
  const [pName, setPName] = useState("");
  const [pGender, setPGender] = useState<Gender>("");
  const pathRef = useRef<SVGPathElement>(null);
  const [nodes, setNodes] = useState<Pt[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [avatarPt, setAvatarPt] = useState<Pt | null>(null);
  const [musicOn, setMusicOn] = useState(false);
  const [shakeIdx, setShakeIdx] = useState<number | null>(null);
  const [selectIdx, setSelectIdx] = useState<number | null>(null); // level-select dialog
  const [walking, setWalking] = useState(false); // traveler mid-walk to the next stop
  const [info, setInfo] = useState<Poi | null>(null);              // tapped map object

  /* --- overall progress → position along the road --- */
  let cur = MODULES.findIndex((m) => !progress.completed[m.id]);
  if (cur === -1) cur = MODULES.length - 1;
  const curDone = progress.completed[MODULES[cur].id];
  const within =
    lessonsDoneOf(progress.screenIndex[MODULES[cur].id] ?? 0, curDone) / LESSON_COUNT;
  const segStart = cur === 0 ? TRAIL_START_F : NODE_F[cur - 1];
  const segLen = NODE_F[cur] - segStart;
  let avatarF = segStart + within * segLen;
  // never stand ON TOP of an NPC: when a new module begins, wait on the
  // road just past the previous station; when arriving, stop just before
  // the station character
  if (cur > 0 && within === 0) avatarF = segStart + (0.5 / LESSON_COUNT) * segLen;
  if (within >= 1) avatarF = NODE_F[cur] - (0.45 / LESSON_COUNT) * segLen;

  useLayoutEffect(() => {
    const p = pathRef.current;
    if (!p) return;
    const L = p.getTotalLength();
    const at = (f: number): Pt => {
      const pt = p.getPointAtLength(L * f);
      return { x: pt.x, y: pt.y };
    };
    setNodes(NODE_F.map(at));

    // returning from a finished lesson? WALK from the previous stop to
    // the new one; otherwise just stand on the current stop.
    // NOTE: lastAvatarF is only committed once the walk FINISHES — this
    // keeps StrictMode's double effect run (dev) from skipping the walk.
    const target = avatarF;
    const fromF = lastAvatarF;
    let raf = 0;
    if (fromF === null || fromF >= target || target - fromF < 0.0005) {
      lastAvatarF = target;
      setAvatarPt(at(target));
    } else {
      setWalking(true);
      const dur = Math.min(2600, Math.max(900, (target - fromF) * L * 22)); // ~22ms per px
      const t0 = performance.now();
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / dur);
        const ease = 1 - Math.pow(1 - k, 2);
        setAvatarPt(at(fromF + (target - fromF) * ease));
        if (k < 1) {
          raf = requestAnimationFrame(step);
        } else {
          lastAvatarF = target; // arrived — commit the new position
          setWalking(false);
        }
      };
      raf = requestAnimationFrame(step);
    }

    // stop points: one per LESSON (screens 3–14; the station itself is
    // the final lesson). Title & briefing screens are not stops. The
    // avatar lands exactly on these — same fractions as its position.
    const stopPts: Stop[] = [];
    NODE_F.forEach((end, mi) => {
      const start = mi === 0 ? TRAIL_START_F : NODE_F[mi - 1];
      for (let k = 1; k < LESSON_COUNT; k++) {
        const f = start + (k / LESSON_COUNT) * (end - start);
        stopPts.push({ ...at(f), m: mi, k });
      }
    });
    setStops(stopPts);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatarF]);

  const maxReached = (mIdx: number) =>
    UNLOCK_ALL_LEVELS || progress.completed[MODULES[mIdx].id]
      ? SCREENS_PER_MODULE - 1
      : Math.max(progress.maxScreen[MODULES[mIdx].id] ?? 0, progress.screenIndex[MODULES[mIdx].id] ?? 0);

  const isLocked = (i: number) => !UNLOCK_ALL_LEVELS && i + 1 > progress.unlocked;

  const clickStation = (i: number) => {
    if (isLocked(i)) {
      sfxWrong();
      setShakeIdx(i);
      setTimeout(() => setShakeIdx(null), 500);
      return;
    }
    sfxClick();
    setSelectIdx(i); // open the level select — previous levels are replayable
  };

  const toggleMusic = () => {
    const next = !musicOn;
    setMusicOn(next);
    setMusic(next);
  };

  return (
    <Box
      sx={{
        position: "fixed", inset: 0, overflow: "hidden",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(#aee3f5 0%, #cde9c0 30%, #9ccc65 100%)",
        p: 1.5, gap: 0.6,
      }}
    >
      {/* title + player info */}
      <Typography sx={{ fontWeight: 900, color: "#1b5e20", fontSize: "clamp(15px, 2.6vw, 26px)", textShadow: "0 2px 0 #fff8", textAlign: "center", display: "flex", alignItems: "center", gap: 1, "@media (max-height: 500px)": { fontSize: 15 } }}>
        <img src="/icons/game/bahay-kubo.png" alt="" style={{ height: "1.3em" }} />
        Barangay Masagana Math Quest
      </Typography>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "center" }}>
        <Chip
          icon={<GameIcon icon={progress.name ? progress.avatar : "👦🏽"} size={18} />}
          label={progress.name || "New resident — visit the farm first!"}
          size="small" sx={{ bgcolor: "#fff", fontWeight: 800 }} />
        <Chip icon={<img src="/icons/game/coin.png" width={18} height={18} alt="coins" />} label={`${progress.coins} coins`}
          size="small" sx={{ bgcolor: "#fff", fontWeight: 800 }} />
        <Chip icon={<img src="/icons/game/medal.png" width={18} height={18} alt="" />}
          label={`${Object.values(progress.completed).filter(Boolean).length}/${MODULES.length} modules`}
          size="small" sx={{ bgcolor: "#fff", fontWeight: 800 }} />
        {UNLOCK_ALL_LEVELS && (
          <Chip label="DEV MODE — all levels unlocked" size="small"
            sx={{ bgcolor: "#212121", color: "#ffeb3b", fontWeight: 800 }} />
        )}
      </Box>

      {/* the barangay map board */}
      <Box
        sx={{
          position: "relative",
          // width is ALSO derived from the available height so the map
          // always fits short screens (mobile landscape) — no clipping
          width: "min(1320px, 97vw, calc((100vh - 112px) * 1.6667))",
          "@supports (height: 100dvh)": {
            width: "min(1320px, 97vw, calc((100dvh - 112px) * 1.6667))",
          },
          aspectRatio: "1000 / 600",
          filter: "drop-shadow(0 12px 16px #0007)",
        }}
      >
        <svg viewBox="0 0 1000 600" width="100%" height="100%" style={{ display: "block", overflow: "visible" }}>
          {/* grass board */}
          <rect x="22" y="22" width="956" height="556" rx="26" fill="#b9dd8f" stroke="#7cb342" strokeWidth="6" />
          {/* plaza green + pond accents */}
          <ellipse cx="790" cy="430" rx="130" ry="78" fill="#a2d178" />
          <ellipse cx="205" cy="205" rx="120" ry="72" fill="#cbe6a3" />
          <ellipse cx="120" cy="555" rx="70" ry="22" fill="#81d4fa" stroke="#4fc3f7" strokeWidth="3" />

          {/* the barangay road (the module route) */}
          <path d={TRAIL_D} fill="none" stroke="#455a64" strokeWidth="40" strokeLinecap="round" />
          <path ref={pathRef} d={TRAIL_D} fill="none" stroke="#eceff1" strokeWidth="3.5"
            strokeLinecap="round" strokeDasharray="18 14" />


          {/* barangay decorations — each anchored where it makes sense */}
          {/* banderitas hang on the top-right frame, away from station 1's title */}
          <image href="/icons/game/banderitas.png" x={540} y={8} width={420} height={44} preserveAspectRatio="none" />

          {/* clickable landmarks: hover pop + info card (church now at the center) */}
          {MAP_POIS.map((p) => (
            <image
              key={p.title}
              className="poi"
              href={p.href}
              x={p.x} y={p.y} width={p.w} height={p.h}
              onClick={() => { sfxClick(); setInfo(p); }}
            >
              <title>{p.title}</title>
            </image>
          ))}
          <image href="/icons/game/tree.png" x={30} y={112} width={56} height={78} />
          <image href="/icons/game/tree.png" x={905} y={128} width={52} height={72} />
          <image href="/icons/game/tree.png" x={398} y={40} width={50} height={70} />
          <image href="/icons/game/tree.png" x={100} y={486} width={54} height={75} />
          <image href="/icons/game/tree.png" x={545} y={372} width={52} height={72} />
          <image href="/icons/game/tree.png" x={846} y={76} width={52} height={72} />
          <image href="/icons/game/tree.png" x={688} y={498} width={52} height={72} />
          <image href="/icons/game/tree.png" x={215} y={64} width={44} height={62} />
          <image href="/icons/game/tree.png" x={495} y={418} width={50} height={70} />

          {/* stop points — one per lesson; each is a TRIGGER: tapping a
              reached stop launches that exact lesson */}
          {stops.map((s, i) => {
            const mod = MODULES[s.m];
            // stop k ↔ screen index k+1 (screens 1–2 are narrative, not stops)
            const screenIdx = s.k + NARRATIVE_SCREENS - 1;
            const lessonsDone = lessonsDoneOf(
              progress.screenIndex[mod.id] ?? 0,
              !!progress.completed[mod.id]
            );
            const passed = lessonsDone >= s.k;
            const playable = !isLocked(s.m) && screenIdx <= maxReached(s.m);
            return (
              <g
                key={i}
                className={playable ? "poi" : undefined}
                style={{ cursor: playable ? "pointer" : "default" }}
                onClick={() => {
                  if (!playable) { sfxWrong(); return; }
                  sfxClick();
                  onPlay(s.m, screenIdx); // each stop point triggers its lesson
                }}
              >
                <title>{`${mod.title} — Lesson ${s.k}: ${shortTitle(mod.screens[screenIdx])}`}</title>
                <circle
                  cx={s.x} cy={s.y} r={7}
                  fill={passed ? mod.themeColor : playable ? "#fffdf5" : "#e7dfc9"}
                  stroke={passed ? "#ffffff" : "#8d6e63"}
                  strokeWidth={2.2}
                  opacity={isLocked(s.m) ? 0.45 : 1}
                />
              </g>
            );
          })}

          {/* community locations = module stations */}
          {nodes.map((pt, i) => {
            const m = MODULES[i];
            const locked = isLocked(i);
            const done = progress.completed[m.id];
            const at = progress.screenIndex[m.id] ?? 0;
            const label = done ? "✔ Completed — replay!" : locked ? "Locked" : at > 0 ? `Screen ${at + 1}/${SCREENS_PER_MODULE}` : "Start here!";
            return (
              <g
                key={m.id}
                transform={`translate(${pt.x}, ${pt.y})`}
                onClick={() => clickStation(i)}
                style={{ cursor: locked ? "not-allowed" : "pointer" }}
                className={shakeIdx === i ? "map-shake" : undefined}
              >
                <title>{`${PLACE_NAMES[i]}\nModule ${i + 1}: ${m.title}`}</title>
                {/* the station's own buildings/props, anchored beside it */}
                {STATION_DECOR[i].map((d, di) => (
                  <image key={di} href={d.href} x={d.x} y={d.y} width={d.w} height={d.h}
                    opacity={locked ? 0.55 : 1} />
                ))}
                {/* the node itself = the module's REWARD stop — enlarged and
                    highlighted; tapping it claims the reward directly and
                    never opens the level-select modal */}
                {(() => {
                  const rewardReached = !locked && maxReached(i) >= SCREENS_PER_MODULE - 1;
                  const rewardReady = rewardReached && !done;
                  return (
                    <g
                      onClick={(e) => {
                        e.stopPropagation(); // don't fall through to the station modal
                        if (!rewardReached) { sfxWrong(); return; }
                        sfxClick();
                        onPlay(i, SCREENS_PER_MODULE - 1); // claim the reward screen
                      }}
                      style={{ cursor: rewardReached ? "pointer" : "default" }}
                    >
                      {rewardReady && (
                        <circle r={21} fill="#ffeb3b88"
                          style={{ transformBox: "fill-box", transformOrigin: "center", animation: "pulse .8s infinite alternate" }} />
                      )}
                      <circle r={12}
                        fill={done ? m.themeColor : rewardReady ? "#ffd54f" : "#fffdf5"}
                        stroke={done ? "#ffffff" : "#8d6e63"} strokeWidth={3}
                        opacity={locked ? 0.5 : 1} />
                    </g>
                  );
                })()}
                {locked ? (
                  <g transform={`translate(${CHAR[i].x}, ${CHAR[i].y})`}>
                    <circle r="36" fill="#cfcfcf" stroke="#8d8d8d" strokeWidth="5" />
                    {/* drawn padlock (no emoji) */}
                    <path d="M -11 -6 v-6 a11 11 0 0 1 22 0 v6" fill="none" stroke="#616161" strokeWidth="5" />
                    <rect x="-15" y="-6" width="30" height="24" rx="5" fill="#757575" />
                    <circle cy="4" r="4" fill="#eeeeee" />
                    <rect x="-1.8" y="4" width="3.6" height="8" rx="1.8" fill="#eeeeee" />
                  </g>
                ) : (
                  /* the NPC stands beside the road, off the stop points */
                  <MapIcon className="poi" icon={m.npc.icon}
                    imgX={CHAR[i].x - CHAR[i].s / 2} imgY={CHAR[i].y - CHAR[i].s / 2}
                    imgSize={CHAR[i].s} textY={12} />
                )}
                {done && <text x={CHAR[i].x + 42} y={CHAR[i].y - 46} fontSize="24">⭐</text>}
                <text x={LABEL_OFF[i].x} y={LABEL_OFF[i].y} textAnchor="middle" fontSize="13" fontWeight="800" fill={locked ? "#666" : "#1b5e20"} stroke="#b9dd8f" strokeWidth="4" paintOrder="stroke">
                  {label}
                </text>
                {/* (the PLAY! arrow follows the traveler on the road —
                    see the avatar group below) */}
              </g>
            );
          })}

          {/* the player walking along the barangay road (animated frames);
              the PLAY! arrow bounces right above their current stop point */}
          {avatarPt && (
            <g
              transform={`translate(${avatarPt.x}, ${avatarPt.y})`}
              onClick={() => clickStation(cur)}
              style={{ cursor: "pointer" }}
            >
              <ellipse cy="8" rx="16" ry="5" fill="#00000033" />
              <WalkingAvatar gender={progress.gender} />
              {progress.name && (
                <text y="-58" textAnchor="middle" fontSize="13" fontWeight="900" fill="#bf360c" stroke="#fff8e1" strokeWidth="4" paintOrder="stroke">
                  {progress.name}
                </text>
              )}
              {!walking && !MODULES.every((m) => progress.completed[m.id]) && (
                <g className="map-bounce" style={{ pointerEvents: "none" }}>
                  <polygon points="-6,-126 6,-126 6,-100 14,-100 0,-80 -14,-100 -6,-100"
                    fill="#ffb300" stroke="#e65100" strokeWidth="2.5" strokeLinejoin="round" />
                  <text y="-136" textAnchor="middle" fontSize="15" fontWeight="900" fill="#bf360c" stroke="#fff8e1" strokeWidth="4" paintOrder="stroke">PLAY!</text>
                </g>
              )}
            </g>
          )}
        </svg>
      </Box>

      <Typography sx={{ fontSize: 10.5, color: "#33691e", opacity: 0.8, "@media (max-height: 500px)": { display: "none" } }}>
        Game art: original asset packs (Barangay Masagana Math Quest)
      </Typography>

      {/* info card for a tapped map object */}
      {info && (
        <Box
          onClick={() => setInfo(null)}
          sx={{
            position: "absolute", bottom: 64, left: "50%", transform: "translateX(-50%)",
            zIndex: 30, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 1.5,
            bgcolor: "#fffde7", border: "3px solid #8d6e63", borderRadius: 3,
            px: 2, py: 1.2, maxWidth: 420, boxShadow: "0 8px 18px #0006",
            animation: "popIn .25s",
          }}
        >
          <img src={info.href} alt="" style={{ height: 54, objectFit: "contain" }} />
          <Box>
            <Typography sx={{ fontWeight: 900, color: "#3e2723", fontSize: 15 }}>{info.title}</Typography>
            <Typography sx={{ fontSize: 12.5, color: "#5d4037" }}>{info.text}</Typography>
            <Typography sx={{ fontSize: 10, color: "#9e9e9e", mt: 0.3 }}>(tap to close)</Typography>
          </Box>
        </Box>
      )}

      {/* bottom-left: music + fullscreen */}
      <Box sx={{ position: "absolute", left: 18, bottom: 16, display: "flex", gap: 1 }}>
        <Tooltip title="Music">
          <IconButton onClick={toggleMusic} sx={cornerBtn("#c2185b")}>
            {musicOn ? <MusicNoteRoundedIcon /> : <MusicOffRoundedIcon />}
          </IconButton>
        </Tooltip>
        <FullscreenButton sx={cornerBtn("#5e35b1")} />
      </Box>

      {/* bottom-right: reset progress */}
      <Box sx={{ position: "absolute", right: 18, bottom: 16 }}>
        <Tooltip title="Reset progress">
          <IconButton
            onClick={() => { if (confirm("Reset all progress?")) { sfxClick(); resetProgress(); } }}
            sx={cornerBtn("#ef6c00")}
          >
            <RestartAltRoundedIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* ===== PROFILE SETUP — shows the moment the game opens ===== */}
      <Dialog open={needsProfile} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 900, bgcolor: "#2e7d32", color: "#fff", textAlign: "center" }}>
          Maligayang pagdating sa Barangay Masagana!
        </DialogTitle>
        <DialogContent sx={{ bgcolor: "#fffde7", textAlign: "center" }}>
          <Typography sx={{ my: 1.5, fontWeight: 800 }}>Set up your player profile:</Typography>
          <TextField
            label="Student Name"
            placeholder="Type your name…"
            value={pName}
            onChange={(e) => setPName(e.target.value.slice(0, 24))}
            fullWidth
            sx={{ mb: 1.5, bgcolor: "#fff", borderRadius: 1 }}
            slotProps={{ htmlInput: { style: { textAlign: "center", fontWeight: 800 } } }}
          />
          <ToggleButtonGroup
            exclusive
            value={pGender}
            onChange={(_, v: Gender | null) => { if (v) { sfxClick(); setPGender(v); } }}
          >
            <ToggleButton value="male" sx={{ px: 3, gap: 1, fontWeight: 800 }}>
              <GameIcon icon="👦🏽" size={30} /> Male
            </ToggleButton>
            <ToggleButton value="female" sx={{ px: 3, gap: 1, fontWeight: 800 }}>
              <GameIcon icon="👧🏽" size={30} /> Female
            </ToggleButton>
          </ToggleButtonGroup>
          <Box sx={{ mt: 2, mb: 1 }}>
            <Button
              variant="contained" size="large"
              disabled={!pName.trim() || !pGender}
              onClick={() => { sfxClick(); setProfile(pName, pGender); }}
              sx={{ fontWeight: 900, borderRadius: 3, px: 5 }}
            >
              Start Adventure!
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* ===== LEVEL SELECT — replay any previously reached screen ===== */}
      <Dialog open={selectIdx !== null} onClose={() => setSelectIdx(null)} maxWidth="sm" fullWidth>
        {selectIdx !== null && (() => {
          const m = MODULES[selectIdx];
          const reach = maxReached(selectIdx);
          const resume = progress.screenIndex[m.id] ?? 0;
          return (
            <>
              <DialogTitle sx={{ fontWeight: 900, bgcolor: m.themeColor, color: "#fff", py: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                <GameIcon icon={m.npc.icon} size={36} /> {PLACE_NAMES[selectIdx]} — Pick a level
              </DialogTitle>
              <DialogContent sx={{ bgcolor: "#fffde7" }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => { sfxClick(); onPlay(selectIdx, resume); }}
                  sx={{ my: 1.5, fontWeight: 900, borderRadius: 3, bgcolor: m.themeColor }}
                >
                  {resume < NARRATIVE_SCREENS
                    ? "▶ Start the Adventure!"
                    : `▶ Continue — Lesson ${resume - NARRATIVE_SCREENS + 1}: ${shortTitle(m.screens[resume])}`}
                </Button>
                {/* lessons only — the mission briefing plays automatically at the start */}
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 1 }}>
                  {m.screens.slice(NARRATIVE_SCREENS).map((s, li) => {
                    const idx = li + NARRATIVE_SCREENS;
                    const open = idx <= reach;
                    return (
                      <Button
                        key={s.id}
                        disabled={!open}
                        onClick={() => { sfxClick(); onPlay(selectIdx, idx); }}
                        variant="outlined"
                        startIcon={open
                          ? <span style={{ fontSize: 16 }}>{TYPE_ICONS[s.type]}</span>
                          : <LockRoundedIcon sx={{ fontSize: 15 }} />}
                        sx={{
                          justifyContent: "flex-start",
                          borderRadius: 2.5, borderWidth: 2, borderColor: open ? "#8d6e63" : "#bbb",
                          color: "#3e2723", bgcolor: open ? "#fff" : "#f2f2f2",
                          fontWeight: 800, fontSize: 12, textTransform: "none",
                          "&:hover": { borderWidth: 2, bgcolor: "#ffe082" },
                        }}
                      >
                        {li + 1}. {shortTitle(s)}
                      </Button>
                    );
                  })}
                </Box>
                <Typography sx={{ mt: 1.5, fontSize: 12, color: "#8d6e63", textAlign: "center" }}>
                  Levels unlock as you reach them — replay any level you've finished!
                </Typography>
              </DialogContent>
            </>
          );
        })()}
      </Dialog>
    </Box>
  );
}

/** shorten a storyboard slide title, e.g. "Slide 3: Share the Timber (NEW)" → "Share the Timber" */
function shortTitle(s: Screen): string {
  return (s.slide.split(":")[1] ?? s.slide).replace("(NEW)", "").trim();
}

const cornerBtn = (bg: string) => ({
  bgcolor: bg,
  color: "#fff",
  border: "3px solid #ffffffaa",
  borderRadius: 2,
  "&:hover": { bgcolor: bg, filter: "brightness(1.15)" },
});
