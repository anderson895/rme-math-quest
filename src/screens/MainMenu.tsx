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

import { useLayoutEffect, useRef, useState } from "react";
import {
  Box, Chip, Dialog, DialogContent, DialogTitle, IconButton, Tooltip, Typography, Button,
} from "@mui/material";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import MusicOffRoundedIcon from "@mui/icons-material/MusicOffRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
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

/* where each community location sits along the barangay road */
const NODE_F = [0.14, 0.52, 0.9];
const TRAIL_START_F = 0.02;

const PLACE_NAMES = ["Bukid ni Tatay Ben", "Tindahan ni Ate Lalay", "Plaza ng Barangay"];

/* ============================================================
   Original flat-style SVG buildings (own artwork — no external
   assets needed). Swap for downloaded icons later by dropping
   files in public/icons/ and editing these components.
   ============================================================ */
function HouseSvg({ x, y, s = 1, wall = "#f5e6c8", roof = "#b3564d" }: { x: number; y: number; s?: number; wall?: string; roof?: string }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`}>
      <rect x="-28" y="-22" width="56" height="34" fill={wall} stroke="#00000026" strokeWidth="1.5" />
      <polygon points="-34,-22 0,-48 34,-22" fill={roof} stroke="#00000026" strokeWidth="1.5" />
      <rect x="-7" y="-5" width="14" height="17" rx="2" fill="#7b4a2d" />
      <rect x="-23" y="-14" width="12" height="10" fill="#a5d8f3" stroke="#546e7a" strokeWidth="1.5" />
      <rect x="11" y="-14" width="12" height="10" fill="#a5d8f3" stroke="#546e7a" strokeWidth="1.5" />
    </g>
  );
}

function SchoolSvg({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x="-46" y="-26" width="92" height="40" fill="#fde3a7" stroke="#00000026" strokeWidth="1.5" />
      <polygon points="-52,-26 0,-50 52,-26" fill="#8d6e63" />
      <rect x="-3" y="-62" width="4" height="16" fill="#6d4c41" />
      <polygon points="1,-62 18,-57 1,-52" fill="#e53935" />
      {[-34, -12, 14].map((wx) => (
        <rect key={wx} x={wx} y="-16" width="13" height="11" fill="#a5d8f3" stroke="#546e7a" strokeWidth="1.5" />
      ))}
      <rect x="-8" y="-4" width="16" height="18" rx="2" fill="#6d4c41" />
    </g>
  );
}

function ChurchSvg({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x="-24" y="-24" width="48" height="38" fill="#f0f0e4" stroke="#00000026" strokeWidth="1.5" />
      <polygon points="-30,-24 0,-52 30,-24" fill="#a1887f" />
      <rect x="-2.5" y="-70" width="5" height="14" fill="#6d4c41" />
      <rect x="-8" y="-64" width="16" height="4" fill="#6d4c41" />
      <rect x="-7" y="-6" width="14" height="20" rx="7" fill="#7b4a2d" />
      <circle cx="0" cy="-34" r="6" fill="#fff3c4" stroke="#8d6e63" strokeWidth="1.5" />
    </g>
  );
}

function HallSvg({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x="-40" y="-22" width="80" height="34" fill="#e8eaf6" stroke="#00000026" strokeWidth="1.5" />
      <polygon points="-46,-22 0,-44 46,-22" fill="#5c6bc0" />
      {[-30, -12, 8, 24].map((cx) => (
        <rect key={cx} x={cx} y="-16" width="7" height="28" fill="#c5cae9" stroke="#7986cb" strokeWidth="1" />
      ))}
    </g>
  );
}

function TreeSvg({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`}>
      <rect x="-3" y="-6" width="6" height="16" fill="#8d6e63" rx="2" />
      <circle cx="0" cy="-16" r="15" fill="#66bb6a" />
      <circle cx="-9" cy="-9" r="10" fill="#81c784" />
      <circle cx="9" cy="-9" r="10" fill="#4caf50" />
    </g>
  );
}

