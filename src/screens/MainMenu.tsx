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

import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  Box, Chip, Dialog, DialogContent, DialogTitle, IconButton, Tooltip, Typography, Button,
  TextField, ToggleButton, ToggleButtonGroup, useMediaQuery,
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

const SCREENS_PER_MODULE = 16;
/* screen 1 (mission briefing) is narrative — NOT a stop point; the
   road counts the 15 actual lessons (screens 2–16) */
const NARRATIVE_SCREENS = 1;
const LESSON_COUNT = SCREENS_PER_MODULE - NARRATIVE_SCREENS; // 15
const lessonsDoneOf = (screenIndex: number, completed: boolean) =>
  completed ? LESSON_COUNT : Math.max(0, Math.min(screenIndex - NARRATIVE_SCREENS, LESSON_COUNT));

/* where each community location sits along the barangay road —
   EQUALLY spaced by arc length so every lesson stopover is the
   same walking distance (~103px apart, computed by tools/path_points_v2.mjs) */
const NODE_F = [0.34, 0.67, 1.0];
const TRAIL_START_F = 0.02;

/* per-station offset for the status label ("Start here!" etc.) */
const LABEL_OFF = [
  { x: -120, y: 62 },    // under Tatay Ben, beside his palayan
  { x: 80, y: -145 },
  { x: -100, y: -108 },  // above Kuya Onyok, left of the road's final climb
];

/* NPC characters stand BESIDE the road (offset from their node) so
   they never cover the stop points; the node itself stays visible
   as the module's final stop */
const CHAR = [
  { x: -120, y: -13, s: 110 },  // Tatay Ben stands at the edge of his palayan
  { x: 80, y: -75, s: 110 },
  { x: -100, y: -45, s: 100 },
];

/* clickable map objects: hover pop + info card when tapped */
interface Poi {
  href: string; x: number; y: number; w: number; h: number;
  title: string; text: string;
}
const MAP_POIS: Poi[] = [
  {
    href: "/icons/game/bahay-kubo.png", x: 85, y: 48, w: 140, h: 128,
    title: "Bahay Kubo ni Bunso",
    text: "Dito nakatira si Bunso — dito nagsisimula ang iyong math adventure sa barangay!",
  },
  // Harvest Festival grounds — a row of THREE stalls down the right side
  {
    href: "/icons/game/festival-stall.png", x: 1755, y: 205, w: 128, h: 102,
    title: "Harvest Festival",
    text: "Ang gantimpala ng masipag na pag-aaral sa Bukid: masaganang ani at masayang pagdiriwang!",
  },
  {
    href: "/icons/game/festival-stall.png", x: 1730, y: 330, w: 112, h: 90,
    title: "Harvest Festival",
    text: "Tatlong stall para sa tatlong module — kapag natapos mo lahat, pinakamasaya ang pista!",
  },
  {
    href: "/icons/game/festival-stall.png", x: 1770, y: 455, w: 112, h: 90,
    title: "Harvest Festival",
    text: "Dito ibebenta ang ani mula sa palayan ni Tatay Ben — pantay-pantay ang partihan ng barangay!",
  },
  {
    href: "/icons/game/church.png", x: 970, y: 670, w: 195, h: 230,
    title: "Simbahan ng Barangay",
    text: "Sentro ng pamayanan. Tuwing pista, sinasabitan ito ng makukulay na parol.",
  },
  {
    href: "/icons/game/flower-box.png", x: 1075, y: 915, w: 60, h: 38,
    title: "Hardin ng Barangay",
    text: "Mga bulaklak na alaga ng mga kabataan — pinapaganda ang paligid ng simbahan.",
  },
  {
    href: "/icons/game/cart.png", x: 1095, y: 450, w: 128, h: 88,
    title: "Kariton ng Bukid",
    text: "Hila ng kalabaw — dito isinasakay ang ani mula sa bukid papunta sa palengke.",
  },
  {
    href: "/icons/game/trophy.png", x: 1908, y: 630, w: 40, h: 44,
    title: "Tropeo ng Barangay",
    text: "Para sa magiging Master Math Coordinator — tapusin ang lahat ng 45 aralin!",
  },
  {
    href: "/icons/game/road-flag.png", x: 1902, y: 565, w: 44, h: 57,
    title: "Finish Flag",
    text: "Dito magtatapos ang paglalakbay — 45 aralin ang tatawirin mo para marating ito. Kaya mo 'yan!",
  },
];

