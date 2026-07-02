/* ============================================================
   MainMenu — adventure progress map (reference: parchment map
   with a dashed winding trail, trees, and a traveler marker).

   The trail passes 3 stations (the game modules). The player's
   avatar sits on the trail according to overall progress.
   All map art is temporary CSS/SVG + emoji placeholders.
   ============================================================ */

import { useLayoutEffect, useRef, useState } from "react";
import { Box, Chip, IconButton, Tooltip, Typography } from "@mui/material";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import MusicOffRoundedIcon from "@mui/icons-material/MusicOffRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import { MODULES } from "../data/modules";
import { useGame } from "../state/GameContext";
import { setMusic, sfxClick, sfxWrong } from "../sound";

const SCREENS_PER_MODULE = 15;

/* where each module station sits along the trail (fraction of path length) */
const NODE_F = [0.14, 0.52, 0.9];
const TRAIL_START_F = 0.02;

/* decorative trees: [x, y, emoji, size] */
const TREES: [number, number, string, number][] = [
  [80, 120, "🌲", 34], [210, 90, "🌳", 30], [330, 240, "🌲", 30],
  [520, 200, "🌲", 36], [640, 90, "🌳", 32], [820, 100, "🌳", 30],
  [880, 160, "🌲", 26], [140, 420, "🌳", 34], [90, 500, "🌲", 28],
  [430, 420, "🌲", 30], [700, 250, "🌲", 26], [860, 470, "🌳", 32],
  [280, 520, "🌲", 26], [600, 545, "🌳", 28],
];

const TRAIL_D =
  "M 100 195 C 280 125 500 110 670 155 C 830 200 850 275 700 312 " +
  "C 500 358 320 305 260 385 C 210 452 350 522 560 502 C 720 487 830 432 900 352";

interface Pt { x: number; y: number }