function PalmSvg({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x="-3" y="-24" width="6" height="34" fill="#a1774f" rx="3" />
      {[-40, -15, 15, 40].map((deg) => (
        <ellipse key={deg} cx="0" cy="-28" rx="17" ry="6" fill="#43a047"
          transform={`rotate(${deg}, 0, -26)`} />
      ))}
    </g>
  );
}

function CarSvg({ x, y, color = "#e53935", flip = false }: { x: number; y: number; color?: string; flip?: boolean }) {
  return (
    <g transform={`translate(${x}, ${y})${flip ? " scale(-1,1)" : ""}`}>
      <rect x="-20" y="-10" width="40" height="12" rx="5" fill={color} stroke="#00000033" strokeWidth="1.5" />
      <rect x="-11" y="-17" width="20" height="9" rx="4" fill="#a5d8f3" stroke="#546e7a" strokeWidth="1.5" />
      <circle cx="-11" cy="3" r="4.5" fill="#37474f" />
      <circle cx="11" cy="3" r="4.5" fill="#37474f" />
    </g>
  );
}

function BusSvg({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x="-30" y="-20" width="60" height="24" rx="5" fill="#42a5f5" stroke="#00000033" strokeWidth="1.5" />
      {[-22, -6, 10].map((wx) => (
        <rect key={wx} x={wx} y="-15" width="11" height="9" rx="2" fill="#e3f2fd" stroke="#1565c0" strokeWidth="1" />
      ))}
      <circle cx="-16" cy="6" r="5" fill="#37474f" />
      <circle cx="16" cy="6" r="5" fill="#37474f" />
    </g>
  );
}

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

