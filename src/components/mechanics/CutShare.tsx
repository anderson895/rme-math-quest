/* ============================================================
   CutShare — Module 1's ✂️ scissors mechanic, with tool combos:
   • ✂️ scissors  — opens the cutting machine (slider 2–8 parts)
   • 📏 ruler     — measures pieces: shows "1/n" labels; without
                    it pieces show "?" (measure to be sure!)
   • 🧽 eraser    — un-cuts: the plank becomes whole again
   • COMBO ✂️+📏 — the machine preview shows measured part sizes
   ============================================================ */

import { Box, Button, Paper, Slider, Typography } from "@mui/material";
import ContentCutRoundedIcon from "@mui/icons-material/ContentCutRounded";
import { useEffect, useState } from "react";
import type { CutShareScreen } from "../../types";
import { sfxClick, sfxCorrect, sfxWrong } from "../../sound";

interface Props {
  screen: CutShareScreen;
  activeTools: string[];
  closePanel: (id: string) => void;
  eraseSignal: number;
  onSolved: (perfect: boolean) => void;
}

export default function CutShare({ screen, activeTools, closePanel, eraseSignal, onSolved }: Props) {
  const [pieces, setPieces] = useState(0);       // 0 = still whole
  const [given, setGiven] = useState(0);         // pieces already handed out
  const [sliderVal, setSliderVal] = useState(2);
  const [misses, setMisses] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const machineOpen = activeTools.includes("scissors") && !done;
  const ruler = activeTools.includes("ruler");
  const correctCut = pieces === screen.eaters;

  /* 🧽 eraser pulse: restore the whole plank */
  useEffect(() => {
    if (eraseSignal === 0 || done) return;
    sfxClick();
    setPieces(0);
    setGiven(0);
    setFeedback("🧽 All clean! The plank is whole again — cut it with the ✂️ tool.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eraseSignal]);

  const cut = () => {
    sfxClick();
    setPieces(sliderVal);
    setGiven(0);
    if (sliderVal === screen.eaters) {
      setFeedback(
        ruler
          ? `✂️ Perfect cutting! The 📏 ruler says each piece is 1/${sliderVal}. Tap a piece to give it to a friend.`
          : `✂️ Nice cutting! Tap a piece to give it to a friend — use the 📏 ruler to check each piece's size!`
      );
    } else {
      sfxWrong();
      setMisses((m) => m + 1);
      setFeedback(
        `Hmm… ${sliderVal} ${sliderVal === 1 ? "piece" : "pieces"} for ${screen.eaters} friends is not a fair share. ` +
        `Use the 🧽 eraser or cut again with ✂️!`
      );
    }
    closePanel("scissors");
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
      setDone(true);
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

      {/* the item: whole, or cut into pieces.
          📏 ruler ON = pieces JOIN together (gap closes) for measuring */}
      <Box sx={{ display: "flex", justifyContent: "center", gap: ruler ? 0 : 0.7, mb: 0.5, minHeight: 64, transition: "gap .4s" }}>
        {pieces === 0 ? (
          <Box sx={{ ...plank, width: "min(440px, 80vw)" }}>1</Box>
        ) : (
          Array.from({ length: pieces }, (_, i) => {
            const gone = i < given; // already handed to a friend
            return (
              <Box
                key={i}
                onClick={gone ? undefined : give}
                sx={{
                  ...plank,
                  width: `min(${440 / pieces}px, ${80 / pieces}vw)`,
                  fontSize: 17,
                  cursor: correctCut && !gone ? "pointer" : "not-allowed",
                  opacity: correctCut ? 1 : 0.65,
                  pointerEvents: gone ? "none" : "auto",
                  // pieces FALL from the cutting machine (staggered),
                  // then fall down into a friend's hands when given
                  animation: gone
                    ? "flyGive .5s ease-in forwards"
                    : "dropIn .55s cubic-bezier(.3, 1.4, .5, 1) both",
                  animationDelay: gone ? "0s" : `${i * 0.09}s`,
                  "&:hover": correctCut && !gone ? { filter: "brightness(1.15)" } : {},
                }}
              >
                {/* 📏 ruler measures the pieces; without it, size is unknown */}
                <span>{ruler ? <>1&frasl;{pieces}</> : "?"}</span>
              </Box>
            );
          })
        )}
      </Box>

      {/* 📏 ruler strip: appears under the joined pieces with tick marks,
          showing that the parts connect back into 1 whole */}
      {ruler && (
        <Box sx={{ width: "min(440px, 80vw)", mx: "auto", mb: 1.5, animation: "popIn .3s" }}>
          <Box sx={{ position: "relative", height: 30, bgcolor: "#ffe082", border: "2px solid #f9a825", borderRadius: 1 }}>
            {Array.from({ length: Math.max(pieces, 1) + 1 }, (_, i) => {
              const total = Math.max(pieces, 1);
              return (
                <Box key={i} sx={{ position: "absolute", left: `${(i / total) * 100}%`, top: 2, transform: "translateX(-50%)", textAlign: "center" }}>
                  <Box sx={{ width: 2.5, height: 10, bgcolor: "#5d4037", mx: "auto" }} />
                  <Typography sx={{ fontSize: 10.5, fontWeight: 800, color: "#5d4037", lineHeight: 1.1 }}>
                    {i === 0 ? "0" : i === total ? "1" : `${i}/${total}`}
                  </Typography>
                </Box>
              );
            })}
          </Box>
          {pieces > 0 && (
            <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: "#00838f", mt: 0.3 }}>
              📏 Joined together: {pieces} × 1/{pieces} = 1 whole
            </Typography>
          )}
        </Box>
      )}

      {/* the friends */}
      <Box sx={{ display: "flex", justifyContent: "center", gap: 3, flexWrap: "wrap", mt: ruler ? 0 : 1.5 }}>
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
                <Box sx={{ ...plank, width: 58, height: 30, fontSize: 14, mx: "auto", animation: "dropIn .45s cubic-bezier(.3, 1.4, .5, 1) both" }}>
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
      {pieces === 0 && !machineOpen && !feedback && (
        <Typography sx={{ mt: 1.5, fontWeight: 700, fontSize: 14, color: "#5d4037" }}>
          👉 Tap the ✂️ cutting tool at the lower right to begin!
        </Typography>
      )}

      {/* cutting machine (opened by the shell's scissors tool) */}
      {machineOpen && (
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
          {/* preview of the plank; COMBO with 📏 ruler = measured sizes */}
          <Box sx={{ display: "flex", justifyContent: "center", gap: 0.4, mb: 0.7 }}>
            {Array.from({ length: sliderVal }, (_, i) => (
              <Box key={i} sx={{
                ...plank, height: 26, width: `${200 / sliderVal}px`,
                fontSize: ruler ? 10 : 0, borderWidth: 2,
              }}>
                {ruler && <span>1&frasl;{sliderVal}</span>}
              </Box>
            ))}
          </Box>
          {ruler && (
            <Typography sx={{ fontSize: 11.5, mb: 0.7, color: "#ffe082", fontWeight: 700 }}>
              📏 Ruler attached — showing measured piece sizes!
            </Typography>
          )}
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
            <Button variant="outlined" onClick={() => { sfxClick(); closePanel("scissors"); }}
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
