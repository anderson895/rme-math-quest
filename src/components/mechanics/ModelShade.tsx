import { Box, Button, Chip, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import type { ModelShadeScreen } from "../../types";
import FractionText from "../FractionText";
import { sfxClick, sfxCorrect, sfxWrong } from "../../sound";

/** Click garden beds to shade them until the model shows frac.
    INSTRUMENTS (required):
    • 🖌️ brush — beds can ONLY be shaded while the brush is in hand
      (tapping with bare hands does nothing but a warning).
    • 🧽 eraser — clears all the beds. 📏 ruler — live shaded count. */
export default function ModelShade({
  screen,
  activeTools = [],
  eraseSignal = 0,
  onSolved,
}: {
  screen: ModelShadeScreen;
  activeTools?: string[];
  closePanel?: (id: string) => void;
  eraseSignal?: number;
  onSolved: (perfect: boolean) => void;
}) {
  const parts = screen.frac.d;
  const [shaded, setShaded] = useState<boolean[]>(Array(parts).fill(false));
  const [misses, setMisses] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const ruler = activeTools.includes("ruler");
  const brush = activeTools.includes("brush");

  /* 🧽 eraser pulse: clear all the beds */
  useEffect(() => {
    if (eraseSignal === 0 || done) return;
    sfxClick();
    setShaded(Array(parts).fill(false));
    setFeedback("🧽 Beds cleared! Shade them again.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eraseSignal]);

  const toggle = (i: number) => {
    if (done) return;
    /* the brush is the planting instrument — no brush, no shading */
    if (!brush) {
      sfxWrong();
      setFeedback("🖌️ Grab the brush tool first — you can't plant with bare hands!");
      return;
    }
    sfxClick();
    setShaded((s) => s.map((v, j) => (j === i ? !v : v)));
    setFeedback(null);
  };

  const check = () => {
    const count = shaded.filter(Boolean).length;
    if (count === screen.frac.n) {
      sfxCorrect();
      setDone(true);
      setFeedback("🌱 Perfect planting! The model shows exactly the right fraction.");
      onSolved(misses === 0);
    } else {
      sfxWrong();
      setMisses((m) => m + 1);
      setFeedback(
        count < screen.frac.n
          ? `You shaded ${count} of ${parts} beds — that's too few. Add more!`
          : `You shaded ${count} of ${parts} beds — that's too many. Remove some!`
      );
    }
  };

  const cols = screen.shape === "grid" ? Math.ceil(parts / 2) : parts;

  return (
    <Box sx={{ textAlign: "center" }}>
      <Typography sx={{ fontWeight: 700, mb: 2, color: "#33691e", display: "flex", justifyContent: "center", alignItems: "center" }}>
        🌱 Tap the beds to shade <FractionText frac={screen.frac} size={18} /> of the plot.
      </Typography>

      {/* 📏 ruler: live measurement of the shading */}
      {ruler && (
        <Chip
          label={`📏 shaded ${shaded.filter(Boolean).length} of ${parts} beds`}
          sx={{ mb: 1.5, bgcolor: "#e0f7fa", border: "2px solid #00838f", fontWeight: 800, color: "#006064" }}
        />
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 0.6,
          width: "min(480px, 84vw)",
          mx: "auto",
          p: 1,
          border: "4px solid #5d4037",
          borderRadius: 2,
          bgcolor: "#efebe9",
        }}
      >
        {shaded.map((on, i) => (
          <Box
            key={i}
            onClick={() => toggle(i)}
            sx={{
              height: 56,
              borderRadius: 1,
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24,
              bgcolor: on ? "#7cb342" : "#fffde7",
              border: "2px solid #5d403766",
              transition: "background .15s, transform .1s",
              "&:hover": { transform: "scale(1.04)" },
            }}
          >
            {on ? "🌱" : ""}
          </Box>
        ))}
      </Box>

      {feedback && (
        <Typography sx={{ mt: 1.5, fontWeight: 700, color: done ? "#2e7d32" : "#c62828" }}>
          {feedback}
        </Typography>
      )}

      {!done && (
        <Button variant="contained" onClick={check} sx={{ mt: 2, fontWeight: 800, borderRadius: 3 }}>
          Check My Garden 🌾
        </Button>
      )}
    </Box>
  );
}
