import { Box, Button, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import type { BalanceScreen, Frac } from "../../types";
import { equals, shuffle, value } from "../../utils/frac";
import FractionText from "../FractionText";
import MiniBar from "../MiniBar";
import SackIcon from "../SackIcon";
import { sfxClick, sfxCorrect, sfxWrong } from "../../sound";

/** Pick the sack whose fraction balances the target weight.
    INSTRUMENTS (required):
    • 📏 ruler — the sacks are unmeasured: measure a sack (ruler on +
      tap) to reveal its weight before it can go on the scale.
    • 🔍 magnifier (combo levels) — the customer's order slip is a
      mystery until it's read with the magnifier. */
export default function BalanceScale({
  screen,
  activeTools = [],
  advanced = false,
  onSolved,
}: {
  screen: BalanceScreen;
  activeTools?: string[];
  advanced?: boolean;
  onSolved: (perfect: boolean) => void;
}) {
  const ruler = activeTools.includes("ruler");
  const magnifier = activeTools.includes("magnifier");
  const choices = useMemo(() => shuffle(screen.choices), [screen]);
  const [placed, setPlaced] = useState<Frac | null>(null);
  const [measured, setMeasured] = useState<Frac[]>([]);
  const [orderRead, setOrderRead] = useState(!advanced); // 🔍 the order slip
  const [misses, setMisses] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  /* 🔍 reading the mystery order (stays read) */
  useEffect(() => {
    if (magnifier && !orderRead) {
      setOrderRead(true);
      setMsg(`🔍 The order says: ${screen.target.n}/${screen.target.d} kilo. Now find the sack that balances it!`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [magnifier]);

  // beam tilt: negative = left heavier, positive = right heavier
  const tilt = placed
    ? Math.max(-12, Math.min(12, (value(placed) - value(screen.target)) * 40))
    : 0;

  const pick = (f: Frac) => {
    if (done) return;
    /* unmeasured sack: the ruler is the only way to know its weight */
    if (!measured.includes(f)) {
      if (ruler) {
        sfxClick();
        setMeasured((m) => [...m, f]);
        setMsg(`📏 Measured: this sack holds ${f.n}/${f.d} kilo.`);
      } else {
        sfxWrong();
        setMsg("📏 That sack is unmeasured — measure it with the ruler first!");
      }
      return;
    }
    if (!orderRead) {
      sfxWrong();
      setMsg("🔍 Nobody knows the order yet — read the slip with the magnifier first!");
      return;
    }
    setMsg(null);
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

      {/* 📏 ruler: the customer's order as a bar model (once it's known) */}
      {ruler && orderRead && (
        <Box sx={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 0.4, px: 2, py: 0.8, mb: 1, bgcolor: "#e0f7fa", border: "2px solid #00838f", borderRadius: 2 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 800, color: "#006064" }}>
            📏 customer's order:
          </Typography>
          <MiniBar shaded={screen.target.n} parts={screen.target.d} width={180} height={16} color="#4dd0e1" />
        </Box>
      )}

      {msg && (
        <Typography sx={{ mb: 1, fontWeight: 800, fontSize: 13.5, color: "#00695c" }}>{msg}</Typography>
      )}

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
        {/* left pan: target (a mystery slip until magnified on combo levels) */}
        <Box sx={{ position: "absolute", left: 4, top: 48 + tilt * 1.6, transition: "top .5s", textAlign: "center" }}>
          <Box sx={pan}>
            {orderRead
              ? <FractionText frac={screen.target} size={18} />
              : <Typography sx={{ fontSize: 20, fontWeight: 900 }}>❔</Typography>}
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
              <SackIcon size={26} />
              {measured.includes(f) ? (
                <>
                  <FractionText frac={f} size={18} />
                  {/* measuring also reveals the sack as a bar model */}
                  <Box sx={{ mt: 0.5 }}>
                    <MiniBar shaded={f.n} parts={f.d} width={80} height={12} color="#4dd0e1" />
                  </Box>
                </>
              ) : (
                /* unmeasured sack — weight unknown until the ruler visits */
                <Typography sx={{ fontSize: 18, fontWeight: 900, color: "#8d6e63" }}>❔</Typography>
              )}
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
