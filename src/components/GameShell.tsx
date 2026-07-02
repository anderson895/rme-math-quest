/* ============================================================
   GameShell — gameplay screen layout matching the reference UI:

   ┌──────────────────────────────────────────┐
   │        [ blue question banner ]          │  ← top center
   │                 ▼ arrow                  │
   │        [ workspace panel  ]              │  ← center (mechanic)
   │                                          │
   │   🦉 🦉 🦉  characters row  🦉 🦉 🦉      │  ← bottom strip
   │ [🏠][🎵]                    [💡][↻]      │  ← corner buttons
   └──────────────────────────────────────────┘
   ============================================================ */

import { useState } from "react";
import type { ReactNode } from "react";
import { Box, Chip, IconButton, Paper, Tooltip, Typography } from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import MusicOffRoundedIcon from "@mui/icons-material/MusicOffRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import LightbulbRoundedIcon from "@mui/icons-material/LightbulbRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import ContentCutRoundedIcon from "@mui/icons-material/ContentCutRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import type { GameModule, Screen } from "../types";
import { setMusic, setMuted, sfxClick } from "../sound";
import { useGame } from "../state/GameContext";

/* step-by-step guide per mechanic, shown with arrows under the banner */
const STEP_GUIDES: Partial<Record<Screen["type"], string[]>> = {
  "cut-share":   ["Tap the ✂️ tool", "Choose equal parts, then Cut", "Give each friend a piece"],
  numberline:    ["Tap a road sign", "Tap its spot on the road", "Place all signs"],
  "model-shade": ["Tap beds to shade", "Count the shaded parts", "Press Check"],
  mcq:           ["Read the question", "Tap the best answer"],
  order:         ["Tap cards smallest → largest", "Press Check Order"],
  "sort-bins":   ["Tap a box", "Tap its multiple shelf", "Sort them all"],
  balance:       ["Read the target weight", "Tap the sack that balances"],
  simplify:      ["Tap a common factor ÷", "Repeat until simplest"],
  equation:      ["Find the LCD", "Type your answer", "Press Check"],
  boss:          ["Watch the timer", "Answer every question"],
};

interface Props {
  module: GameModule;
  screen: Screen;
  screenNumber: number;   // 1-based
  screenCount: number;
  coins: number;
  solved: boolean;
  hint?: string;
  /* optional level tool (e.g. the ✂️ cutting tool), reference-style:
     pink button at the lower right with a bouncing guide arrow */
  tool?: "scissors";
  toolActive?: boolean;
  toolAttention?: boolean;
  onTool?: () => void;
  onHome: () => void;
  onReset: () => void;
  onNext: () => void;
  children: ReactNode;    // the active mechanic
}

