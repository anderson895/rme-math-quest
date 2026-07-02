import { Box, Button, Typography, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { useState } from "react";
import type { DialogueScreen } from "../../types";
import MiniBar from "../MiniBar";
import { useGame } from "../../state/GameContext";
import { sfxClick } from "../../sound";

const AVATARS = ["🧒🏽", "👧🏽", "👦🏽", "🧑🏽‍🦱"];

/** Title / briefing / feedback / reward slides — narrative screens. */
export default function DialogueScene({
  screen,
  onDone,
}: {
  screen: DialogueScreen;
  onDone: () => void;
}) {
  const { progress, setAvatar } = useGame();
  const [picked, setPicked] = useState(progress.avatar);

  return (
    <Box sx={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
      {screen.art && (
        <Typography sx={{ fontSize: "clamp(44px, 8vw, 76px)", lineHeight: 1 }}>{screen.art}</Typography>
      )}

      {screen.demo === "numberline" && <NumberLineDemo />}
      {screen.demo === "equivalent" && <EquivalentDemo />}
      {screen.demo === "lcd" && <LcdDemo />}

      {screen.avatarSelect && (
        <Box>
          <Typography sx={{ fontWeight: 700, mb: 1 }}>Choose your avatar:</Typography>
          <ToggleButtonGroup
            exclusive
            value={picked}
            onChange={(_, v) => {
              if (v) {
                sfxClick();
                setPicked(v);
                setAvatar(v);
              }
            }}
          >
            {AVATARS.map((a) => (
              <ToggleButton key={a} value={a} sx={{ fontSize: 34, px: 2 }}>
                {a}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
      )}

      <Button
        variant="contained"
        size="large"
        onClick={() => { sfxClick(); onDone(); }}
        sx={{ fontWeight: 800, borderRadius: 3, px: 5, py: 1.2, fontSize: 18 }}
      >
        {screen.buttonLabel}
      </Button>
    </Box>
  );
}

/* ---------- mini teaching diagrams for briefing slides ---------- */

function NumberLineDemo() {
  return (
    <Box sx={{ width: "min(420px, 80vw)" }}>
      <Typography sx={{ fontSize: 14, mb: 3, color: "#555" }}>
        A road is a number line — each marker tells how far along you are:
      </Typography>
      <Box sx={{ position: "relative", height: 6, bgcolor: "#5d4037", borderRadius: 3, mb: 3 }}>
        {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
          <Box key={i} sx={{ position: "absolute", left: `${v * 100}%`, top: -8, transform: "translateX(-50%)", textAlign: "center" }}>
            <Box sx={{ width: 4, height: 22, bgcolor: "#5d4037", mx: "auto", borderRadius: 1 }} />
            <Typography sx={{ fontWeight: 700, fontSize: 13 }}>
              {["0", "1/4", "2/4", "3/4", "1"][i]}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function EquivalentDemo() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "center" }}>
      <Typography sx={{ fontSize: 14, color: "#555" }}>Same amount, different cuts:</Typography>
      <MiniBar shaded={2} parts={4} width={240} />
      <Typography sx={{ fontWeight: 800 }}>2/4 = 4/8</Typography>
      <MiniBar shaded={4} parts={8} width={240} />
    </Box>
  );
}

function LcdDemo() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "center" }}>
      <Typography sx={{ fontSize: 14, color: "#555" }}>
        To add 1/2 + 1/3, rename both using the LCD (6):
      </Typography>
      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        <MiniBar shaded={3} parts={6} width={150} color="#4fc3f7" />
        <Typography sx={{ fontWeight: 800 }}>+</Typography>
        <MiniBar shaded={2} parts={6} width={150} color="#ffb74d" />
        <Typography sx={{ fontWeight: 800 }}>=</Typography>
        <MiniBar shaded={5} parts={6} width={150} />
      </Box>
      <Typography sx={{ fontWeight: 800 }}>3/6 + 2/6 = 5/6</Typography>
    </Box>
  );
}
