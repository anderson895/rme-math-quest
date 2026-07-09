import { Box, Chip, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import type { NumberLineScreen } from "../../types";
import { shuffle } from "../../utils/frac";
import MiniBar from "../MiniBar";
import { sfxClick, sfxCorrect, sfxWrong } from "../../sound";

/** Click a fraction card, then click the tick where it belongs on the road.
    INSTRUMENTS (required):
    • 📏 ruler — the road starts UNMEASURED: no tick marks exist until the
      ruler divides it into den equal hops. No ruler, no places to build.
    • 🔍 magnifier (combo levels) — the road signs arrive COVERED; each must
      be inspected with the magnifier before it can be picked up. */
export default function NumberLinePlot({
  screen,
  activeTools = [],
  advanced = false,
  onSolved,
}: {
  screen: NumberLineScreen;
  activeTools?: string[];
  advanced?: boolean;
  onSolved: (perfect: boolean) => void;
}) {
  const pool = useMemo(() => shuffle(screen.targets), [screen]);
  const [placed, setPlaced] = useState<Record<number, number>>({}); // tick -> numerator
  const [selected, setSelected] = useState<number | null>(null);
  const [misses, setMisses] = useState(0);
  const [shakeTick, setShakeTick] = useState<number | null>(null);
  const [measured, setMeasured] = useState(false);       // 📏 has divided the road
  const [inspected, setInspected] = useState<number[]>([]); // 🔍 revealed signs
  const [msg, setMsg] = useState<string | null>(null);

  const magnifier = activeTools.includes("magnifier");
  const remaining = pool.filter((n) => !Object.values(placed).includes(n));

  /* 📏 the ruler measures the road — tick marks appear (permanently) */
  useEffect(() => {
    if (!measured && activeTools.includes("ruler")) {
      setMeasured(true);
      setMsg(`📏 Sakto! The road is now divided into ${screen.den} equal hops.`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTools]);

  const clickSign = (n: number) => {
    if (advanced && !inspected.includes(n)) {
      if (magnifier) {
        sfxClick();
        setInspected((v) => [...v, n]);
        setMsg(`🔍 Inspected: this sign says ${n}/${screen.den}.`);
      } else {
        sfxWrong();
        setMsg("🔍 The sign is covered in dust — inspect it with the magnifier first!");
      }
      return;
    }
    sfxClick();
    setSelected(n);
    setMsg(null);
  };

  const clickTick = (tick: number) => {
    if (selected === null || placed[tick] !== undefined) return;
    if (tick === selected) {
      sfxCorrect();
      const next = { ...placed, [tick]: selected };
      setPlaced(next);
      setSelected(null);
      if (Object.keys(next).length === screen.targets.length) onSolved(misses === 0);
    } else {
      sfxWrong();
      setMisses((m) => m + 1);
      setShakeTick(tick);
      setTimeout(() => setShakeTick(null), 500);
    }
  };

  return (
    <Box sx={{ textAlign: "center" }}>
      <Typography sx={{ fontWeight: 700, mb: 4, color: "#33691e" }}>
        🛤️ {measured
          ? "Tap a road sign, then tap its spot on the farm road."
          : `The road has no markers yet — use the 📏 ruler to divide it into ${screen.den} equal hops!`}
      </Typography>

      {/* the road / number line */}
      <Box sx={{ position: "relative", height: 10, mx: 4, mb: 6, bgcolor: "#8d6e63", border: "2px solid #4e342e", borderRadius: 5 }}>
        {/* end labels */}
        {[0, 1].map((v) => (
          <Box key={v} sx={{ position: "absolute", left: `${v * 100}%`, top: -10, transform: "translateX(-50%)", textAlign: "center" }}>
            <Box sx={{ width: 6, height: 26, bgcolor: "#4e342e", mx: "auto", borderRadius: 1 }} />
            <Typography sx={{ fontWeight: 800 }}>{v}</Typography>
          </Box>
        ))}
        {/* interior ticks — they only EXIST once the ruler has measured */}
        {measured && Array.from({ length: screen.den - 1 }, (_, i) => i + 1).map((tick) => {
          const isTarget = screen.targets.includes(tick);
          const done = placed[tick] !== undefined;
          return (
            <Box
              key={tick}
              onClick={() => isTarget && clickTick(tick)}
              sx={{
                position: "absolute",
                left: `${(tick / screen.den) * 100}%`,
                top: -14,
                transform: "translateX(-50%)",
                textAlign: "center",
                cursor: isTarget && !done ? "pointer" : "default",
                animation: shakeTick === tick ? "shake 0.4s" : "none",
              }}
            >
              {done ? (
                <Chip label={`${placed[tick]}/${screen.den}`} size="small"
                  sx={{ bgcolor: "#43a047", color: "#fff", fontWeight: 800, mb: 0.3 }} />
              ) : isTarget ? (
                <Box sx={{
                  width: 26, height: 26, borderRadius: "50%", mx: "auto",
                  bgcolor: selected !== null ? "#fff59d" : "#fff",
                  border: "3px dashed #4e342e",
                  "&:hover": { transform: "scale(1.2)" }, transition: "transform .15s",
                }} />
              ) : (
                <Box sx={{ width: 4, height: 20, bgcolor: "#4e342e", mx: "auto", borderRadius: 1, mt: 0.5 }} />
              )}
            </Box>
          );
        })}
      </Box>

      {/* status / instrument messages */}
      {msg && (
        <Typography sx={{ mb: 1.5, fontWeight: 800, fontSize: 13.5, color: "#00695c" }}>{msg}</Typography>
      )}

      {/* 🔍 magnifier view of the selected sign */}
      {magnifier && selected !== null && (
        <Box sx={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 0.5, px: 2, py: 1, mb: 2, bgcolor: "#fff8e1", border: "2px solid #f9a825", borderRadius: 2 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 800, color: "#5d4037" }}>
            🔍 {selected}/{screen.den} of the road:
          </Typography>
          <MiniBar shaded={selected} parts={screen.den} width={220} height={20} color="#8bc34a" />
        </Box>
      )}

      {/* fraction sign tray */}
      <Typography sx={{ fontSize: 13, color: "#666", mb: 1 }}>Road signs to place:</Typography>
      <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center", flexWrap: "wrap" }}>
        {remaining.map((n) => {
          const covered = advanced && !inspected.includes(n);
          return (
            <Chip
              key={n}
              label={covered ? "❔" : `${n}/${screen.den}`}
              onClick={() => clickSign(n)}
              sx={{
                fontSize: 18, fontWeight: 800, py: 2.5, px: 1,
                bgcolor: covered ? "#cfd8dc" : selected === n ? "#f9a825" : "#fff8e1",
                border: "3px solid #5d4037",
                "&:hover": { bgcolor: covered ? "#b0bec5" : "#ffe082" },
              }}
            />
          );
        })}
        {remaining.length === 0 && <Typography sx={{ fontWeight: 800, color: "#2e7d32" }}>🛺 All markers placed — the carts can pass!</Typography>}
      </Box>
    </Box>
  );
}
