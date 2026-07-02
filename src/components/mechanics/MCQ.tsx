import { Box, Button, Typography } from "@mui/material";
import { useState } from "react";
import type { MCQChoice, MCQScreen } from "../../types";
import FractionText from "../FractionText";
import MiniBar from "../MiniBar";
import { sfxCorrect, sfxWrong } from "../../sound";

export function ChoiceContent({ choice, size = 20 }: { choice: MCQChoice; size?: number }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
      {choice.bar && <MiniBar shaded={choice.bar.shaded} parts={choice.bar.parts} width={150} height={28} />}
      {choice.frac && <FractionText frac={choice.frac} size={size} />}
      {choice.label && <Typography sx={{ fontWeight: 700 }}>{choice.label}</Typography>}
    </Box>
  );
}

/** Multiple-choice question with optional fraction-bar visuals. */
export default function MCQ({
  screen,
  onSolved,
}: {
  screen: MCQScreen;
  onSolved: (perfect: boolean) => void;
}) {
  const [wrongIdx, setWrongIdx] = useState<number | null>(null);
  const [misses, setMisses] = useState(0);
  const [done, setDone] = useState(false);

  const pick = (i: number) => {
    if (done) return;
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
              bgcolor: done && i === screen.answer ? "#c8e6c9" : "#fffde7",
              color: "#3e2723",
              animation: wrongIdx === i ? "shake 0.4s" : "none",
              "&:hover": { borderWidth: 3, bgcolor: "#ffe082" },
            }}
          >
            <ChoiceContent choice={c} />
          </Button>
        ))}
      </Box>
      {done && (
        <Typography sx={{ mt: 2, fontWeight: 800, color: "#2e7d32" }}>✔ Correct!</Typography>
      )}
    </Box>
  );
}
