import { Box, Button, Typography } from "@mui/material";
import { useState } from "react";
import type { SimplifyScreen, Frac } from "../../types";
import { gcd, isSimplest } from "../../utils/frac";
import FractionText from "../FractionText";
import { sfxCorrect, sfxWrong, sfxClick } from "../../sound";

const FACTORS = [2, 3, 5, 7];

/** Click common factors to divide the label down to simplest form. */
export default function SimplifyStation({
  screen,
  onSolved,
}: {
  screen: SimplifyScreen;
  onSolved: (perfect: boolean) => void;
}) {
  const [frac, setFrac] = useState<Frac>(screen.frac);
  const [misses, setMisses] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const divide = (f: number) => {
    if (done) return;
    if (frac.n % f === 0 && frac.d % f === 0) {
      sfxClick();
      const next = { n: frac.n / f, d: frac.d / f };
      setFrac(next);
      setFeedback(`Divided both by ${f}: now ${next.n}/${next.d}.`);
      if (isSimplest(next)) {
        sfxCorrect();
        setDone(true);
        setFeedback(`🏷️ Simplest form reached: ${next.n}/${next.d}! Customers will love this label.`);
        onSolved(misses === 0);
      }
    } else {
      sfxWrong();
      setMisses((m) => m + 1);
      setFeedback(`${f} is not a common factor of ${frac.n} and ${frac.d}. Try another!`);
    }
  };

  return (
    <Box sx={{ textAlign: "center" }}>
      <Typography sx={{ fontWeight: 700, mb: 2, color: "#5d4037" }}>
        🏷️ Divide the numerator and denominator by common factors until the tag is in simplest form.
      </Typography>

      {/* the sack label */}
      <Box sx={{
        display: "inline-flex", flexDirection: "column", alignItems: "center",
        px: 4, py: 2, mb: 2, bgcolor: "#efebe9", border: "4px solid #6d4c41", borderRadius: 3,
      }}>
        <Typography sx={{ fontSize: 30 }}>🧺</Typography>
        <FractionText frac={frac} size={34} />
        {!done && gcd(frac.n, frac.d) > 1 && (
          <Typography sx={{ fontSize: 12, color: "#666" }}>still reducible…</Typography>
        )}
      </Box>

      {feedback && (
        <Typography sx={{ mb: 1.5, fontWeight: 700, color: done ? "#2e7d32" : "#5d4037", fontSize: 14 }}>
          {feedback}
        </Typography>
      )}

      {!done && (
        <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center" }}>
          {FACTORS.map((f) => (
            <Button key={f} variant="contained" onClick={() => divide(f)}
              sx={{ fontWeight: 800, fontSize: 20, borderRadius: 3, minWidth: 64, bgcolor: "#6d4c41", "&:hover": { bgcolor: "#5d4037" } }}>
              ÷{f}
            </Button>
          ))}
        </Box>
      )}
    </Box>
  );
}
