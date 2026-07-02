import { Box, Button, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import type { BalanceScreen, Frac } from "../../types";
import { equals, shuffle, value } from "../../utils/frac";
import FractionText from "../FractionText";
import { sfxCorrect, sfxWrong } from "../../sound";

/** Pick the sack whose fraction balances the target weight. */
export default function BalanceScale({
  screen,
  onSolved,
}: {
  screen: BalanceScreen;
  onSolved: (perfect: boolean) => void;
}) {
  const choices = useMemo(() => shuffle(screen.choices), [screen]);
  const [placed, setPlaced] = useState<Frac | null>(null);
  const [misses, setMisses] = useState(0);
  const [done, setDone] = useState(false);

  // beam tilt: negative = left heavier, positive = right heavier
  const tilt = placed
    ? Math.max(-12, Math.min(12, (value(placed) - value(screen.target)) * 40))
    : 0;

  const pick = (f: Frac) => {
    if (done) return;
    setPlaced(f);
    if (equals(f, screen.target)) {
      sfxCorrect();
      setDone(true);
      onSolved(misses === 0);
    } else {
      sfxWrong();
      setMisses((m) => m + 1);
      setTimeout(() => setPlaced(null), 1100);
    }
  };

  return (
    <Box sx={{ textAlign: "center" }}>
      <Typography sx={{ fontWeight: 700, mb: 2, color: "#5d4037" }}>
        ⚖️ Tap the sack that balances the scale exactly.
      </Typography>

      {/* the scale */}
      <Box sx={{ position: "relative", width: 340, height: 150, mx: "auto", mb: 2 }}>
        {/* beam */}
        <Box sx={{
          position: "absolute", top: 30, left: 20, right: 20, height: 10,
          bgcolor: "#8d6e63", border: "2px solid #4e342e", borderRadius: 5,
          transform: `rotate(${tilt}deg)`, transformOrigin: "center", transition: "transform .5s",
        }} />
        {/* stand */}
        <Box sx={{ position: "absolute", top: 36, left: "50%", transform: "translateX(-50%)", width: 12, height: 90, bgcolor: "#6d4c41", borderRadius: 1 }} />
        <Box sx={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: 120, height: 12, bgcolor: "#6d4c41", borderRadius: 2 }} />
        {/* left pan: target */}
        <Box sx={{ position: "absolute", left: 4, top: 48 + tilt * 1.6, transition: "top .5s", textAlign: "center" }}>
          <Box sx={pan}>
            <FractionText frac={screen.target} size={18} />
          </Box>
          <Typography sx={{ fontSize: 11, fontWeight: 700 }}>customer's order</Typography>
        </Box>
        {/* right pan: placed choice */}
        <Box sx={{ position: "absolute", right: 4, top: 48 - tilt * 1.6, transition: "top .5s", textAlign: "center" }}>
          <Box sx={pan}>
            {placed ? <FractionText frac={placed} size={18} /> : <Typography sx={{ fontSize: 20 }}>?</Typography>}
          </Box>
          <Typography sx={{ fontSize: 11, fontWeight: 700 }}>your sack</Typography>
        </Box>
      </Box>

      {done ? (
        <Typography sx={{ fontWeight: 800, color: "#2e7d32" }}>
          ⚖️ Perfectly balanced — an Honest Weight stamp for the ledger!
        </Typography>
      ) : (
        <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center", flexWrap: "wrap" }}>
          {choices.map((f, i) => (
            <Button key={i} variant="outlined" onClick={() => pick(f)}
              sx={{
                minWidth: 88, py: 1.2, borderRadius: 3, borderWidth: 3, borderColor: "#5d4037",
                bgcolor: "#fff8e1", color: "#3e2723", flexDirection: "column",
                "&:hover": { borderWidth: 3, bgcolor: "#ffe082" },
              }}>
              <Typography sx={{ fontSize: 20 }}>🧂</Typography>
              <FractionText frac={f} size={18} />
            </Button>
          ))}
        </Box>
      )}
    </Box>
  );
}

const pan = {
  width: 84, height: 46,
  bgcolor: "#d7ccc8", border: "3px solid #4e342e",
  borderRadius: "0 0 40px 40px",
  display: "flex", alignItems: "center", justifyContent: "center",
};