const PLACE_NAMES = ["Bukid ni Tatay Ben", "Tindahan ni Manang Lalay", "Plaza ng Barangay"];

/* scenery scattered around the barangay — every object is clickable
   and shows its own description card (same as the landmarks) */
const DECOR: Poi[] = [
  {
    href: "/icons/game/signpost.png", x: 1180, y: 280, w: 50, h: 66,
    title: "Karatula ng Bukid",
    text: "Itinuturo ang daan papunta sa Bukid ni Tatay Ben — sundan lang ang kalsada!",
  },
  // the start village (near Bahay Kubo ni Bunso)
  {
    href: "/icons/game/bahay-kubo.png", x: 300, y: 300, w: 115, h: 105,
    title: "Bahay ng Kapitbahay",
    text: "Masayang pamilya ang nakatira dito — tuwing gabi, sabay-sabay silang nag-aaral ng math!",
  },
  {
    href: "/icons/game/flower-box.png", x: 255, y: 415, w: 52, h: 34,
    title: "Paso ng Bulaklak",
    text: "Alaga ng mga bata sa village — pinapaganda ang harapan ng mga bahay.",
  },
  // open field at the center
  {
    href: "/icons/game/plants.png", x: 860, y: 420, w: 56, h: 40,
    title: "Halamanan sa Parang",
    text: "Mga gulay na itinanim ng samahan ng kabataan — sariwa at masustansya!",
  },
  {
    href: "/icons/game/basket.png", x: 700, y: 545, w: 38, h: 32,
    title: "Basket ng Ani",
    text: "May lamang sariwang ani — naiwan yata ng magsasakang nagpahinga sa lilim.",
  },
  // left countryside, on the way to the Tindahan
  {
    href: "/icons/game/basket.png", x: 255, y: 1075, w: 40, h: 34,
    title: "Basket ng Mangingisda",
    text: "Ginagamit pag-uwi ng huli mula sa maliit na palaisdaan ng barangay.",
  },
  // around the church grounds
  {
    href: "/icons/game/flower-box.png", x: 900, y: 855, w: 55, h: 34,
    title: "Hardin sa Simbahan",
    text: "Mga bulaklak na handog ng mga deboto tuwing pista ng barangay.",
  },
  {
    href: "/icons/game/plants.png", x: 1190, y: 845, w: 52, h: 38,
    title: "Halamang Gamot",
    text: "Alaga ng barangay health center — lunas sa ubo't sipon ng mga bata.",
  },
  {
    href: "/icons/game/signpost.png", x: 700, y: 940, w: 48, h: 64,
    title: "Karatula ng Krosing",
    text: "Dito naghihiwalay ang daan — dumiretso para sa Tindahan at sa Plaza!",
  },
  // right countryside, on the way to the Plaza
  {
    href: "/icons/game/plants.png", x: 1450, y: 820, w: 52, h: 38,
    title: "Halamanan sa Plaza",
    text: "Inihahanda bilang palamuti sa darating na fiesta sa nayon!",
  },
];

/* Palayan ni Tatay Ben — ALL the barangay's palay gathered into ONE
   rice field beside the Bukid: a fenced paddy divided into equal
   pitak rows, each planted with a hilera of palay (fractions in
   the scenery — every pitak is an equal share of the whole field) */
const PALAYAN = {
  x: 1240, y: 315, w: 250, h: 160,
  rows: 3, cols: 5,
  title: "Palayan ni Tatay Ben",
  text: "Sama-sama na ang lahat ng palay ng barangay sa iisang palayan! Pantay-pantay ang mga pitak — parang fractions: bawat hilera ay bahagi ng buo. Malapit na ang anihan para sa Harvest Festival!",
};

/* barangay trees — clickable like every other map object */
const TREES: [number, number, number, number][] = [
  [42, 140, 60, 84], [330, 52, 54, 76], [740, 36, 56, 78], [1050, 60, 52, 72],
  [1460, 70, 54, 76], [1830, 110, 52, 72], [95, 560, 56, 78], [250, 700, 50, 70],
  [180, 1040, 56, 78], [560, 420, 56, 78], [890, 300, 50, 70], [1060, 330, 52, 72],
  [1530, 690, 52, 72], [690, 860, 54, 76], [1690, 1040, 54, 76],
];
const TREE_INFO = {
  title: "Punong-kahoy ng Barangay",
  text: "Nagbibigay-lilim sa mga naglalakbay — tahanan din ng mga maya at kuwago!",
};

