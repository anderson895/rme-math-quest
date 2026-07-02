/* ============================================================
   CutShare — the scissors-tool mechanic:
   1. A whole item (labeled "1") + friends waiting below.
   2. Player taps the ✂️ tool (bottom-right of the shell) which
      opens a cutting machine with a slider (2–8 equal parts).
   3. Cutting into the right number of parts lets the player
      hand one piece (1/n) to each friend. Wrong cuts get a
      hint and can be re-cut with the tool.
   ============================================================ */

import { Box, Button, Paper, Slider, Typography } from "@mui/material";
import ContentCutRoundedIcon from "@mui/icons-material/ContentCutRounded";
import { useState } from "react";
import type { CutShareScreen } from "../../types";
import { sfxClick, sfxCorrect, sfxWrong } from "../../sound";

interface Props {
  screen: CutShareScreen;
  cutterOpen: boolean;
  closeCutter: () => void;
  onSolved: (perfect: boolean) => void;
}

export default function CutShare({ screen, cutterOpen, closeCutter, onSolved }: Props) {
  const [pieces, setPieces] = useState(0);       // 0 = still whole
  const [given, setGiven] = useState(0);         // pieces already handed out
  const [sliderVal, setSliderVal] = useState(2);
  const [misses, setMisses] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const correctCut = pieces === screen.eaters;
  const done = correctCut && given === screen.eaters;

  const cut = () => {
    sfxClick();
    setPieces(sliderVal);
    setGiven(0);
    if (sliderVal === screen.eaters) {
      setFeedback(`✂️ Perfect cutting! Each piece is 1/${sliderVal}. Now tap a piece to give it to a friend.`);
    } else {
      sfxWrong();
      setMisses((m) => m + 1);
      setFeedback(
        `Hmm… ${sliderVal} ${sliderVal === 1 ? "piece" : "pieces"} for ${screen.eaters} friends is not a fair share. ` +
        `Tap the ✂️ tool and cut again!`
      );
    }
    closeCutter();
  };

  const give = () => {
    if (!correctCut || done) {
      if (!correctCut && pieces > 0) sfxWrong();
      return;
    }
    const g = given + 1;
    setGiven(g);
    if (g === screen.eaters) {
      sfxCorrect();
      setFeedback(`🎉 Everyone got exactly 1/${screen.eaters} of the ${screen.itemLabel}!`);
      onSolved(misses === 0);
    } else {
      sfxClick();
    }
  };

  return (
    <Box sx={{ textAlign: "center", position: "relative" }}>
      <Typography sx={{ fontWeight: 700, mb: 1.5, color: "#33691e" }}>
        🪚 {screen.eaters} friends need <strong>equal shares</strong> of one {screen.itemLabel}.
      </Typography>

      {/* the item: whole, or cut into pieces */}
      <Box sx={{ display: "flex", justifyContent: "center", gap: 0.7, mb: 2, minHeight: 64 }}>
        {pieces === 0 ? (
          <Box sx={{ ...plank, width: "min(440px, 80vw)" }}>1</Box>
        ) : (
          Array.from({ length: pieces - given }, (_, i) => (
            <Box
              key={i}
              onClick={give}
              sx={{
                ...plank,
                width: `min(${440 / pieces}px, ${80 / pieces}vw)`,
                fontSize: 18,
                cursor: correctCut ? "pointer" : "not-allowed",
                opacity: correctCut ? 1 : 0.65,
                "&:hover": correctCut ? { transform: "translateY(-6px)", filter: "brightness(1.15)" } : {},
                transition: "transform .15s, filter .15s",
              }}
            >
              <span>1&frasl;{pieces}</span>
            </Box>
          ))
        )}
      </Box>

      {/* the friends */}
      <Box sx={{ display: "flex", justifyContent: "center", gap: 3, flexWrap: "wrap" }}>
        {Array.from({ length: screen.eaters }, (_, i) => {
          const fed = i < given;
          return (
            <Box key={i} sx={{ textAlign: "center" }}>
              <Typography sx={{
                fontSize: 46, lineHeight: 1.1,
                filter: "drop-shadow(0 3px 3px #0004)",
                animation: fed ? "pulse .4s 2 alternate" : "none",
              }}>
                {screen.eaterIcon}
              </Typography>
              {fed ? (
                <Box sx={{ ...plank, width: 58, height: 30, fontSize: 14, mx: "auto" }}>
                  <span>1&frasl;{pieces}</span>
                </Box>
              ) : (
                <Typography sx={{ fontWeight: 800, color: "#9e9e9e" }}>?</Typography>
              )}
            </Box>
          );
        })}
      </Box>

      {feedback && (
        <Typography sx={{ mt: 1.5, fontWeight: 700, fontSize: 14, color: done ? "#2e7d32" : correctCut ? "#33691e" : "#c62828" }}>
          {feedback}
        </Typography>
      )}
      {pieces === 0 && !cutterOpen && (
        <Typography sx={{ mt: 1.5, fontWeight: 700, fontSize: 14, color: "#5d4037" }}>
          👉 Tap the ✂️ cutting tool at the lower right to begin!
        </Typography>
      )}

      {/* cutting machine (opened by the shell's scissors tool) */}
      {cutterOpen && !done && (
        <Paper
          elevation={8}
          sx={{
            position: "absolute", left: "50%", top: "46%", transform: "translate(-50%, -50%)",
            zIndex: 10, p: 2.5, width: "min(380px, 78vw)",
            bgcolor: "#556b2f", border: "5px solid #33420f", borderRadius: 3, color: "#fff",
          }}
        >
          <Typography sx={{ fontWeight: 900, mb: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
            <ContentCutRoundedIcon fontSize="small" /> CUTTING MACHINE
          </Typography>
          {/* preview of the plank inside the machine */}
          <Box sx={{ display: "flex", justifyContent: "center", gap: 0.4, mb: 1.5 }}>
            {Array.from({ length: sliderVal }, (_, i) => (
              <Box key={i} sx={{ ...plank, height: 26, width: `${200 / sliderVal}px`, fontSize: 0, borderWidth: 2 }} />
            ))}
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: 24 }}>{sliderVal}</Typography>
          <Typography sx={{ fontSize: 12, mb: 1, opacity: 0.85 }}>equal parts</Typography>
          <Slider
            value={sliderVal}
            onChange={(_, v) => { setSliderVal(v as number); }}
            min={2} max={8} step={1} marks
            sx={{
              color: "#ffb300", mx: 1, width: "calc(100% - 16px)",
              "& .MuiSlider-thumb": { width: 26, height: 26, bgcolor: "#ff9800", border: "3px solid #fff" },
              "& .MuiSlider-rail": { bgcolor: "#8d6e63", opacity: 1, height: 10, borderRadius: 5 },
              "& .MuiSlider-track": { height: 10 },
            }}
          />
          <Box sx={{ display: "flex", gap: 1, justifyContent: "center", mt: 1 }}>
            <Button variant="outlined" onClick={() => { sfxClick(); closeCutter(); }}
              sx={{ color: "#fff", borderColor: "#ffffff88", borderRadius: 3, fontWeight: 800 }}>
              Close
            </Button>
            <Button variant="contained" onClick={cut}
              sx={{ bgcolor: "#ff9800", fontWeight: 900, borderRadius: 3, "&:hover": { bgcolor: "#f57c00" } }}>
              Cut! ✂️
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
}

const plank = {
  height: 52,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 900,
  fontSize: 24,
  color: "#fff",
  textShadow: "0 2px 2px #0007",
  background: "linear-gradient(#a9744f, #8d5a3b 55%, #7b4a2d)",
  border: "3px solid #5d4037",
  borderRadius: 1.5,
};
