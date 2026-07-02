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
} from "@mui/material";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import MusicOffRoundedIcon from "@mui/icons-material/MusicOffRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import { MODULES } from "../data/modules";
import { useGame } from "../state/GameContext";
import { setMusic, sfxClick, sfxWrong } from "../sound";
import GameIcon, { iconSources } from "../components/GameIcon";
import { UNLOCK_ALL_LEVELS } from "../dev";
import type { Screen } from "../types";

/** SVG icon with override fallback chain: custom image → next source → emoji text. */
function MapIcon({
  icon, imgX, imgY, imgSize, textY, fontSize = 34,
}: {
  icon: string; imgX: number; imgY: number; imgSize: number; textY: number; fontSize?: number;
}) {
  const sources = iconSources(icon);
  const [idx, setIdx] = useState(0);
  if (idx < sources.length) {
    return (
      <image
        href={sources[idx]}
        x={imgX} y={imgY} width={imgSize} height={imgSize}
        onError={() => setIdx((i) => i + 1)}
      />
    );
  }
  return <text y={textY} textAnchor="middle" fontSize={fontSize}>{icon}</text>;
}

const SCREENS_PER_MODULE = 15;

/* where each community location sits along the barangay road —
   EQUALLY spaced by arc length so every lesson stopover is the
   same walking distance (~46px apart, computed by tools/path_points.mjs) */
const NODE_F = [0.34, 0.67, 1.0];
const TRAIL_START_F = 0.02;

/* horizontal nudge for station titles near the map edge */
const TITLE_DX = [0, 0, -70];

const PLACE_NAMES = ["Bukid ni Tatay Ben", "Tindahan ni Ate Lalay", "Plaza ng Barangay"];

/* buildings/props rendered right BESIDE their station (offsets are
   relative to the station node, so they always stay together) */