export default function GameShell(p: Props) {
  const { progress } = useGame();
  const [musicOn, setMusicOn] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // personalize NPC dialogue with the student's name
  const dialogue = p.screen.dialogue.replaceAll("{name}", progress.name || "friend");

  const toggleMusic = () => {
    const next = !musicOn;
    setMusicOn(next);
    setMuted(false);
    setMusic(next);
  };

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        // forest backdrop — placeholder CSS art
        background: `linear-gradient(#cfe8c2 0%, #dff0d0 52%, ${p.module.themeColor} 52%, #33691e 100%)`,
      }}
    >
      {/* side trees (placeholder emoji, like the reference forest frame) */}
      <Box sx={sideTree("left")}>🌳</Box>
      <Box sx={sideTree("right")}>🌳</Box>

      {/* progress + coins strip */}
      <Box sx={{ display: "flex", justifyContent: "space-between", px: 2, pt: 1, zIndex: 3 }}>
        <Box sx={{ display: "flex", gap: 1 }}>
          {progress.name && (
            <Chip label={`${progress.avatar} ${progress.name}`} size="small"
              sx={{ bgcolor: "#e8f5e9d9", fontWeight: 800 }} />
          )}
          <Chip label={`${p.module.title} — Screen ${p.screenNumber}/${p.screenCount}`} size="small"
            sx={{ bgcolor: "#ffffffd9", fontWeight: 700 }} />
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Chip label={p.screen.rme} size="small" sx={{ bgcolor: "#fff3e0d9", fontWeight: 600 }} />
          <Chip icon={<PaidRoundedIcon sx={{ color: "#f9a825 !important" }} />} label={p.coins}
            size="small" sx={{ bgcolor: "#ffffffd9", fontWeight: 700 }} />
        </Box>
      </Box>

      {/* top question banner (blue bar in reference) */}
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mt: 1, zIndex: 3 }}>
        <Paper
          elevation={4}
          sx={{
            px: 4, py: 1.2,
            minWidth: "min(560px, 82vw)",
            textAlign: "center",
            bgcolor: "#283593",
            color: "#fff",
            borderRadius: 1,
            border: "3px solid #1a237e",
          }}
        >
          <Typography sx={{ fontWeight: 800, fontSize: "clamp(14px, 2.2vw, 20px)", letterSpacing: 0.5 }}>
            {p.screen.banner}
          </Typography>
        </Paper>
        <Typography sx={{ fontSize: 30, lineHeight: 1, color: "#f9a825", textShadow: "0 2px 2px #0006" }}>
          ▼
        </Typography>

        {/* step guide arrows */}
        {STEP_GUIDES[p.screen.type] && (
          <Box sx={{
            display: "flex", alignItems: "center", gap: 0.8, flexWrap: "wrap", justifyContent: "center",
            bgcolor: "#fff8e1e6", border: "2px solid #f9a825", borderRadius: 5, px: 1.5, py: 0.4, mt: 0.3,
          }}>
            {STEP_GUIDES[p.screen.type]!.map((step, i, arr) => (
              <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                <Box sx={{
                  width: 20, height: 20, borderRadius: "50%", bgcolor: "#f9a825", color: "#fff",
                  fontSize: 12, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {i + 1}
                </Box>
                <Typography sx={{ fontSize: "clamp(11px, 1.5vw, 13.5px)", fontWeight: 700, color: "#5d4037" }}>
                  {step}
                </Typography>
                {i < arr.length - 1 && (
                  <ArrowForwardRoundedIcon sx={{ fontSize: 17, color: "#e65100" }} />
                )}
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* center workspace panel */}
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3, px: 2, minHeight: 0 }}>
        <Paper
          elevation={6}
          sx={{
            p: { xs: 2, md: 3 },
            width: "min(720px, 94vw)",
            maxHeight: "100%",
            overflowY: "auto",
            bgcolor: "#f9fbe7f2",
            border: "4px solid #827717",
            borderRadius: 3,
          }}
        >
          {p.children}
        </Paper>
      </Box>

      {/* NPC dialogue strip + characters row (bottom, like the owls row) */}
      <Box sx={{ zIndex: 3, px: 2, pb: 7 }}>
        <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 1.5 }}>
          <Typography sx={{ fontSize: "clamp(44px, 7vw, 72px)", lineHeight: 1, filter: "drop-shadow(0 4px 3px #0005)" }}>
            {p.module.npc.icon}
          </Typography>
          <Paper sx={{ px: 2, py: 1, maxWidth: 560, bgcolor: "#fffde7", border: "2px solid #5d4037", borderRadius: 2 }}>
            <Typography sx={{ fontWeight: 700, color: "#5d4037", fontSize: 13 }}>
              {p.module.npc.name}
            </Typography>
            <Typography sx={{ fontSize: "clamp(12px, 1.7vw, 15px)" }}>{dialogue}</Typography>
          </Paper>
          <Typography sx={{ fontSize: "clamp(24px, 4vw, 40px)", letterSpacing: 4, opacity: 0.95 }}>
            {p.module.scenery}
          </Typography>
        </Box>
      </Box>

      {/* bottom-left: Home + Music (matches reference position) */}
      <Box sx={{ position: "absolute", left: 14, bottom: 12, display: "flex", gap: 1, zIndex: 5 }}>
        <Tooltip title="Home">
          <IconButton onClick={() => { sfxClick(); p.onHome(); }} sx={cornerBtn("#00897b")}>
            <HomeRoundedIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Music">
          <IconButton onClick={toggleMusic} sx={cornerBtn("#c2185b")}>
            {musicOn ? <MusicNoteRoundedIcon /> : <MusicOffRoundedIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* bottom-right: Tool + Hint + Reset (matches reference position) */}
      <Box sx={{ position: "absolute", right: 14, bottom: 12, display: "flex", gap: 1, zIndex: 5 }}>
        {p.tool === "scissors" && (
          <Box sx={{ position: "relative" }}>
            {/* bouncing guide arrow pointing at the tool */}
            {p.toolAttention && (
              <Box className="map-bounce" sx={{ position: "absolute", top: -44, left: "50%", ml: "-13px", pointerEvents: "none" }}>
                <svg width="26" height="36" viewBox="0 0 26 36">
                  <polygon points="7,0 19,0 19,16 26,16 13,34 0,16 7,16"
                    fill="#ff9800" stroke="#e65100" strokeWidth="2" strokeLinejoin="round" />
                </svg>
              </Box>
            )}
            <Tooltip title="Cutting tool">
              <IconButton onClick={() => { sfxClick(); p.onTool?.(); }}
                sx={cornerBtn(p.toolActive ? "#880e4f" : "#c2185b")}>
                <ContentCutRoundedIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )}
        {p.hint && (
          <Tooltip title="Hint">
            <IconButton onClick={() => { sfxClick(); setShowHint(!showHint); }} sx={cornerBtn("#c2185b")}>
              <LightbulbRoundedIcon />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Restart screen">
          <IconButton onClick={() => { sfxClick(); p.onReset(); }} sx={cornerBtn("#ef6c00")}>
            <ReplayRoundedIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* hint popup */}
      {showHint && p.hint && (
        <Paper sx={{ position: "absolute", right: 14, bottom: 70, p: 1.5, maxWidth: 300, zIndex: 6, bgcolor: "#fff8e1", border: "2px solid #f9a825", borderRadius: 2 }}>
          <Typography sx={{ fontSize: 14 }}>💡 {p.hint}</Typography>
        </Paper>
      )}

      {/* big yellow NEXT arrow when solved (reference-style) */}
      {p.solved && (
        <Box
          onClick={p.onNext}
          sx={{
            position: "absolute", right: "3%", top: "34%", zIndex: 6,
            cursor: "pointer", textAlign: "center",
            animation: "pulse .8s infinite alternate",
            filter: "drop-shadow(0 6px 8px #0007)",
            "&:hover": { filter: "drop-shadow(0 6px 8px #0007) brightness(1.1)" },
          }}
        >
          <svg width="120" height="76" viewBox="0 0 120 76">
            <polygon
              points="0,23 66,23 66,4 116,38 66,72 66,53 0,53"
              fill="#ffeb3b" stroke="#f9a825" strokeWidth="4" strokeLinejoin="round"
            />
          </svg>
          <Typography sx={{ fontWeight: 900, color: "#fff", textShadow: "0 2px 3px #000a", mt: -1, letterSpacing: 1 }}>
            NEXT
          </Typography>
        </Box>
      )}
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

const sideTree = (side: "left" | "right") => ({
  position: "absolute" as const,
  [side]: -30,
  top: 0,
  bottom: 0,
  display: "flex",
  alignItems: "center",
  fontSize: "min(28vh, 220px)",
  opacity: 0.9,
  zIndex: 1,
  pointerEvents: "none" as const,
});
