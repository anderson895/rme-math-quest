/* ============================================================
   BridgeBuild — the full tool-combination mechanic:
   1. 📏 RULER  — measure the bridge: shows 0→1 tick marks and
                  reveals how wide the missing gap is (gap/den).
   2. ✂️ SCISSORS — cut the material plank into equal parts;
                  only pieces of exactly 1/den will fit the gap.
   3. 🧴 GLUE   — turn glue mode ON, then tap a piece to stick
                  it into the gap. Wrong-size pieces bounce off
                  and splash into the river!
   When the gap is filled, the walker crosses the bridge. 🎉
   ============================================================ */

import { Box, Button, Paper, Slider, Typography } from "@mui/material";
import ContentCutRoundedIcon from "@mui/icons-material/ContentCutRounded";
import { useState } from "react";
import type { BridgeBuildScreen } from "../../types";
import GameIcon from "../GameIcon";
import { sfxClick, sfxCorrect, sfxWrong } from "../../sound";

interface Props {
  screen: BridgeBuildScreen;
  activeTools: string[];
  closePanel: (id: string) => void;
  onSolved: (perfect: boolean) => void;
}

export default function BridgeBuild({ screen, activeTools, closePanel, onSolved }: Props) {
  const [pieces, setPieces] = useState(0);      // 0 = material still whole
  const [placed, setPlaced] = useState(0);      // pieces glued into the gap
  const [sliderVal, setSliderVal] = useState(2);
  const [misses, setMisses] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false); // wrong piece splashing
  const [done, setDone] = useState(false);

  const machineOpen = activeTools.includes("scissors") && !done;
  const ruler = activeTools.includes("ruler");
  const glue = activeTools.includes("glue");

  const den = screen.den;
  const gapStartFrac = (den - screen.gapNum) / den; // built part of the bridge
  const fits = pieces === den;
  const remaining = fits ? pieces - placed : pieces;

  const cut = () => {
    sfxClick();
    setPieces(sliderVal);
    setPlaced(0);
    setFeedback(
      sliderVal === den
        ? `✂️ Cut into ${sliderVal} parts — each piece is 1/${den}. Now 🧴 glue them into the gap!`
        : `✂️ Cut into ${sliderVal} parts. Will a 1/${sliderVal} piece fit the gap? 📏 Measure to check!`
    );
    closePanel("scissors");
  };

  const tryPlace = () => {
    if (done || pieces === 0 || rejecting) return;

    if (!glue) {
      sfxWrong();
      setFeedback("🧴 The piece won't stick without GLUE! Turn on the glue tool first.");
      return;
    }
    if (!fits) {
      // wrong size: bounce off and splash into the river
      sfxWrong();
      setMisses((m) => m + 1);
      setRejecting(true);
      setFeedback(
        `💦 A 1/${pieces} piece doesn't fit a 1/${den} slot! ` +
        `📏 Measure the gap and cut the plank into ${den} parts.`
      );
      setTimeout(() => setRejecting(false), 950);
      return;
    }

    const p = placed + 1;
    setPlaced(p);
    if (p === screen.gapNum) {
      sfxCorrect();
      setDone(true);
      closePanel("glue");
      setFeedback(`🌉 Bridge repaired with ${screen.gapNum}/${den} of new planks — watch them cross!`);
      onSolved(misses === 0);
    } else {
      sfxClick();
      setFeedback(`🧴 Glued! ${p}/${screen.gapNum} gap pieces placed.`);
    }
  };

  return (
    <Box sx={{ textAlign: "center", position: "relative" }}>
      <Typography sx={{ fontWeight: 700, mb: 1, color: "#33691e" }}>
        🌉 The bridge is broken! Measure the gap, cut planks that fit, and glue them in.
      </Typography>

      {/* ===== the river & bridge ===== */}
      <Box sx={{ position: "relative", width: "min(480px, 84vw)", mx: "auto", mt: ruler ? 4 : 1 }}>
        {/* 📏 ruler ticks above the bridge */}
        {ruler && (
          <Box sx={{ position: "absolute", top: -26, left: 0, right: 0, animation: "popIn .3s" }}>
            {Array.from({ length: den + 1 }, (_, i) => (
              <Box key={i} sx={{ position: "absolute", left: `${(i / den) * 100}%`, transform: "translateX(-50%)", textAlign: "center" }}>
                <Typography sx={{ fontSize: 11, fontWeight: 900, color: i === 0 || i === den ? "#c62828" : "#5d4037", lineHeight: 1 }}>
                  {i === 0 ? "0" : i === den ? "1" : `${i}/${den}`}
                </Typography>
                <Box sx={{ width: 2.5, height: 12, bgcolor: "#5d4037", mx: "auto" }} />
              </Box>
            ))}
          </Box>
        )}

        {/* walker waiting at the left bank */}
        <Box sx={{
          position: "absolute", top: -34, left: done ? undefined : "-6%",
          zIndex: 3,
          animation: done ? "walkAcross 2.4s ease-in-out forwards" : "none",
        }}>
          <GameIcon icon={screen.walker} size={30} />
        </Box>

        {/* river */}
        <Box sx={{ position: "relative", height: 52, borderRadius: 1.5, overflow: "visible", bgcolor: "#4fc3f7", border: "3px solid #0288d1" }}>
          {/* built part of the deck */}
          <Box sx={{
            position: "absolute", left: 0, top: 0, bottom: 0,
            width: `${gapStartFrac * 100}%`,
            background: "linear-gradient(#a9744f, #7b4a2d)",
            borderRight: "3px solid #5d4037",
          }} />
          {/* glued pieces filling the gap */}
          {Array.from({ length: placed }, (_, i) => (
            <Box key={i} sx={{
              position: "absolute", top: 0, bottom: 0,
              left: `${(gapStartFrac + i / den) * 100}%`,
              width: `${100 / den}%`,
              background: "linear-gradient(#c8956c, #96613c)",
              borderRight: "2px solid #5d4037",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 900, color: "#fff", textShadow: "0 1px 2px #0008",
              animation: "dropIn .5s cubic-bezier(.3, 1.4, .5, 1) both",
            }}>
              {ruler ? `1/${den}` : ""}
            </Box>
          ))}
          {/* dashed outline of the remaining gap */}
          {!done && (
            <Box sx={{
              position: "absolute", top: 0, bottom: 0,
              left: `${(gapStartFrac + placed / den) * 100}%`,
              right: 0,
              border: "3px dashed #ffffffcc",
              borderRadius: 1,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 900, fontSize: 13, textShadow: "0 1px 2px #0007",
            }}>
              {ruler ? `gap = ${screen.gapNum - placed}/${den}` : "gap = ?"}
            </Box>
          )}
        </Box>
      </Box>

      {/* ===== material to cut ===== */}
      <Typography sx={{ mt: 2, fontSize: 13, fontWeight: 800, color: "#5d4037" }}>
        Repair material{glue && !done ? " — 🧴 GLUE MODE ON: tap a piece to stick it!" : ":"}
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "center", gap: 0.6, mt: 0.5, minHeight: 44 }}>
        {pieces === 0 ? (
          <Box sx={{ ...plank, width: "min(300px, 62vw)" }}>1</Box>
        ) : remaining === 0 ? (
          <Typography sx={{ fontWeight: 800, color: "#2e7d32", alignSelf: "center" }}>All pieces used!</Typography>
        ) : (
          Array.from({ length: remaining }, (_, i) => (
            <Box
              key={`${pieces}-${i}`}
              onClick={tryPlace}
              sx={{
                ...plank,
                width: `min(${300 / pieces}px, ${62 / pieces}vw)`,
                fontSize: 13,
                cursor: "pointer",
                animation: rejecting && i === 0
                  ? "rejectSplash .9s ease-in forwards"
                  : "dropIn .5s cubic-bezier(.3, 1.4, .5, 1) both",
                animationDelay: rejecting && i === 0 ? "0s" : `${i * 0.07}s`,
                "&:hover": { filter: "brightness(1.15)" },
              }}
            >
              <span>{ruler ? <>1&frasl;{pieces}</> : "?"}</span>
            </Box>
          ))
        )}
        {/* splash under a rejected piece */}
        {rejecting && (
          <Typography sx={{ position: "absolute", bottom: -6, fontSize: 24, animation: "spillDrop .9s ease-in forwards" }}>💦</Typography>
        )}
      </Box>

      {feedback && (
        <Typography sx={{ mt: 1, fontWeight: 700, fontSize: 14, color: done ? "#2e7d32" : rejecting ? "#c62828" : "#33691e" }}>
          {feedback}
        </Typography>
      )}
      {pieces === 0 && !machineOpen && !feedback && (
        <Typography sx={{ mt: 1, fontWeight: 700, fontSize: 14, color: "#5d4037" }}>
          👉 Start with the 📏 ruler to measure the gap, then ✂️ cut the material!
        </Typography>
      )}

      {/* cutting machine */}
      {machineOpen && (
        <Paper
          elevation={8}
          sx={{
            position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)",
            zIndex: 10, p: 2.5, width: "min(380px, 78vw)",
            bgcolor: "#556b2f", border: "5px solid #33420f", borderRadius: 3, color: "#fff",
          }}
        >
          <Typography sx={{ fontWeight: 900, mb: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
            <ContentCutRoundedIcon fontSize="small" /> CUTTING MACHINE
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center", gap: 0.4, mb: 0.7 }}>
            {Array.from({ length: sliderVal }, (_, i) => (
              <Box key={i} sx={{ ...plank, height: 24, width: `${190 / sliderVal}px`, fontSize: ruler ? 9 : 0, borderWidth: 2 }}>
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
            onChange={(_, v) => setSliderVal(v as number)}
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
  height: 40,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 900,
  fontSize: 20,
  color: "#fff",
  textShadow: "0 2px 2px #0007",
  background: "linear-gradient(#a9744f, #8d5a3b 55%, #7b4a2d)",
  border: "3px solid #5d4037",
  borderRadius: 1.5,
};
