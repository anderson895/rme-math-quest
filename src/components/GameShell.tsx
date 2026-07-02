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
import { Box, Chip, IconButton, Paper, Tooltip, Typography, Button } from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import MusicOffRoundedIcon from "@mui/icons-material/MusicOffRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import LightbulbRoundedIcon from "@mui/icons-material/LightbulbRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import type { GameModule, Screen } from "../types";
import { setMusic, setMuted, sfxClick } from "../sound";

interface Props {
  module: GameModule;
  screen: Screen;
  screenNumber: number;   // 1-based
  screenCount: number;
  coins: number;
  avatar: string;
  solved: boolean;
  hint?: string;
  onHome: () => void;
  onReset: () => void;
  onNext: () => void;
  children: ReactNode;    // the active mechanic
}

export default function GameShell(p: Props) {
  const [musicOn, setMusicOn] = useState(false);
  const [showHint, setShowHint] = useState(false);

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
        <Chip label={`${p.module.title} — Screen ${p.screenNumber}/${p.screenCount}`} size="small"
          sx={{ bgcolor: "#ffffffd9", fontWeight: 700 }} />
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
            <Typography sx={{ fontSize: "clamp(12px, 1.7vw, 15px)" }}>{p.screen.dialogue}</Typography>
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

      {/* bottom-right: Hint + Reset (matches reference position) */}
      <Box sx={{ position: "absolute", right: 14, bottom: 12, display: "flex", gap: 1, zIndex: 5 }}>
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

      {/* Continue button when solved */}
      {p.solved && (
        <Box sx={{ position: "absolute", bottom: 12, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 6 }}>
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowForwardRoundedIcon />}
            onClick={p.onNext}
            sx={{ fontWeight: 800, borderRadius: 3, px: 4, bgcolor: "#f9a825", "&:hover": { bgcolor: "#f57f17" }, animation: "pulse 1s infinite alternate" }}
          >
            Continue
          </Button>
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
