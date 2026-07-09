import { Box, Button, Typography } from "@mui/material";
import { useState } from "react";
import type { MCQChoice, MCQScreen } from "../../types";
import FractionText from "../FractionText";
import MiniBar from "../MiniBar";
import { sfxClick, sfxCorrect, sfxWrong } from "../../sound";

export function ChoiceContent({
  choice,
  size = 20,
  magnify = false,   // 🔍 render frac-only choices as a bar model too
}: {
  choice: MCQChoice;
  size?: number;
  magnify?: boolean;
}) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
      {choice.bar && <MiniBar shaded={choice.bar.shaded} parts={choice.bar.parts} width={150} height={28} />}
      {choice.frac && <FractionText frac={choice.frac} size={size} />}
      {magnify && choice.frac && !choice.bar && (
        <MiniBar shaded={choice.frac.n} parts={choice.frac.d} width={100} height={14} color="#8bc34a" />
      )}
      {choice.label && <Typography sx={{ fontWeight: 700 }}>{choice.label}</Typography>}
    </Box>
  );
}

/** Multiple-choice question — the answer cards arrive FACE-DOWN.
    INSTRUMENT (required): 🔍 magnifier — inspect (flip) every card
    before any answer can be given. Inspected cards show their bars. */
export default function MCQ({
  screen,
  activeTools = [],
  onSolved,
}: {
  screen: MCQScreen;
  activeTools?: string[];
  onSolved: (perfect: boolean) => void;
}) {
  const magnify = activeTools.includes("magnifier");
  const [revealed, setRevealed] = useState<boolean[]>(() => screen.choices.map(() => false));
  const [wrongIdx, setWrongIdx] = useState<number | null>(null);
  const [misses, setMisses] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const allRevealed = revealed.every(Boolean);

  const pick = (i: number) => {
    if (done) return;
    /* face-down card: the magnifier is the only way to flip it */
    if (!revealed[i]) {
      if (!magnify) {
        sfxWrong();
        setFeedback("🔍 The cards are face-down — inspect them with the magnifier first!");
        return;
      }
      sfxClick();
      const next = revealed.map((v, j) => (j === i ? true : v));
      setRevealed(next);
      setFeedback(next.every(Boolean) ? "All cards inspected — now tap your answer!" : null);
      return;
    }
    /* answering needs the FULL inspection — a careful checker sees all */
    if (!allRevealed) {
      sfxWrong();
      setFeedback("🔍 Inspect ALL the cards before answering — check every option!");
      return;
    }
    if (i === screen.answer) {
      sfxCorrect();
      setDone(true);
      onSolved(misses === 0);
    } else {
      sfxWrong();
      setMisses((m) => m + 1);
      setWrongIdx(i);
      setTimeout(() => setWrongIdx(null), 600);
    }
  };

  return (
    <Box sx={{ textAlign: "center" }}>
      <Typography sx={{ fontWeight: 700, mb: 1.5, fontSize: 18 }}>{screen.question}</Typography>
      {screen.questionBar && (
        <Box sx={{ mb: 2 }}>
          <MiniBar shaded={screen.questionBar.shaded} parts={screen.questionBar.parts} width={280} height={40} />
        </Box>
      )}
      <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center", flexWrap: "wrap" }}>
        {screen.choices.map((c, i) => (
          <Button
            key={i}
            variant="outlined"
            onClick={() => pick(i)}
            sx={{
              minWidth: 130,
              p: 1.5,
              borderRadius: 3,
              borderWidth: 3,
              borderColor: done && i === screen.answer ? "#2e7d32" : "#5d4037",
              bgcolor: !revealed[i] ? "#90a4ae" : done && i === screen.answer ? "#c8e6c9" : "#fffde7",
              color: "#3e2723",
              animation: wrongIdx === i ? "shake 0.4s" : "none",
              "&:hover": { borderWidth: 3, bgcolor: !revealed[i] ? "#78909c" : "#ffe082" },
            }}
          >
            {revealed[i] ? (
              <ChoiceContent choice={c} magnify />
            ) : (
              <Typography sx={{ fontSize: 30, fontWeight: 900, color: "#eceff1" }}>❔</Typography>
            )}
          </Button>
        ))}
      </Box>
      {feedback && !done && (
        <Typography sx={{ mt: 2, fontWeight: 800, fontSize: 13.5, color: "#c62828" }}>{feedback}</Typography>
      )}
      {done && (
        <Typography sx={{ mt: 2, fontWeight: 800, color: "#2e7d32" }}>✔ Correct!</Typography>
      )}
    </Box>
  );
}
