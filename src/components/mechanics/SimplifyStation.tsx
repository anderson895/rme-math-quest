import { Box, Button, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import type { SimplifyScreen, Frac } from "../../types";
import { gcd, isSimplest } from "../../utils/frac";
import FractionText from "../FractionText";
import { sfxCorrect, sfxWrong, sfxClick } from "../../sound";

const FACTORS = [2, 3, 5, 7];

/** Click common factors to divide the label down to simplest form.
    INSTRUMENTS (required):
    • 🔍 factor finder — the ÷ machine only runs while the finder is on
      (it also makes the valid common factors glow).
    • 🧽 sponge (combo levels) — the old label is too dirty to read;
      wipe it clean before any simplifying can start. */
export default function SimplifyStation({
  screen,
  activeTools = [],
  advanced = false,
  eraseSignal = 0,
  onSolved,
}: {
  screen: SimplifyScreen;
  activeTools?: string[];
  advanced?: boolean;
  eraseSignal?: number;
  onSolved: (perfect: boolean) => void;
}) {
  const [frac, setFrac] = useState<Frac>(screen.frac);
  const [clean, setClean] = useState(!advanced); // 🧽 label readable?
  const [misses, setMisses] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const finder = activeTools.includes("factor");
  const common = FACTORS.filter((f) => frac.n % f === 0 && frac.d % f === 0);

  /* 🧽 sponge pulse: wipe the dirty label clean */
  useEffect(() => {
    if (eraseSignal === 0 || clean) return;
    sfxClick();
    setClean(true);
    setFeedback(`🧽 Label wiped clean — it reads ${frac.n}/${frac.d}. Now simplify it!`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eraseSignal]);

  const divide = (f: number) => {
    if (done || !clean || !finder) return;
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

      {/* the sack label (dirty until sponged on combo levels) */}
      <Box sx={{
        display: "inline-flex", flexDirection: "column", alignItems: "center",
        px: 4, py: 2, mb: 2, border: "4px solid #6d4c41", borderRadius: 3,
        bgcolor: clean ? "#efebe9" : "#a1887f",
      }}>
        <Typography sx={{ fontSize: 30 }}>🧺</Typography>
        {clean ? (
          <FractionText frac={frac} size={34} />
        ) : (
          <Typography sx={{ fontSize: 34, fontWeight: 900, color: "#4e342e", letterSpacing: 2 }}>▒/▒</Typography>
        )}
        {!done && clean && gcd(frac.n, frac.d) > 1 && (
          <Typography sx={{ fontSize: 12, color: "#666" }}>still reducible…</Typography>
        )}
        {!clean && (
          <Typography sx={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>
            🧽 too dirty to read — wipe it with the sponge!
          </Typography>
        )}
      </Box>

      {/* 🔍 factor finder readout — the machine's power light */}
      {!done && clean && (finder ? (
        <Typography sx={{ mb: 1.5, fontWeight: 800, fontSize: 13, color: "#00695c" }}>
          🔍 {frac.n} and {frac.d}{" "}
          {common.length > 0
            ? `share the factor${common.length > 1 ? "s" : ""} ${common.join(", ")} — the glowing buttons work!`
            : "share no common factor — the tag is in simplest form!"}
        </Typography>
      ) : (
        <Typography sx={{ mb: 1.5, fontWeight: 800, fontSize: 13, color: "#e65100" }}>
          🔍 The ÷ machine is OFF — switch on the factor finder to power it!
        </Typography>
      ))}

      {feedback && (
        <Typography sx={{ mb: 1.5, fontWeight: 700, color: done ? "#2e7d32" : "#5d4037", fontSize: 14 }}>
          {feedback}
        </Typography>
      )}

      {!done && (
        <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center" }}>
          {FACTORS.map((f) => (
            <Button key={f} variant="contained" onClick={() => divide(f)}
              disabled={!finder || !clean}
              sx={{
                fontWeight: 800, fontSize: 20, borderRadius: 3, minWidth: 64,
                bgcolor: "#6d4c41", "&:hover": { bgcolor: "#5d4037" },
                // 🔍 the finder makes valid common factors glow
                ...(finder && clean && common.includes(f) && {
                  boxShadow: "0 0 0 4px #ffeb3b",
                  bgcolor: "#00695c",
                  "&:hover": { bgcolor: "#004d40" },
                }),
              }}>
              ÷{f}
            </Button>
          ))}
        </Box>
      )}
    </Box>
  );
}
