import { Box, Button, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import type { OrderScreen } from "../../types";
import type { Frac } from "../../types";
import { shuffle, value, fmt } from "../../utils/frac";
import FractionText from "../FractionText";
import { sfxClick, sfxCorrect, sfxWrong } from "../../sound";

/** Tap land-title cards in order, smallest to largest. */
export default function OrderCards({
  screen,
  onSolved,
}: {
  screen: OrderScreen;
  onSolved: (perfect: boolean) => void;
}) {
  const cards = useMemo(() => shuffle(screen.fracs), [screen]);
  const [sequence, setSequence] = useState<Frac[]>([]);
  const [misses, setMisses] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const inSeq = (f: Frac) => sequence.some((s) => s === f);

  const add = (f: Frac) => {
    if (done || inSeq(f)) return;
    sfxClick();
    setSequence((s) => [...s, f]);
    setFeedback(null);
  };

  const check = () => {
    const sorted = [...screen.fracs].sort((a, b) => value(a) - value(b));
    const ok = sequence.length === sorted.length && sequence.every((f, i) => value(f) === value(sorted[i]));
    if (ok) {
      sfxCorrect();
      setDone(true);
      setFeedback("📜 Perfectly ordered! No arguments at the festival table.");
      onSolved(misses === 0);
    } else {
      sfxWrong();
      setMisses((m) => m + 1);
      setSequence([]);
      setFeedback("Not quite — compare each pair carefully. Tip: same numerator? The bigger denominator is the smaller piece!");
    }
  };

  return (
    <Box sx={{ textAlign: "center" }}>
      <Typography sx={{ fontWeight: 700, mb: 2, color: "#33691e" }}>
        📜 Tap the land titles from <u>smallest</u> to <u>largest</u>.
      </Typography>

      {/* card tray */}
      <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center", flexWrap: "wrap", mb: 2 }}>
        {cards.map((f, i) => (
          <Button
            key={i}
            variant="outlined"
            disabled={inSeq(f)}
            onClick={() => add(f)}
            sx={{
              minWidth: 90, py: 1.5, borderRadius: 3, borderWidth: 3, borderColor: "#5d4037",
              bgcolor: "#fff8e1", color: "#3e2723",
              "&:hover": { borderWidth: 3, bgcolor: "#ffe082" },
            }}
          >
            <FractionText frac={f} size={22} />
          </Button>
        ))}
      </Box>

      {/* answer slots */}
      <Box sx={{ display: "flex", gap: 1, justifyContent: "center", alignItems: "center", mb: 2 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 13, color: "#666" }}>smallest</Typography>
        {screen.fracs.map((_, i) => (
          <Box key={i} sx={{
            width: 76, height: 60, border: "3px dashed #5d4037", borderRadius: 2,
            display: "flex", alignItems: "center", justifyContent: "center",
            bgcolor: sequence[i] ? "#c8e6c9" : "#fafafa", fontWeight: 800,
          }}>
            {sequence[i] ? fmt(sequence[i]) : i + 1}
          </Box>
        ))}
        <Typography sx={{ fontWeight: 700, fontSize: 13, color: "#666" }}>largest</Typography>
      </Box>

      {feedback && (
        <Typography sx={{ mb: 1.5, fontWeight: 700, color: done ? "#2e7d32" : "#c62828", fontSize: 14 }}>
          {feedback}
        </Typography>
      )}

      {!done && (
        <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
          <Button variant="outlined" onClick={() => { sfxClick(); setSequence([]); }} sx={{ borderRadius: 3 }}>
            Clear
          </Button>
          <Button variant="contained" disabled={sequence.length !== screen.fracs.length} onClick={check}
            sx={{ fontWeight: 800, borderRadius: 3 }}>
            Check Order 📋
          </Button>
        </Box>
      )}
    </Box>
  );
}