const STATION_DECOR: { href: string; x: number; y: number; w: number; h: number }[][] = [
  // 1. Bukid — palay harvest beside Tatay Ben
  [{ href: "/icons/game/palay.png", x: 50, y: -46, w: 56, h: 72 }],
  // 2. Tindahan — the sari-sari store right beside Manang Lalay
  [{ href: "/icons/game/sari-sari-store.png", x: 56, y: -76, w: 92, h: 104 }],
  // 3. Plaza — fiesta stage in the foreground BELOW Kuya Onyok
  // (clear gap under his feet so he isn't standing on the roof)
  [
    { href: "/icons/game/stage.png",   x: -60,  y: 110, w: 128, h: 88 },
    { href: "/icons/game/plants.png",  x: -118, y: 124, w: 50,  h: 36 },
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
interface Stop extends Pt { m: number; k: number }  // module index, lesson number (1..14)

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
  const { progress, resetProgress } = useGame();
  const pathRef = useRef<SVGPathElement>(null);
  const [nodes, setNodes] = useState<Pt[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [avatarPt, setAvatarPt] = useState<Pt | null>(null);
  const [musicOn, setMusicOn] = useState(false);
  const [shakeIdx, setShakeIdx] = useState<number | null>(null);
  const [selectIdx, setSelectIdx] = useState<number | null>(null); // level-select dialog

  /* --- overall progress → position along the road --- */
  let cur = MODULES.findIndex((m) => !progress.completed[m.id]);
  if (cur === -1) cur = MODULES.length - 1;
  const curDone = progress.completed[MODULES[cur].id];
  const within = curDone ? 1 : (progress.screenIndex[MODULES[cur].id] ?? 0) / SCREENS_PER_MODULE;
  const segStart = cur === 0 ? TRAIL_START_F : NODE_F[cur - 1];
  const segLen = NODE_F[cur] - segStart;
  let avatarF = segStart + within * segLen;
  // never stand ON TOP of an NPC: when a new module begins, wait on the
  // road just past the previous station; when arriving, stop just before
  // the station character
  if (cur > 0 && within === 0) avatarF = segStart + (0.5 / SCREENS_PER_MODULE) * segLen;
  if (within >= 1) avatarF = NODE_F[cur] - (0.45 / SCREENS_PER_MODULE) * segLen;

  useLayoutEffect(() => {
    const p = pathRef.current;
    if (!p) return;
    const L = p.getTotalLength();
    const at = (f: number): Pt => {
      const pt = p.getPointAtLength(L * f);
      return { x: pt.x, y: pt.y };
    };
    setNodes(NODE_F.map(at));
    setAvatarPt(at(avatarF));

    // stopover dots: one per lesson along each module's road segment
    // (lesson 15 is the station itself); the avatar lands exactly on
    // these because its position uses the same fractions
    const stopPts: Stop[] = [];
    NODE_F.forEach((end, mi) => {
      const start = mi === 0 ? TRAIL_START_F : NODE_F[mi - 1];
      for (let k = 1; k < SCREENS_PER_MODULE; k++) {
        const f = start + (k / SCREENS_PER_MODULE) * (end - start);
        stopPts.push({ ...at(f), m: mi, k });
      }
    });
    setStops(stopPts);
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
      <Typography sx={{ fontWeight: 900, color: "#1b5e20", fontSize: "clamp(17px, 2.6vw, 26px)", textShadow: "0 2px 0 #fff8", textAlign: "center", display: "flex", alignItems: "center", gap: 1 }}>
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
          width: "min(1320px, 97vw)",
          maxHeight: "82vh",
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
          <image href="/icons/game/bahay-kubo.png" x={82} y={58} width={118} height={108} />
          {/* harvest festival stall in Tatay Ben's farm area */}
          <image href="/icons/game/festival-stall.png" x={650} y={95} width={105} height={84} />
          {/* church with garden flower box and a hanging parol (fiesta!) */}
          <image href="/icons/game/church.png" x={26} y={190} width={132} height={155} />
          <image href="/icons/game/flower-box.png" x={144} y={316} width={52} height={32} />
          <image href="/icons/game/parol.png" x={154} y={208} width={28} height={52} />
          <image href="/icons/game/tree.png" x={30} y={112} width={56} height={78} />
          <image href="/icons/game/tree.png" x={905} y={128} width={52} height={72} />
          <image href="/icons/game/tree.png" x={398} y={40} width={50} height={70} />
          <image href="/icons/game/tree.png" x={100} y={486} width={54} height={75} />
          <image href="/icons/game/tree.png" x={545} y={372} width={52} height={72} />
          <image href="/icons/game/tree.png" x={846} y={76} width={52} height={72} />
          <image href="/icons/game/tree.png" x={688} y={498} width={52} height={72} />
          {/* finish-line flag at the plaza (road's end) */}
          <image href="/icons/game/road-flag.png" x={932} y={268} width={40} height={52} />

          {/* stopover dots — one per lesson; filled once that lesson is done */}
          {stops.map((s, i) => {
            const mod = MODULES[s.m];
            const lessonsDone = progress.completed[mod.id]
              ? SCREENS_PER_MODULE
              : progress.screenIndex[mod.id] ?? 0;
            const passed = lessonsDone >= s.k;
            return (
              <circle
                key={i}
                cx={s.x} cy={s.y} r={5.5}
                fill={passed ? mod.themeColor : "#fffdf5"}
                stroke={passed ? "#ffffff" : "#8d6e63"}
                strokeWidth={2}
                opacity={isLocked(s.m) ? 0.45 : 1}
              />
            );
          })}

          {/* community locations = module stations */}
          {nodes.map((pt, i) => {
            const m = MODULES[i];
            const locked = isLocked(i);
            const done = progress.completed[m.id];
            const at = progress.screenIndex[m.id] ?? 0;
            const label = done ? "✔ Completed — replay!" : locked ? "Locked" : at > 0 ? `Screen ${at + 1}/15` : "Start here!";
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
                {locked ? (
                  <>
                    <circle r="36" fill="#cfcfcf" stroke="#8d8d8d" strokeWidth="5" />
                    {/* drawn padlock (no emoji) */}
                    <path d="M -11 -6 v-6 a11 11 0 0 1 22 0 v6" fill="none" stroke="#616161" strokeWidth="5" />
                    <rect x="-15" y="-6" width="30" height="24" rx="5" fill="#757575" />
                    <circle cy="4" r="4" fill="#eeeeee" />
                    <rect x="-1.8" y="4" width="3.6" height="8" rx="1.8" fill="#eeeeee" />
                  </>
                ) : (
                  /* the badge IS the station — no extra border, extra large
                     so the character's name ribbon is readable */
                  <MapIcon icon={m.npc.icon} imgX={-78} imgY={-78} imgSize={156} textY={12} />
                )}
                {done && <text x="58" y="-58" fontSize="24">⭐</text>}
                <text x={TITLE_DX[i]} y="-88" textAnchor="middle" fontSize="15" fontWeight="900" fill="#3e2723" stroke="#b9dd8f" strokeWidth="4" paintOrder="stroke">
                  {`${i + 1}. ${PLACE_NAMES[i]}`}
                </text>
                <text y="96" textAnchor="middle" fontSize="13" fontWeight="800" fill={locked ? "#666" : "#1b5e20"} stroke="#b9dd8f" strokeWidth="4" paintOrder="stroke">
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
              {!MODULES.every((m) => progress.completed[m.id]) && (
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

      <Typography sx={{ fontSize: 10.5, color: "#33691e", opacity: 0.8 }}>
        Game art: original asset packs (Barangay Masagana Math Quest)
      </Typography>

      {/* bottom-left: music */}
      <Box sx={{ position: "absolute", left: 18, bottom: 16 }}>
        <Tooltip title="Music">
          <IconButton onClick={toggleMusic} sx={cornerBtn("#c2185b")}>
            {musicOn ? <MusicNoteRoundedIcon /> : <MusicOffRoundedIcon />}
          </IconButton>
        </Tooltip>
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
                  ▶ Continue — Screen {resume + 1}: {shortTitle(m.screens[resume])}
                </Button>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 1 }}>
                  {m.screens.map((s, idx) => {
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
                        {idx + 1}. {shortTitle(s)}
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