export default function MainMenu({
  onPlay,
}: {
  onPlay: (moduleIdx: number, startIndex?: number) => void;
}) {
  const { progress, resetProgress } = useGame();
  const pathRef = useRef<SVGPathElement>(null);
  const [nodes, setNodes] = useState<Pt[]>([]);
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
  const avatarF = segStart + within * (NODE_F[cur] - segStart);

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
        p: 2, gap: 1,
      }}
    >
      {/* title + player info */}
      <Typography sx={{ fontWeight: 900, color: "#1b5e20", fontSize: "clamp(20px, 3.4vw, 32px)", textShadow: "0 2px 0 #fff8", textAlign: "center" }}>
        🏘️ Barangay Masagana Math Quest
      </Typography>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "center" }}>
        <Chip label={progress.name ? `${progress.avatar} ${progress.name}` : "👤 New resident — visit the farm first!"}
          size="small" sx={{ bgcolor: "#fff", fontWeight: 800 }} />
        <Chip icon={<PaidRoundedIcon sx={{ color: "#f9a825 !important" }} />} label={`${progress.coins} coins`}
          size="small" sx={{ bgcolor: "#fff", fontWeight: 800 }} />
        <Chip label={`🏅 ${Object.values(progress.completed).filter(Boolean).length}/${MODULES.length} modules`}
          size="small" sx={{ bgcolor: "#fff", fontWeight: 800 }} />
        {UNLOCK_ALL_LEVELS && (
          <Chip label="🛠️ DEV MODE — all levels unlocked" size="small"
            sx={{ bgcolor: "#212121", color: "#ffeb3b", fontWeight: 800 }} />
        )}
      </Box>

      {/* the barangay map board */}
      <Box
        sx={{
          position: "relative",
          width: "min(960px, 96vw)",
          maxHeight: "74vh",
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

          {/* a crossing side street for the community feel */}
          <rect x="452" y="330" width="52" height="248" fill="#455a64" rx="6" />
          <line x1="478" y1="345" x2="478" y2="570" stroke="#eceff1" strokeWidth="3" strokeDasharray="14 12" />

          {/* community buildings & greenery (original flat SVG art) */}
          <HouseSvg x={140} y={120} />
          <HouseSvg x={250} y={95} roof="#8d6e63" wall="#fbe9e7" />
          <HallSvg x={610} y={82} />
          <SchoolSvg x={845} y={118} />
          <ChurchSvg x={85} y={305} />
          <HouseSvg x={905} y={288} s={0.9} roof="#6d4c41" />
          <HouseSvg x={140} y={492} roof="#7cb342" wall="#fffde7" />
          <HouseSvg x={865} y={522} s={0.9} wall="#ffe0b2" />
          <HouseSvg x={560} y={562} s={0.8} roof="#5d4037" />
          <TreeSvg x={60} y={185} />
          <TreeSvg x={935} y={195} s={0.9} />
          <TreeSvg x={420} y={95} s={0.8} />
          <TreeSvg x={300} y={555} s={0.9} />
          <TreeSvg x={940} y={430} s={0.85} />
          <PalmSvg x={700} y={95} />
          <PalmSvg x={62} y={430} />
          <PalmSvg x={702} y={556} />
          {/* vehicles on the road */}
          <CarSvg x={592} y={247} color="#ef6c00" />
          <BusSvg x={372} y={412} />
          <CarSvg x={790} y={382} color="#8e24aa" flip />

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
                {locked ? (
                  <>
                    <circle r="36" fill="#cfcfcf" stroke="#8d8d8d" strokeWidth="5" />
                    <text y="12" textAnchor="middle" fontSize="34">🔒</text>
                  </>
                ) : (
                  /* the badge IS the station — no extra border, extra large
                     so the character's name ribbon is readable */
                  <MapIcon icon={m.npc.icon} imgX={-78} imgY={-78} imgSize={156} textY={12} />
                )}
                {done && <text x="58" y="-58" fontSize="24">⭐</text>}
                <text y="-88" textAnchor="middle" fontSize="15" fontWeight="900" fill="#3e2723" stroke="#b9dd8f" strokeWidth="4" paintOrder="stroke">
                  {`${i + 1}. ${PLACE_NAMES[i]}`}
                </text>
                <text y="96" textAnchor="middle" fontSize="13" fontWeight="800" fill={locked ? "#666" : "#1b5e20"} stroke="#b9dd8f" strokeWidth="4" paintOrder="stroke">
                  {label}
                </text>
                {/* bouncing PLAY arrow over/under the next station */}
                {i === cur && !done && (
                  pt.y > 200 ? (
                    <g className="map-bounce" style={{ pointerEvents: "none" }}>
                      <polygon points="-6,-148 6,-148 6,-122 14,-122 0,-102 -14,-122 -6,-122"
                        fill="#ffb300" stroke="#e65100" strokeWidth="2.5" strokeLinejoin="round" />
                      <text y="-158" textAnchor="middle" fontSize="15" fontWeight="900" fill="#bf360c" stroke="#fff8e1" strokeWidth="4" paintOrder="stroke">PLAY!</text>
                    </g>
                  ) : (
                    <g className="map-bounce" style={{ pointerEvents: "none" }}>
                      <polygon points="-6,162 6,162 6,136 14,136 0,116 -14,136 -6,136"
                        fill="#ffb300" stroke="#e65100" strokeWidth="2.5" strokeLinejoin="round" />
                      <text y="184" textAnchor="middle" fontSize="15" fontWeight="900" fill="#bf360c" stroke="#fff8e1" strokeWidth="4" paintOrder="stroke">PLAY!</text>
                    </g>
                  )
                )}
              </g>
            );
          })}

          {/* the player walking along the barangay road */}
          {avatarPt && (
            <g transform={`translate(${avatarPt.x}, ${avatarPt.y})`} className="map-bounce" style={{ pointerEvents: "none" }}>
              <ellipse cy="8" rx="16" ry="5" fill="#00000033" />
              <MapIcon
                icon={progress.gender ? progress.avatar : "🎒"}
                imgX={-20} imgY={-32} imgSize={40} textY={-2}
              />
              {progress.name && (
                <text y="-34" textAnchor="middle" fontSize="13" fontWeight="900" fill="#bf360c" stroke="#fff8e1" strokeWidth="4" paintOrder="stroke">
                  {progress.name}
                </text>
              )}
            </g>
          )}
        </svg>
      </Box>

      {/* icon attribution (required by OpenMoji's CC BY-SA 4.0 license) */}
      <Typography sx={{ fontSize: 11, color: "#33691e", opacity: 0.85 }}>
        Character icons: OpenMoji.org — CC BY-SA 4.0
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
                  🔓 Levels unlock as you reach them — replay any level you've finished!
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
