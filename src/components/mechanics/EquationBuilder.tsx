import { Box, Button, TextField, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import type { EquationScreen } from "../../types";
import { equals, lcm } from "../../utils/frac";
import { sfxCorrect, sfxWrong } from "../../sound";

/** Type the answer (numerator/denominator, optional whole for mixed numbers).
    Any mathematically equivalent form is accepted.
    INSTRUMENTS (required):
    • 🔢 LCD machine — the answer slots are JAMMED until the machine is
      fed the correct LCD; solving it prints the equivalent fractions.
    • 📝 scratchpad (combo levels) — the foreman wants the solution in
      writing before any answer is accepted. */
export default function EquationBuilder({
  screen,
  activeTools = [],
  advanced = false,
  onSolved,
}: {
  screen: EquationScreen;
  activeTools?: string[];
  advanced?: boolean;
  onSolved: (perfect: boolean) => void;
}) {
  const [w, setW] = useState("");
  const [n, setN] = useState("");
  const [d, setD] = useState("");
  const [scratch, setScratch] = useState("");
  const [lcdIn, setLcdIn] = useState("");
  const [lcdSolved, setLcdSolved] = useState(false);
  const [lcdMsg, setLcdMsg] = useState<string | null>(null);
  const [misses, setMisses] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  /* 🔢 fractions found in the problem text, for the LCD machine */
  const parts = useMemo(
    () => [...screen.expr.matchAll(/(\d+)\s*\/\s*(\d+)/g)].map((m) => ({ n: Number(m[1]), d: Number(m[2]) })),
    [screen]
  );
  const lcd = parts.length > 1 ? parts.reduce((a, f) => lcm(a, f.d), 1) : 0;
  const needLcd = lcd > 0;
  const needWork = advanced && scratch.trim() === "";
  /* the answer slots stay jammed until every required instrument is used */
  const locked = !done && ((needLcd && !lcdSolved) || needWork);

  const solveLcd = () => {
    const v = Number(lcdIn);
    if (v === lcd) {
      sfxCorrect();
      setLcdSolved(true);
      setLcdMsg(null);
    } else if (v > 0 && parts.every((f) => v % f.d === 0)) {
      sfxWrong();
      setLcdMsg(`${v} is a common denominator, but not the LEAST — find a smaller one!`);
    } else {
      sfxWrong();
      setLcdMsg(`${lcdIn || "That"} doesn't work — it must be a multiple of ${parts.map((f) => f.d).join(" and ")}.`);
    }
  };

  const check = () => {
    const whole = screen.allowWhole ? Number(w || 0) : 0;
    const num = Number(n);
    const den = Number(d);
    if (!Number.isFinite(num) || !Number.isFinite(den) || den <= 0 || num < 0) {
      setFeedback("Type the numerator and a denominator greater than 0.");
      return;
    }
    if (equals({ w: whole, n: num, d: den }, screen.answer)) {
      sfxCorrect();
      setDone(true);
      setFeedback("🎯 Exactly right! (Any equivalent form counts.)");
      onSolved(misses === 0);
    } else {
      sfxWrong();
      setMisses((m) => m + 1);
      setFeedback(`Not yet — check your common denominator. 💡 ${screen.hint}`);
    }
  };

  return (
    <Box sx={{ textAlign: "center" }}>
      {screen.story && (
        <Typography sx={{ fontWeight: 700, mb: 1, color: "#5d4037" }}>📋 {screen.story}</Typography>
      )}
      <Typography sx={{ fontWeight: 800, fontSize: 26, mb: 2, color: "#283593" }}>
        {screen.expr}
      </Typography>

      {/* what the answer slots are waiting for */}
      {locked && (
        <Typography sx={{ mb: 1.5, fontWeight: 800, fontSize: 13.5, color: "#e65100" }}>
          {needLcd && !lcdSolved
            ? "🔒 The answer slots are jammed — feed the 🔢 LCD machine the common denominator first!"
            : "🔒 The foreman wants your solution in writing — work it out on the 📝 scratchpad!"}
        </Typography>
      )}

      {/* 🔢 LCD machine panel */}
      {activeTools.includes("lcd") && needLcd && (
        <Box sx={{ display: "inline-block", px: 2, py: 1, mb: 2, bgcolor: "#fff8e1", border: "2px solid #f9a825", borderRadius: 2 }}>
          {lcdSolved ? (
            <>
              <Typography sx={{ fontSize: 13, fontWeight: 800, color: "#2e7d32" }}>
                🔢 LCD of {parts.map((f) => f.d).join(" and ")} = {lcd} ✔
              </Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#37474f" }}>
                {parts.map((f) => `${f.n}/${f.d} = ${(f.n * lcd) / f.d}/${lcd}`).join("   •   ")}
              </Typography>
            </>
          ) : (
            <>
              <Typography sx={{ fontSize: 13, fontWeight: 800, color: "#5d4037", mb: 0.5 }}>
                🔢 LCD of {parts.map((f) => f.d).join(" and ")} = ?
              </Typography>
              <Box sx={{ display: "flex", gap: 1, justifyContent: "center", alignItems: "center" }}>
                <TextField
                  value={lcdIn}
                  onChange={(e) => setLcdIn(e.target.value.replace(/\D/g, ""))}
                  placeholder="?" size="small"
                  sx={{ width: 80, bgcolor: "#fff", borderRadius: 1 }}
                  slotProps={{ htmlInput: { style: { textAlign: "center", fontWeight: 800 } } }}
                />
                <Button variant="contained" size="small" disabled={!lcdIn} onClick={solveLcd}
                  sx={{ fontWeight: 800, borderRadius: 2 }}>
                  Feed the machine
                </Button>
              </Box>
              {lcdMsg && (
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#c62828", mt: 0.5 }}>{lcdMsg}</Typography>
              )}
            </>
          )}
        </Box>
      )}

      {/* 📝 scratchpad — required work on combo levels */}
      {activeTools.includes("scratchpad") && (
        <Box sx={{ mb: 2 }}>
          <TextField
            value={scratch}
            onChange={(e) => setScratch(e.target.value)}
            multiline minRows={2} fullWidth
            placeholder={advanced
              ? "📝 Required: write your solution here… (e.g. 1/3 = 2/6, 1/2 = 3/6, 2/6 + 3/6 = 5/6)"
              : "📝 Work it out here… (e.g. 1/3 = 2/6, 1/2 = 3/6, 2/6 + 3/6 = 5/6)"}
            sx={{ maxWidth: 440, bgcolor: "#fffde7", borderRadius: 1 }}
          />
        </Box>
      )}

      <Box sx={{ display: "flex", gap: 1, justifyContent: "center", alignItems: "center", mb: 2 }}>
        {screen.allowWhole && (
          <TextField
            value={w} onChange={(e) => setW(e.target.value.replace(/\D/g, ""))}
            disabled={done || locked} placeholder="0" label="whole"
            sx={field} slotProps={{ htmlInput: inputCenter }}
          />
        )}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, alignItems: "center" }}>
          <TextField
            value={n} onChange={(e) => setN(e.target.value.replace(/\D/g, ""))}
            disabled={done || locked} placeholder={locked ? "🔒" : "?"} label="numerator"
            sx={field} slotProps={{ htmlInput: inputCenter }}
          />
          <Box sx={{ width: 90, height: 4, bgcolor: "#3e2723", borderRadius: 2 }} />
          <TextField
            value={d} onChange={(e) => setD(e.target.value.replace(/\D/g, ""))}
            disabled={done || locked} placeholder={locked ? "🔒" : "?"} label="denominator"
            sx={field} slotProps={{ htmlInput: inputCenter }}
          />
        </Box>
      </Box>

      {feedback && (
        <Typography sx={{ mb: 1.5, fontWeight: 700, fontSize: 14, color: done ? "#2e7d32" : "#c62828" }}>
          {feedback}
        </Typography>
      )}

      {!done && (
        <Button variant="contained" onClick={check} disabled={!n || !d || locked}
          sx={{ fontWeight: 800, borderRadius: 3, px: 4 }}>
          Check Answer ✅
        </Button>
      )}
    </Box>
  );
}

const field = { width: 110, bgcolor: "#fff", borderRadius: 1 };
const inputCenter = { style: { textAlign: "center" as const, fontWeight: 800, fontSize: 20 } };