export default function MainMenu({ onPlay }: { onPlay: (moduleIdx: number) => void }) {
  const { progress, resetProgress } = useGame();
  const pathRef = useRef<SVGPathElement>(null);
  const [nodes, setNodes] = useState<Pt[]>([]);
  const [avatarPt, setAvatarPt] = useState<Pt | null>(null);
  const [musicOn, setMusicOn] = useState(false);
  const [shakeIdx, setShakeIdx] = useState<number | null>(null);

  /* --- overall progress → position along the trail --- */
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

  const clickStation = (i: number) => {
    if (i + 1 > progress.unlocked) {
      sfxWrong();
      setShakeIdx(i);
      setTimeout(() => setShakeIdx(null), 500);
      return;
    }
    sfxClick();
    onPlay(i);
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
        // dark wooden table under the map
        background: "radial-gradient(ellipse at center, #8d5a2b 0%, #5d3a15 60%, #2e1a06 100%)",
        p: 2, gap: 1,
      }}
    >
      {/* title + player info */}
      <Typography sx={{ fontWeight: 900, color: "#ffe082", fontSize: "clamp(20px, 3.4vw, 32px)", textShadow: "0 3px 4px #0008", textAlign: "center" }}>
        🗺️ Barangay Masagana Math Quest
      </Typography>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "center" }}>
        <Chip label={progress.name ? `${progress.avatar} ${progress.name}` : "👤 New adventurer — start at Station 1"}
          size="small" sx={{ bgcolor: "#fff8e1", fontWeight: 800 }} />
        <Chip icon={<PaidRoundedIcon sx={{ color: "#f9a825 !important" }} />} label={`${progress.coins} coins`}
          size="small" sx={{ bgcolor: "#fff8e1", fontWeight: 800 }} />
        <Chip label={`🏅 ${Object.values(progress.completed).filter(Boolean).length}/${MODULES.length} modules`}
          size="small" sx={{ bgcolor: "#fff8e1", fontWeight: 800 }} />
      </Box>

      {/* the parchment map */}
      <Box
        sx={{
          position: "relative",
          width: "min(960px, 96vw)",
          maxHeight: "74vh",
          aspectRatio: "1000 / 600",
          transform: "rotate(-0.6deg)",
          filter: "drop-shadow(0 14px 18px #0009)",
        }}
      >
        <svg viewBox="0 0 1000 600" width="100%" height="100%" style={{ display: "block", overflow: "visible" }}>
          {/* torn parchment sheet */}
          <polygon
            points="30,70 120,40 260,55 420,25 600,50 760,30 900,60 975,120 950,240 970,360 940,470 850,545 700,565 540,540 380,570 230,545 90,560 40,470 60,340 25,210"
            fill="#e6e0bd" stroke="#c9c095" strokeWidth="4"
          />
          {/* forest landmasses */}
          <path d="M 180 210 C 240 90 460 60 600 110 C 760 165 800 260 720 330 C 620 420 420 460 300 400 C 190 345 140 290 180 210 Z" fill="#2f7d32" />
          <path d="M 300 380 C 380 470 560 500 680 450 C 780 410 800 350 740 320 C 620 380 420 420 300 380 Z" fill="#43a047" />
          <path d="M 700 180 C 800 150 880 190 900 250 C 880 320 790 340 720 310 Z" fill="#66bb6a" opacity="0.85" />
          <path d="M 120 380 C 180 350 240 380 250 440 C 220 500 140 500 110 460 Z" fill="#81c784" opacity="0.8" />

          {/* trees */}
          {TREES.map(([x, y, t, s], i) => (
            <text key={i} x={x} y={y} fontSize={s} textAnchor="middle">{t}</text>
          ))}

          {/* dashed trail */}
          <path
            ref={pathRef}
            d={TRAIL_D}
            fill="none"
            stroke="#ffffff"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray="2 22"
          />

          {/* module stations */}
          {nodes.map((pt, i) => {
            const m = MODULES[i];
            const locked = i + 1 > progress.unlocked;
            const done = progress.completed[m.id];
            const at = progress.screenIndex[m.id] ?? 0;
            const label = done ? "✔ Completed" : locked ? "Locked" : at > 0 ? `Screen ${at + 1}/15` : "Start here!";
            return (
              <g
                key={m.id}
                transform={`translate(${pt.x}, ${pt.y})`}
                onClick={() => clickStation(i)}
                style={{ cursor: locked ? "not-allowed" : "pointer" }}
                className={shakeIdx === i ? "map-shake" : undefined}
              >
                <title>{`Module ${i + 1}: ${m.title}\n${m.competencies.join("\n")}`}</title>
                <circle r="36" fill={locked ? "#cfcfcf" : "#fff8e1"} stroke={locked ? "#8d8d8d" : m.themeColor} strokeWidth="5" />
                <text y="12" textAnchor="middle" fontSize="34" style={{ filter: locked ? "grayscale(1)" : "none" }}>
                  {locked ? "🔒" : m.npc.icon}
                </text>
                {done && <text x="24" y="-22" fontSize="20">⭐</text>}
                {/* bouncing "play here" arrow (full arrow: shaft + head) —
                    flips below the station when near the top edge so it
                    never gets cut off */}
                {i === cur && !done && (
                  pt.y > 200 ? (
                    <g className="map-bounce" style={{ pointerEvents: "none" }}>
                      {/* points down at the station */}
                      <polygon
                        points="-6,-106 6,-106 6,-80 14,-80 0,-60 -14,-80 -6,-80"
                        fill="#ffb300" stroke="#e65100" strokeWidth="2.5" strokeLinejoin="round"
                      />
                      <text y="-116" textAnchor="middle" fontSize="15" fontWeight="900" fill="#bf360c" stroke="#fff8e1" strokeWidth="4" paintOrder="stroke">PLAY!</text>
                    </g>
                  ) : (
                    <g className="map-bounce" style={{ pointerEvents: "none" }}>
                      {/* points up at the station */}
                      <polygon
                        points="-6,126 6,126 6,100 14,100 0,80 -14,100 -6,100"
                        fill="#ffb300" stroke="#e65100" strokeWidth="2.5" strokeLinejoin="round"
                      />
                      <text y="148" textAnchor="middle" fontSize="15" fontWeight="900" fill="#bf360c" stroke="#fff8e1" strokeWidth="4" paintOrder="stroke">PLAY!</text>
                    </g>
                  )
                )}
                <text y="-46" textAnchor="middle" fontSize="15" fontWeight="900" fill="#3e2723" stroke="#e6e0bd" strokeWidth="4" paintOrder="stroke">
                  {`${i + 1}. ${m.title}`}
                </text>
                <text y="60" textAnchor="middle" fontSize="13" fontWeight="800" fill={locked ? "#666" : "#1b5e20"} stroke="#e6e0bd" strokeWidth="4" paintOrder="stroke">
                  {label}
                </text>
              </g>
            );
          })}

          {/* traveler avatar on the trail */}
          {avatarPt && (
            <g transform={`translate(${avatarPt.x}, ${avatarPt.y})`} className="map-bounce" style={{ pointerEvents: "none" }}>
              <ellipse cy="8" rx="16" ry="5" fill="#00000033" />
              <text y="-2" textAnchor="middle" fontSize="34">{progress.gender ? progress.avatar : "🎒"}</text>
              {progress.name && (
                <text y="-34" textAnchor="middle" fontSize="13" fontWeight="900" fill="#bf360c" stroke="#fff8e1" strokeWidth="4" paintOrder="stroke">
                  {progress.name}
                </text>
              )}
            </g>
          )}
        </svg>
      </Box>

      {/* bottom-left: music (matches reference) */}
      <Box sx={{ position: "absolute", left: 18, bottom: 16 }}>
        <Tooltip title="Music">
          <IconButton onClick={toggleMusic} sx={cornerBtn("#c2185b")}>
            {musicOn ? <MusicNoteRoundedIcon /> : <MusicOffRoundedIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* bottom-right: reset progress (matches reference) */}
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
    </Box>
  );
}

const cornerBtn = (bg: string) => ({
  bgcolor: bg,
  color: "#fff",
  border: "3px solid #ffffffaa",
  borderRadius: 2,
  "&:hover": { bgcolor: bg, filter: "brightness(1.15)" },
});
