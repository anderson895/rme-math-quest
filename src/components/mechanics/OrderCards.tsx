/* ============================================================
   OrderCards — interactive "Harvest Cart" ordering scenario
   (not a quiz): rice sacks show a fraction AND a visual bar
   model. The player LOADS sacks onto a carabao cart from
   smallest to largest:
   • tap a sack → it drops onto the next cart slot
   • tap a loaded sack → take it back off the cart
   • Check: correct → the carabao hauls the cart away 🎉
            wrong  → the sacks topple off the cart! 💥
   ============================================================ */

import { Box, Button, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import type { OrderScreen, Frac } from "../../types";
import { lcm, shuffle, value } from "../../utils/frac";
import FractionText from "../FractionText";
import MiniBar from "../MiniBar";
import GameIcon from "../GameIcon";
import SackIcon from "../SackIcon";
import { sfxClick, sfxCorrect, sfxWrong } from "../../sound";

/* INSTRUMENTS (required) — one simple flow, no mode switching:
   1. ⚖️ timbangan ON + tap a ❔ sack → weighs it (reveals its fraction)
   2. tap a WEIGHED sack → it loads onto the cart (scale can stay on)
   3. 📏 ruler → verifies the load; only then can the cart be checked */
export default function OrderCards({
  screen,
  activeTools = [],
  onSolved,
}: {
  screen: OrderScreen;
  activeTools?: string[];
  onSolved: (perfect: boolean) => void;
}) {
  const sacks = useMemo(() => shuffle(screen.fracs), [screen]);
  const n = screen.fracs.length;
  const [slots, setSlots] = useState<(Frac | null)[]>(Array(n).fill(null));
  const [misses, setMisses] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [toppling, setToppling] = useState(false);
  const [done, setDone] = useState(false);
  const [weighed, setWeighed] = useState<Frac[]>([]);   // sacks with known weight
  const [rulerUsed, setRulerUsed] = useState(false);    // 📏 load verified

  const scaleOn = activeTools.includes("scale") && !done;
  const rulerOn = activeTools.includes("ruler");
  const den = useMemo(() => screen.fracs.reduce((a, f) => lcm(a, f.d), 1), [screen]);

  /* 📏 turning on the ruler verifies the load (stays verified) */
  useEffect(() => {
    if (rulerOn) setRulerUsed(true);
  }, [rulerOn]);

  const loaded = (f: Frac) => slots.some((s) => s === f);
  const isWeighed = (f: Frac) => weighed.includes(f);
  const full = slots.every((s) => s !== null);
  const allWeighed = weighed.length === n;

  /* one tap does the right thing: weigh an unknown sack, load a known one */
  const load = (f: Frac) => {
    if (done || toppling || loaded(f)) return;
    if (!isWeighed(f)) {
      if (!scaleOn) {
        sfxWrong();
        setFeedback("⚖️ That sack is unmarked — turn on the timbangan, then tap it to weigh!");
        return;
      }
      sfxClick();
      setWeighed((w) => [...w, f]);
      setFeedback(`⚖️ This sack holds ${f.n}/${f.d} of a cavan.`);
      return;
    }
    const i = slots.findIndex((s) => s === null);
    if (i === -1) return;
    sfxClick();
    setSlots((s) => s.map((v, j) => (j === i ? f : v)));
    setFeedback(null);
  };

  const unload = (i: number) => {
    if (done || toppling || !slots[i]) return;
    sfxClick();
    setSlots((s) => s.map((v, j) => (j === i ? null : v)));
  };

  const check = () => {
    if (!full || done || toppling) return;
    const vals = slots.map((s) => value(s!));
    const ok = vals.every((v, i) => i === 0 || vals[i - 1] <= v);

    if (ok) {
      sfxCorrect();
      setDone(true);
      setFeedback("🐃 Perfectly loaded! Off to the festival — no arguments at the table!");
      onSolved(misses === 0);
      return;
    }

    // find the first wrongly-ordered pair for a teaching hint
    sfxWrong();
    setMisses((m) => m + 1);
    setToppling(true);
    const bad = vals.findIndex((v, i) => i > 0 && vals[i - 1] > v);
    const a = slots[bad - 1]!;
    const b = slots[bad]!;
    setFeedback(
      `💥 The cart tipped! Look at the bars: ${a.n}/${a.d} is BIGGER than ${b.n}/${b.d}, ` +
      `so it can't come first. Load them again!`
    );
    setTimeout(() => {
      setSlots(Array(n).fill(null));
      setToppling(false);
    }, 1000);
  };

  return (
    <Box sx={{ textAlign: "center" }}>
      <Typography sx={{ fontWeight: 700, mb: 1.5, color: "#33691e" }}>
        🌾 Load the harvest sacks onto the cart — <u>smallest</u> first, <u>largest</u> last!
      </Typography>

      {/* ONE clear status line — what to do right now */}
      {!done && (
        <Typography sx={{
          display: "inline-block", px: 2, py: 0.6, mb: 1.5,
          bgcolor: "#fff8e1", border: "2px solid #f9a825", borderRadius: 5,
          fontSize: 13.5, fontWeight: 800, color: "#5d4037",
        }}>
          {!allWeighed
            ? `⚖️ Step 1: weigh the sacks — ${weighed.length}/${n} weighed${scaleOn ? " (tap a ❔ sack)" : " (turn on the timbangan)"}`
            : !full
            ? "🌾 Step 2: tap the sacks to load them — smallest first!"
            : !rulerUsed
            ? "📏 Step 3: turn on the ruler to verify the load"
            : "✅ Ready — press Check the Cart!"}
        </Typography>
      )}

      {/* sack tray (each sack shows its bar model — compare visually!) */}
      <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center", flexWrap: "wrap", mb: 2, minHeight: 96 }}>
        {sacks.map((f, i) =>
          loaded(f) ? null : (
            <Box
              key={i}
              onClick={() => load(f)}
              sx={{
                cursor: "pointer",
                px: 1.2, py: 0.8,
                bgcolor: isWeighed(f) ? "#efdcc3" : "#cfd8dc",
                border: "3px solid #8d6e63",
                borderRadius: "14px 14px 8px 8px",
                transition: "transform .15s",
                "&:hover": { transform: "translateY(-6px)" },
              }}
            >
              <SackIcon size={30} />
              {isWeighed(f) ? (
                <>
                  <FractionText frac={f} size={17} />
                  <Box sx={{ mt: 0.4 }}>
                    <MiniBar shaded={f.n} parts={f.d} width={70} height={12} color="#8bc34a" />
                  </Box>
                  {/* 📏 ruler: same-denominator verification readout */}
                  {rulerOn && (
                    <Typography sx={{ fontSize: 11, fontWeight: 800, color: "#00838f" }}>
                      = {(f.n * den) / f.d}/{den}
                    </Typography>
                  )}
                </>
              ) : (
                /* unmarked sack — weight unknown until it hits the timbangan */
                <Typography sx={{ fontSize: 20, fontWeight: 900, color: "#8d6e63" }}>❔</Typography>
              )}
            </Box>
          )
        )}
        {sacks.every(loaded) && !done && (
          <Typography sx={{ alignSelf: "center", fontWeight: 800, color: "#5d4037" }}>
            All sacks loaded — press Check!
          </Typography>
        )}
      </Box>

      {/* the carabao cart */}
      <Box sx={{
        display: "inline-block",
        animation: done ? "cartAway 2.6s ease-in 0.4s forwards" : "none",
      }}>
        <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 0.5 }}>
          <Box sx={{ transform: "scaleX(-1)", filter: "drop-shadow(0 3px 3px #0004)", alignSelf: "flex-end" }}>
            <GameIcon icon="🐃" size={72} />
          </Box>
          {/* cart bed with slots */}
          <Box>
            <Box sx={{ display: "flex", gap: 0.6, px: 1, pt: 0.8, pb: 0.4, bgcolor: "#8d5a3b", border: "3px solid #5d4037", borderRadius: "6px 6px 2px 2px" }}>
              {slots.map((s, i) => (
                <Box
                  key={i}
                  onClick={() => unload(i)}
                  sx={{
                    width: 74, height: 84,
                    border: "3px dashed #ffe082aa",
                    borderRadius: 2,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    cursor: s && !done ? "pointer" : "default",
                    bgcolor: s ? "#efdcc3" : "transparent",
                    animation: s ? (toppling ? "rejectSplash .9s ease-in forwards" : "dropIn .45s cubic-bezier(.3,1.4,.5,1) both") : "none",
                  }}
                >
                  {s ? (
                    <>
                      <SackIcon size={22} />
                      <FractionText frac={s} size={14} />
                      <MiniBar shaded={s.n} parts={s.d} width={56} height={9} color="#8bc34a" />
                    </>
                  ) : (
                    <Typography sx={{ fontWeight: 900, color: "#ffe082", fontSize: 18 }}>{i + 1}</Typography>
                  )}
                </Box>
              ))}
            </Box>
            {/* wheels */}
            <Box sx={{ display: "flex", justifyContent: "space-around", mt: -0.3 }}>
              {[0, 1].map((i) => (
                <Box key={i} sx={{
                  width: 22, height: 22, borderRadius: "50%",
                  bgcolor: "#4e342e", border: "4px solid #37474f",
                }} />
              ))}
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", width: "82%", ml: "14%", mt: -0.5 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 800, color: "#666" }}>smallest</Typography>
          <Typography sx={{ fontSize: 12, fontWeight: 800, color: "#666" }}>largest</Typography>
        </Box>
      </Box>

      {feedback && (
        <Typography sx={{ mt: 1, fontWeight: 700, fontSize: 14, color: done ? "#2e7d32" : "#c62828" }}>
          {feedback}
        </Typography>
      )}

      {!done && (
        <>
          <Box sx={{ display: "flex", gap: 1, justifyContent: "center", mt: 1.5 }}>
            <Button variant="outlined" disabled={toppling || slots.every((s) => !s)}
              onClick={() => { sfxClick(); setSlots(Array(n).fill(null)); }} sx={{ borderRadius: 3, fontWeight: 800 }}>
              Unload All
            </Button>
            <Button variant="contained" disabled={!full || toppling || !rulerUsed} onClick={check}
              sx={{ fontWeight: 900, borderRadius: 3 }}>
              Check the Cart 🐃
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}