/* buildings/props rendered right BESIDE their station (offsets are
   relative to the station node, so they always stay together) */
const STATION_DECOR: { href: string; x: number; y: number; w: number; h: number }[][] = [
  // 1. Bukid — its palay now all live together in the PALAYAN field
  [],
  // 2. Tindahan — the sari-sari store on Manang Lalay's LEFT side,
  // with a hanging parol, its timbangan, and a basket in front
  [
    { href: "/icons/game/sari-sari-store.png", x: -230, y: -76, w: 92, h: 104 },
    { href: "/icons/game/parol.png",           x: -240, y: -68, w: 24, h: 44 },
    { href: "/icons/game/scale.png",           x: -180, y: 30,  w: 34, h: 44 },
    { href: "/icons/game/basket.png",          x: -134, y: 36,  w: 30, h: 26 },
  ],
  // 3. Plaza — the whole fiesta grounds on the LEFT side of the road's
  // final climb, grouped together below Kuya Onyok: stage (with its
  // wooden sign), balloons beside it, plants and a gift around it
  [
    { href: "/icons/game/stage.png",           x: -110, y: 250, w: 128, h: 88 },
    { href: "/icons/game/banderitas-sign.png", x: -82,  y: 246, w: 96,  h: 26 },
    { href: "/icons/game/balloons.png",        x: -160, y: 270, w: 40,  h: 54 },
    { href: "/icons/game/plants.png",          x: 20,   y: 280, w: 44,  h: 32 },
    { href: "/icons/game/gift.png",            x: -20,  y: 310, w: 32,  h: 32 },
  ],
];

/* the EXPANDED barangay road — a long serpentine across the 2000×1200
   board so lesson stopovers sit ~103px apart (see tools/path_points_v2.mjs) */
const TRAIL_D =
  "M 140 260 C 420 140 820 120 1200 190 C 1560 250 1760 380 1620 520 " +
  "C 1480 655 1000 560 700 640 C 420 715 280 820 420 950 " +
  "C 560 1075 1000 1105 1350 1040 C 1650 985 1830 870 1880 700";

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

/* NPCs with sliced idle-animation frames (tools/split_idle.py) */
const IDLE_SETS: Record<string, { base: string; count: number }> = {
  "👨🏽‍🌾": { base: "/icons/game/idle/tatay-ben", count: 4 },
  "👩🏽‍💼": { base: "/icons/game/idle/manang-lalay", count: 4 },
  "🕺🏽": { base: "/icons/game/idle/kuya-onyok", count: 4 },
};

/** Station NPC — plays its idle animation if one exists, otherwise
    falls back to the static character image. */
function IdleNpc({ icon, cx, cy, s }: { icon: string; cx: number; cy: number; s: number }) {
  const set = IDLE_SETS[icon];
  const [f, setF] = useState(0);
  useEffect(() => {
    if (!set) return;
    const t = setInterval(() => setF((v) => v + 1), 360);
    return () => clearInterval(t);
  }, [set]);
  if (!set) {
    return <MapIcon className="poi" icon={icon} imgX={cx - s / 2} imgY={cy - s / 2} imgSize={s} textY={12} />;
  }
  return (
    <image
      className="poi"
      href={`${set.base}-${f % set.count}.png`}
      x={cx - s / 2} y={cy - s / 2} width={s} height={s}
    />
  );
}

/* usable walk frames per character (boy frame 1 was dropped —
   inconsistent art: no basket) */
const WALK_FRAMES: Record<string, number[]> = {
  boy: [0, 2, 3],
  girl: [0, 1, 2, 3],
};

/** The traveler — walking frames while on the move, a single idle
    pose (sliced by tools/slice_traveler_idle.py) while standing. */
