import { Box, Button, Card, CardActionArea, CardContent, Chip, Typography } from "@mui/material";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import { MODULES } from "../data/modules";
import { useGame } from "../state/GameContext";
import { sfxClick } from "../sound";

/** World map / module select. */
export default function MainMenu({ onPlay }: { onPlay: (moduleIdx: number) => void }) {
  const { progress, resetProgress } = useGame();

  return (
    <Box
      sx={{
        position: "fixed", inset: 0, overflowY: "auto",
        background: "linear-gradient(#aee3f5, #d9f2e0 55%, #8bc34a 55%, #558b2f)",
        display: "flex", flexDirection: "column", alignItems: "center", p: 3, gap: 2,
      }}
    >
      <Typography sx={{ fontSize: 44, lineHeight: 1, mt: 1 }}>🌾🏪🎪</Typography>
      <Typography variant="h4" sx={{ fontWeight: 900, color: "#1b5e20", textAlign: "center", textShadow: "0 2px 0 #fff8" }}>
        Barangay Masagana Math Quest
      </Typography>
      <Typography sx={{ color: "#33691e", fontWeight: 600, textAlign: "center", maxWidth: 560 }}>
        Game-Based Realistic Mathematics Education — three community adventures, 15 screens each.
      </Typography>

      <Box sx={{ display: "flex", gap: 1 }}>
        <Chip icon={<PaidRoundedIcon sx={{ color: "#f9a825 !important" }} />} label={`${progress.coins} coins`} sx={{ bgcolor: "#fff", fontWeight: 800 }} />
        <Chip icon={<EmojiEventsRoundedIcon sx={{ color: "#8d6e63 !important" }} />}
          label={`${Object.values(progress.completed).filter(Boolean).length} / ${MODULES.length} modules`}
          sx={{ bgcolor: "#fff", fontWeight: 800 }} />
        <Chip label={`Avatar ${progress.avatar}`} sx={{ bgcolor: "#fff", fontWeight: 800 }} />
      </Box>

      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center", mt: 1 }}>
        {MODULES.map((m, i) => {
          const locked = i + 1 > progress.unlocked;
          const done = progress.completed[m.id];
          const at = progress.screenIndex[m.id] ?? 0;
          return (
            <Card key={m.id} sx={{
              width: 270, borderRadius: 4, border: `4px solid ${locked ? "#9e9e9e" : m.themeColor}`,
              opacity: locked ? 0.65 : 1, bgcolor: "#fffde7",
            }}>
              <CardActionArea disabled={locked} onClick={() => { sfxClick(); onPlay(i); }}>
                <CardContent sx={{ textAlign: "center" }}>
                  <Typography sx={{ fontSize: 52, lineHeight: 1.2 }}>
                    {locked ? "🔒" : m.npc.icon}
                  </Typography>
                  <Typography sx={{ fontWeight: 900, fontSize: 17, color: "#3e2723" }}>
                    Module {i + 1}: {m.title}
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: "#6d4c41", mb: 1 }}>{m.subtitle}</Typography>
                  {m.competencies.map((c) => (
                    <Typography key={c} sx={{ fontSize: 11.5, color: "#555" }}>• {c}</Typography>
                  ))}
                  <Chip
                    size="small"
                    icon={locked ? <LockRoundedIcon /> : undefined}
                    label={locked ? "Finish the previous module" : done ? "✔ Completed — Replay" : at > 0 ? `Continue — Screen ${at + 1}/15` : "Start Adventure"}
                    sx={{ mt: 1.2, fontWeight: 800, bgcolor: locked ? "#eee" : m.themeColor, color: locked ? "#666" : "#fff" }}
                  />
                </CardContent>
              </CardActionArea>
            </Card>
          );
        })}
      </Box>

      <Button
        size="small"
        startIcon={<RestartAltRoundedIcon />}
        onClick={() => { if (confirm("Reset all progress?")) resetProgress(); }}
        sx={{ color: "#33691e", mt: 1 }}
      >
        Reset Progress
      </Button>
    </Box>
  );
}
