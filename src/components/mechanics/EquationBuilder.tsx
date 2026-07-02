import { Box, Button, TextField, Typography } from "@mui/material";
import { useState } from "react";
import type { EquationScreen } from "../../types";
import { equals } from "../../utils/frac";
import { sfxCorrect, sfxWrong } from "../../sound";

/** Type the answer (numerator/denominator, optional whole for mixed numbers).
    Any mathematically equivalent form is accepted. */
export default function EquationBuilder({
  screen,
  onSolved,
}: {
  screen: EquationScreen;
  onSolved: (perfect: boolean) => void;
}) {
  const [w, setW] = useState("");
  const [n, setN] = useState("");
  const [d, setD] = useState("");
  const [misses, setMisses] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [done, setDone] = useState(false);

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

      <Box sx={{ display: "flex", gap: 1, justifyContent: "center", alignItems: "center", mb: 2 }}>
        {screen.allowWhole && (
          <TextField
            value={w} onChange={(e) => setW(e.target.value.replace(/\D/g, ""))}
            disabled={done} placeholder="0" label="whole"
            sx={field} slotProps={{ htmlInput: inputCenter }}
          />
        )}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, alignItems: "center" }}>
          <TextField
            value={n} onChange={(e) => setN(e.target.value.replace(/\D/g, ""))}
            disabled={done} placeholder="?" label="numerator"
            sx={field} slotProps={{ htmlInput: inputCenter }}
          />
          <Box sx={{ width: 90, height: 4, bgcolor: "#3e2723", borderRadius: 2 }} />
          <TextField
            value={d} onChange={(e) => setD(e.target.value.replace(/\D/g, ""))}
            disabled={done} placeholder="?" label="denominator"
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
        <Button variant="contained" onClick={check} disabled={!n || !d}
          sx={{ fontWeight: 800, borderRadius: 3, px: 4 }}>
          Check Answer ✅
        </Button>
      )}
    </Box>
  );
}

const field = { width: 110, bgcolor: "#fff", borderRadius: 1 };
const inputCenter = { style: { textAlign: "center" as const, fontWeight: 800, fontSize: 20 } };
