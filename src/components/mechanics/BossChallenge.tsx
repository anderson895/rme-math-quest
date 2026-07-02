import { Box, Button, Chip, LinearProgress, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import TimerRoundedIcon from "@mui/icons-material/TimerRounded";
import type { BossScreen } from "../../types";
import { ChoiceContent } from "./MCQ";
import { sfxCorrect, sfxWrong, sfxFanfare } from "../../sound";

/** Timed integrated challenge: answer every question before time runs out. */
export default function BossChallenge({
  screen,
  onSolved,
}: {
  screen: BossScreen;
  onSolved: (perfect: boolean) => void;
}) {
  const [qIdx, setQIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(screen.seconds);
  const [misses, setMisses] = useState(0);
  const [wrongIdx, setWrongIdx] = useState<number | null>(null);
  const [status, setStatus] = useState<"playing" | "won" | "timeout">("playing");

  useEffect(() => {
    if (status !== "playing") return;
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          setStatus("timeout");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [status]);

  const question = screen.questions[qIdx];

  const pick = (i: number) => {
    if (status !== "playing") return;
    if (i === question.answer) {
      if (qIdx + 1 === screen.questions.length) {
        sfxFanfare();
        setStatus("won");
        onSolved(misses === 0);
      } else {
        sfxCorrect();
        setQIdx((q) => q + 1);
      }
    } else {
      sfxWrong();
      setMisses((m) => m + 1);
      setWrongIdx(i);
      setTimeout(() => setWrongIdx(null), 600);
    }
  };

  const retry = () => {
    setQIdx(0);
    setMisses(0);
    setTimeLeft(screen.seconds);
    setStatus("playing");
  };

  if (status === "timeout") {
    return (
      <Box sx={{ textAlign: "center" }}>
        <Typography sx={{ fontSize: 50 }}>🌇</Typography>
        <Typography sx={{ fontWeight: 800, fontSize: 20, mb: 1 }}>The sun went down!</Typography>
        <Typography sx={{ color: "#666", mb: 2 }}>Don't worry — every hero gets another sunrise.</Typography>
        <Button variant="contained" onClick={retry} sx={{ fontWeight: 800, borderRadius: 3 }}>
          Try Again 🌅
        </Button>
      </Box>
    );
  }

  if (status === "won") {
    return (
      <Box sx={{ textAlign: "center" }}>
        <Typography sx={{ fontSize: 50 }}>🏅</Typography>
        <Typography sx={{ fontWeight: 800, fontSize: 20, color: "#2e7d32" }}>
          Boss mission complete{misses === 0 ? " — flawless run!" : "!"}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ textAlign: "center" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Chip label={`Question ${qIdx + 1} / ${screen.questions.length}`} sx={{ fontWeight: 800 }} />
        <Chip
          icon={<TimerRoundedIcon />}
          label={`${timeLeft}s`}
          color={timeLeft <= 15 ? "error" : "default"}
          sx={{ fontWeight: 800 }}
        />
      </Box>
      <LinearProgress
        variant="determinate"
        value={(timeLeft / screen.seconds) * 100}
        color={timeLeft <= 15 ? "error" : "success"}
        sx={{ height: 8, borderRadius: 4, mb: 2 }}
      />

      <Typography sx={{ fontWeight: 800, fontSize: 20, mb: 2 }}>{question.question}</Typography>
      <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center", flexWrap: "wrap" }}>
        {question.choices.map((c, i) => (
          <Button
            key={`${qIdx}-${i}`}
            variant="outlined"
            onClick={() => pick(i)}
            sx={{
              minWidth: 120, p: 1.5, borderRadius: 3, borderWidth: 3, borderColor: "#5d4037",
              bgcolor: "#fffde7", color: "#3e2723",
              animation: wrongIdx === i ? "shake 0.4s" : "none",
              "&:hover": { borderWidth: 3, bgcolor: "#ffe082" },
            }}
          >
            <ChoiceContent choice={c} />
          </Button>
        ))}
      </Box>
    </Box>
  );
}