function WalkingAvatar({ gender, walking }: { gender: string; walking: boolean }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!walking) return;
    const t = setInterval(() => setStep((s) => s + 1), 180);
    return () => clearInterval(t);
  }, [walking]);
  const who = gender === "female" ? "girl" : "boy";
  // one shared, feet-anchored box for BOTH sprites — the character
  // keeps the exact same height whether idle or walking
  const href = walking
    ? `/icons/game/walk/${who}-walk-${WALK_FRAMES[who][step % WALK_FRAMES[who].length]}.png`
    : `/icons/game/idle/${who}-idle.png`;
  return <image href={href} x={-22} y={-58} width={44} height={64} />;
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
  const [hoverStop, setHoverStop] = useState<Stop | null>(null); // stop-point hover card

  /* the map world is LARGER than the screen (an expanded barangay with
     a long road) — the view pans, always centered on the traveler */
  const compact = useMediaQuery("(max-height: 620px), (max-width: 760px)");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const mapBoxRef = useRef<HTMLDivElement>(null);

  /* mouse drag-to-pan (touch uses native overflow scrolling);
     real drags suppress the click that follows */
  const dragRef = useRef<{ x: number; y: number; sl: number; st: number; moved: boolean } | null>(null);
  const suppressClickRef = useRef(false);
  const dragStart = (e: ReactPointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const sc = scrollerRef.current;
    if (!sc) return;
    dragRef.current = { x: e.clientX, y: e.clientY, sl: sc.scrollLeft, st: sc.scrollTop, moved: false };
  };
  const dragMove = (e: ReactPointerEvent) => {
    const d = dragRef.current;
    const sc = scrollerRef.current;
    if (!d || !sc) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 6) d.moved = true;
    if (d.moved) {
      sc.scrollLeft = d.sl - dx;
      sc.scrollTop = d.st - dy;
    }
  };
  const dragEnd = () => {
    const d = dragRef.current;
    dragRef.current = null;
    if (d?.moved) {
      suppressClickRef.current = true; // don't let the drag "click" a stop
      setTimeout(() => { suppressClickRef.current = false; }, 0);
    }
  };

  // keep the traveler centered in view (also follows them while walking)
  useEffect(() => {
    if (!avatarPt) return;
    const sc = scrollerRef.current;
    const inner = mapBoxRef.current;
    if (!sc || !inner) return;
    const scale = inner.clientWidth / 2000;
    sc.scrollTo({
      left: avatarPt.x * scale - sc.clientWidth / 2,
      top: avatarPt.y * scale - sc.clientHeight / 2,
    });
  }, [avatarPt]);
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
      const dur = Math.min(3400, Math.max(900, (target - fromF) * L * 22)); // ~22ms per px
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
          // the traveler has reached the next stop — pop the level
          // picker so the next level is one tap away
          if (!MODULES.every((m) => progress.completed[m.id])) {
            setSelectIdx(cur);
          }
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

  /* everything the map needs to know about one stop point */
  const stopInfo = (s: Stop) => {
    const mod = MODULES[s.m];
    const screenIdx = s.k + NARRATIVE_SCREENS - 1;
    const lessonsDone = lessonsDoneOf(
      progress.screenIndex[mod.id] ?? 0,
      !!progress.completed[mod.id]
    );
    const passed = lessonsDone >= s.k;
    const playable = !isLocked(s.m) && screenIdx <= maxReached(s.m);
    return { mod, screen: mod.screens[screenIdx], screenIdx, passed, playable };
  };

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
      {/* on small screens the map stays LARGE inside a draggable viewport;
          on desktop it fits the screen as before */}
      <Box
        ref={scrollerRef}
        onPointerDown={dragStart}
        onPointerMove={dragMove}
        onPointerUp={dragEnd}
        onPointerLeave={dragEnd}
        onClickCapture={(e) => {
          if (suppressClickRef.current) { e.stopPropagation(); e.preventDefault(); }
        }}
        sx={{
          alignSelf: "stretch",
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          borderRadius: 3,
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
          WebkitOverflowScrolling: "touch",
          ...(!compact && { cursor: "grab", "&:active": { cursor: "grabbing" } }),
        }}
      >
      <Box
        ref={mapBoxRef}
        sx={{
          position: "relative",
          // the world is bigger than the screen — drag to explore the
          // expanded barangay and its longer road
          width: compact ? "max(2300px, 270vw)" : "max(2700px, 140vw)",
          aspectRatio: "2000 / 1200",
          filter: "drop-shadow(0 12px 16px #0007)",
        }}
      >
        <svg viewBox="0 0 2000 1200" width="100%" height="100%" style={{ display: "block", overflow: "visible" }}>
          {/* grass board */}
          <rect x="22" y="22" width="1956" height="1156" rx="34" fill="#b9dd8f" stroke="#7cb342" strokeWidth="8" />
          {/* plaza green + pond accents */}
          <ellipse cx="1780" cy="880" rx="160" ry="95" fill="#a2d178" />
          <ellipse cx="380" cy="390" rx="210" ry="115" fill="#cbe6a3" />
          <ellipse cx="175" cy="1115" rx="95" ry="30" fill="#81d4fa" stroke="#4fc3f7" strokeWidth="3" />

          {/* the barangay road (the module route) */}
          <path d={TRAIL_D} fill="none" stroke="#455a64" strokeWidth="40" strokeLinecap="round" />
          <path ref={pathRef} d={TRAIL_D} fill="none" stroke="#eceff1" strokeWidth="3.5"
            strokeLinecap="round" strokeDasharray="18 14" />


          {/* barangay decorations — each anchored where it makes sense */}
          {/* banderitas repeat edge-to-edge, tiles OVERLAPPING so the
              string connects seamlessly across the whole map */}
          {[10, 250, 490, 730, 970, 1210, 1450, 1690].map((bx) => (
            <image key={bx} href="/icons/game/banderitas.png"
              x={bx} y={-30} width={260} height={142} preserveAspectRatio="none" />
          ))}

          {/* Palayan ni Tatay Ben — all the palay gathered into one field:
              equal pitak rows behind, a hilera of palay planted in each */}
          <g
            className="poi"
            onClick={() => {
              sfxClick();
              setInfo({
                href: "/icons/game/palay.png",
                x: PALAYAN.x, y: PALAYAN.y, w: PALAYAN.w, h: PALAYAN.h,
                title: PALAYAN.title, text: PALAYAN.text,
              });
            }}
          >
            <title>{PALAYAN.title}</title>
            {/* the paddy: wet field framed by a mud dike */}
            <rect
              x={PALAYAN.x} y={PALAYAN.y} width={PALAYAN.w} height={PALAYAN.h} rx={12}
              fill="#aad178" stroke="#6d4c41" strokeWidth={5}
            />
            {/* mud dikes dividing the field into equal pitak rows */}
            {Array.from({ length: PALAYAN.rows - 1 }, (_, r) => {
              const dy = PALAYAN.y + ((r + 1) * PALAYAN.h) / PALAYAN.rows;
              return (
                <line
                  key={r}
                  x1={PALAYAN.x + 8} x2={PALAYAN.x + PALAYAN.w - 8}
                  y1={dy} y2={dy}
                  stroke="#8d6e63" strokeWidth={4} strokeLinecap="round"
                />
              );
            })}
            {/* every palay of the barangay, planted in neat hilera */}
            {Array.from({ length: PALAYAN.rows * PALAYAN.cols }, (_, i) => {
              const r = Math.floor(i / PALAYAN.cols);
              const c = i % PALAYAN.cols;
              const cellW = PALAYAN.w / PALAYAN.cols;
              const rowH = PALAYAN.h / PALAYAN.rows;
              const pw = 38, ph = 50;
              return (
                <image
                  key={i}
                  href="/icons/game/palay.png"
                  x={PALAYAN.x + c * cellW + (cellW - pw) / 2}
                  y={PALAYAN.y + (r + 1) * rowH - ph - 3}
                  width={pw} height={ph}
                />
              );
            })}
          </g>

          {/* scattered scenery — every object is tappable for its story */}
          {DECOR.map((d, i) => (
            <image
              key={i}
              className="poi"
              href={d.href}
              x={d.x} y={d.y} width={d.w} height={d.h}
              onClick={() => { sfxClick(); setInfo(d); }}
            >
              <title>{d.title}</title>
            </image>
          ))}

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
          {TREES.map(([tx, ty, tw, th], i) => (
            <image
              key={i}
              className="poi"
              href="/icons/game/tree.png"
              x={tx} y={ty} width={tw} height={th}
              onClick={() => {
                sfxClick();
                setInfo({ href: "/icons/game/tree.png", x: tx, y: ty, w: tw, h: th, ...TREE_INFO });
              }}
            >
              <title>{TREE_INFO.title}</title>
            </image>
          ))}

          {/* stop points — one per lesson; each is a TRIGGER: tapping a
              reached stop launches that exact lesson */}
          {stops.map((s, i) => {
            const { mod, screenIdx, passed, playable } = stopInfo(s);
            const isNext = playable && !passed; // the next level to play
            return (
              <g
                key={i}
                className={playable ? "poi" : undefined}
                style={{ cursor: playable ? "pointer" : "default" }}
                onMouseEnter={() => setHoverStop(s)}
                onMouseLeave={() => setHoverStop((h) => (h === s ? null : h))}
                onClick={() => {
                  if (!playable) {
                    // locked stop — show its info card briefly instead
                    sfxWrong();
                    setHoverStop(s);
                    setTimeout(() => setHoverStop((h) => (h === s ? null : h)), 1600);
                    return;
                  }
                  sfxClick();
                  onPlay(s.m, screenIdx); // each stop point triggers its lesson
                }}
              >
                {/* invisible wider hit area — easier to hover/tap */}
                <circle cx={s.x} cy={s.y} r={16} fill="transparent" />
                {/* pulsing halo marks the NEXT level to play */}
                {isNext && (
                  <circle
                    cx={s.x} cy={s.y} r={13} fill="#ffeb3b88"
                    style={{ transformBox: "fill-box", transformOrigin: "center", animation: "pulse .8s infinite alternate" }}
                  />
                )}
                <circle
                  cx={s.x} cy={s.y} r={7}
                  fill={passed ? mod.themeColor : isNext ? "#ffd54f" : playable ? "#fffdf5" : "#e7dfc9"}
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
            const label = done ? "✔ Completed — replay!" : locked ? "Locked" : at > NARRATIVE_SCREENS - 1 ? `Level ${at - NARRATIVE_SCREENS + 1}/${LESSON_COUNT}` : "Start here!";
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
                  /* the NPC stands beside the road, off the stop points —
                     with an idle animation when frames are available */
                  <IdleNpc icon={m.npc.icon} cx={CHAR[i].x} cy={CHAR[i].y} s={CHAR[i].s} />
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
              <WalkingAvatar gender={progress.gender} walking={walking} />
              {progress.name && (
                <text y="-66" textAnchor="middle" fontSize="13" fontWeight="900" fill="#bf360c" stroke="#fff8e1" strokeWidth="4" paintOrder="stroke">
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

        {/* hover card — identifies the stop point under the cursor */}
        {hoverStop && (() => {
          const { mod, screen, passed, playable } = stopInfo(hoverStop);
          return (
            <Box
              sx={{
                position: "absolute",
                left: `${(hoverStop.x / 2000) * 100}%`,
                top: `${(hoverStop.y / 1200) * 100}%`,
                transform: "translate(-50%, calc(-100% - 14px))",
                pointerEvents: "none",
                zIndex: 25,
                bgcolor: "#fffde7",
                border: `2.5px solid ${playable ? mod.themeColor : "#9e9e9e"}`,
                borderRadius: 2,
                px: 1.3, py: 0.7,
                minWidth: 168, maxWidth: 230,
                boxShadow: "0 6px 14px #0006",
                animation: "popIn .18s",
              }}
            >
              <Typography sx={{ fontWeight: 900, fontSize: 12.5, color: "#3e2723", lineHeight: 1.25 }}>
                {TYPE_ICONS[screen.type]} Level {hoverStop.k}: {shortTitle(screen)}
              </Typography>
              <Typography sx={{ fontSize: 10.5, color: "#8d6e63", fontWeight: 700 }}>
                {PLACE_NAMES[hoverStop.m]}
              </Typography>
              <Typography sx={{
                fontSize: 11, fontWeight: 800, mt: 0.2,
                color: passed ? "#2e7d32" : playable ? "#e65100" : "#757575",
              }}>
                {passed ? "✔ Completed — tap to replay" : playable ? "▶ Next level — tap to play!" : "🔒 Locked — reach this stop first"}
              </Typography>
              <Typography sx={{ fontSize: 10.5, fontWeight: 800, color: "#f57f17", display: "flex", alignItems: "center", gap: 0.4 }}>
                <img src="/icons/game/coin.png" width={12} height={12} alt="" /> +{screen.reward} coins
              </Typography>
            </Box>
          );
        })()}
      </Box>
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
      <Box sx={{ position: "absolute", left: 18, bottom: 16, display: "flex", gap: 1, zIndex: 10 }}>
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
        <DialogTitle sx={{
          fontWeight: 900, bgcolor: "#2e7d32", color: "#fff", textAlign: "center",
          fontSize: { xs: 15, sm: 18, md: 20 },
          py: { xs: 1, md: 1.5 },
        }}>
          Maligayang pagdating sa Barangay Masagana!
        </DialogTitle>
        <DialogContent sx={{ bgcolor: "#fffde7", textAlign: "center" }}>
          <Typography sx={{ my: { xs: 1, md: 1.5 }, fontWeight: 800, fontSize: { xs: 14, md: 16 } }}>
            Set up your player profile:
          </Typography>
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
                    : `▶ Continue — Level ${resume - NARRATIVE_SCREENS + 1}: ${shortTitle(m.screens[resume])}`}
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
