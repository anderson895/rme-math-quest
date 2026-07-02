/* ============================================================
   JarFill — Module 2's 🫙 Jar Divider mechanic, with tool combos:
   • 🫙 divider — opens the machine (slider 2–10 jar sections)
   • 📏 ruler   — measures the jar: live "filled/sections" reading
                  and measured section sizes in the machine preview
   • 🧽 eraser  — empties all candies from the jar
   Customer orders a fraction whose jar size is SOLD OUT, so the
   player must build an EQUIVALENT fraction in a different size.
   ============================================================ */

import { Box, Button, Paper, Slider, Typography } from "@mui/material";
import ViewAgendaRoundedIcon from "@mui/icons-material/ViewAgendaRounded";
import { useEffect, useState } from "react";
import type { JarFillScreen } from "../../types";
import { equals } from "../../utils/frac";
import FractionText from "../FractionText";
import GameIcon from "../GameIcon";
import { sfxClick, sfxCorrect, sfxWrong } from "../../sound";

interface Props {
  screen: JarFillScreen;
  activeTools: string[];
  closePanel: (id: string) => void;
  eraseSignal: number;
  onSolved: (perfect: boolean) => void;
}

export default function JarFill({ screen, activeTools, closePanel, eraseSignal, onSolved }: Props) {
  const [sections, setSections] = useState(0);        // 0 = undivided jar
  const [filled, setFilled] = useState<boolean[]>([]);
  const [sliderVal, setSliderVal] = useState(4);
  const [misses, setMisses] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);
  const [done, setDone] = useState(false);

  const machineOpen = activeTools.includes("divider") && !done;
  const ruler = activeTools.includes("ruler");
  const filledCount = filled.filter(Boolean).length;

  /* 🧽 eraser pulse: empty the jar */
  useEffect(() => {
    if (eraseSignal === 0 || done) return;
    sfxClick();
    setFilled((f) => f.map(() => false));
    setFeedback("🧽 Jar emptied! Fill the sections again.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eraseSignal]);

  const divide = () => {
    sfxClick();
    setSections(sliderVal);
    setFilled(Array(sliderVal).fill(false));
    setFeedback(`🫙 Jar divided into ${sliderVal} sections. Tap sections to fill them with candy!`);
    closePanel("divider");
  };

  const serve = () => {
    if (done || sections === 0) return;
    if (filledCount > 0 && equals({ n: filledCount, d: sections }, screen.target)) {
      sfxCorrect();
      setDone(true);
      setFeedback(
        `🛎️ Perfect! ${filledCount}/${sections} is the same amount as ` +
        `${screen.target.n}/${screen.target.d} — the customer is happy!`
      );
      onSolved(misses === 0);
    } else {
      sfxWrong();
      setMisses((m) => m + 1);
      setShaking(true);
      setTimeout(() => setShaking(false), 600);
      setFeedback(
        `That's ${filledCount}/${sections} of a jar, but the order is ` +
        `${screen.target.n}/${screen.target.d}. Adjust the candy — or re-divide with the 🫙 tool!`
      );
    }
  };

  return (
    <Box sx={{ textAlign: "center", position: "relative" }}>
      {/* customer order card */}
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 1.5, mb: 1.5 }}>
        <Box sx={{ filter: "drop-shadow(0 3px 3px #0004)" }}>
          <GameIcon icon={screen.customerIcon} size={44} />
        </Box>
        <Paper sx={{ px: 2, py: 0.8, bgcolor: "#fff", border: "2px solid #5d4037", borderRadius: 2 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center" }}>
            I'd like&nbsp;<FractionText frac={screen.target} size={16} />&nbsp;of a jar, please!
            {screen.forbidden && (
              <>&nbsp;<span style={{ color: "#c62828" }}>({screen.forbidden}-section jars are SOLD OUT!)</span></>
            )}
          </Typography>
        </Paper>
      </Box>

      {/* the jar (sections stack bottom-up) */}
      <Box sx={{ display: "inline-block", animation: shaking ? "shake 0.4s" : "none" }}>
        <Box sx={{ width: 90, height: 14, bgcolor: "#8d6e63", borderRadius: 2, mx: "auto", border: "3px solid #4e342e" }} />
        <Box
          key={sections} /* remount when re-divided so the jar pops in again */
          sx={{
            width: 150, height: 220, mx: "auto",
            border: "5px solid #90a4ae", borderTopWidth: 3,
            borderRadius: "10px 10px 26px 26px",
            bgcolor: "#eceff122",
            display: "flex", flexDirection: "column-reverse", overflow: "hidden",
            boxShadow: "inset 0 0 18px #b0bec555",
            animation: sections > 0 ? "popIn .35s" : "none",
          }}
        >
          {sections === 0 ? (
            <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 34, color: "#78909c" }}>
              1
            </Box>
          ) : (
            filled.map((on, i) => (
              <Box
                key={i}
                onClick={() => {
                  if (done) return;
                  sfxClick();
                  setFilled((f) => f.map((v, j) => (j === i ? !v : v)));
                  setFeedback(null);
                }}
                sx={{
                  flex: 1,
                  borderTop: "3px dashed #90a4ae99",
                  cursor: done ? "default" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: Math.max(11, 24 - sections * 1.4),
                  bgcolor: on ? "#f48fb1" : "transparent",
                  transition: "background-color .25s",
                  "&:hover": done ? {} : { bgcolor: on ? "#f06292" : "#ffe08255" },
                }}
              >
                {/* candy drops in with a pop */}
                {on ? <Box component="span" sx={{ animation: "dropIn .4s cubic-bezier(.3, 1.4, .5, 1) both" }}>🍬</Box> : ""}
              </Box>
            ))
          )}
        </Box>
        {/* 📏 ruler shows the live fraction reading */}
        {sections > 0 && (
          <Typography sx={{ mt: 0.5, fontWeight: 900, color: ruler ? "#00838f" : "#9e9e9e" }}>
            {ruler ? `📏 ${filledCount}/${sections} filled` : "📏 ruler off — how much is this?"}
          </Typography>
        )}
      </Box>

      {feedback && (
        <Typography sx={{ mt: 1.2, fontWeight: 700, fontSize: 14, color: done ? "#2e7d32" : "#c62828" }}>
          {feedback}
        </Typography>
      )}
      {sections === 0 && !machineOpen && !feedback && (
        <Typography sx={{ mt: 1.2, fontWeight: 700, fontSize: 14, color: "#5d4037" }}>
          👉 Tap the 🫙 divider tool at the lower right to choose a jar size!
        </Typography>
      )}

      {sections > 0 && !done && (
        <Box>
          <Button variant="contained" onClick={serve} disabled={filledCount === 0}
            sx={{ mt: 1.5, fontWeight: 900, borderRadius: 3, bgcolor: "#ad1457", "&:hover": { bgcolor: "#880e4f" } }}>
            Serve the Customer 🛎️
          </Button>
        </Box>
      )}

      {/* jar divider machine (opened by the shell tool button) */}
      {machineOpen && (
        <Paper
          elevation={8}
          sx={{
            position: "absolute", left: "50%", top: "46%", transform: "translate(-50%, -50%)",
            zIndex: 10, p: 2.5, width: "min(380px, 78vw)",
            bgcolor: "#4e342e", border: "5px solid #3e2723", borderRadius: 3, color: "#fff",
          }}
        >
          <Typography sx={{ fontWeight: 900, mb: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
            <ViewAgendaRoundedIcon fontSize="small" /> JAR DIVIDER
          </Typography>
          {/* mini jar preview; COMBO with 📏 ruler = measured section sizes */}
          <Box sx={{
            width: 74, height: 100, mx: "auto", mb: 0.7,
            border: "3px solid #d7ccc8", borderRadius: "6px 6px 14px 14px",
            display: "flex", flexDirection: "column",
          }}>
            {Array.from({ length: sliderVal }, (_, i) => (
              <Box key={i} sx={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: ruler ? 9 : 0, fontWeight: 800,
                borderBottom: i < sliderVal - 1 ? "2px dashed #d7ccc888" : "none",
              }}>
                {ruler ? `1/${sliderVal}` : ""}
              </Box>
            ))}
          </Box>
          {ruler && (
            <Typography sx={{ fontSize: 11.5, mb: 0.7, color: "#ffe082", fontWeight: 700 }}>
              📏 Ruler attached — showing measured section sizes!
            </Typography>
          )}
          <Typography sx={{ fontWeight: 800, fontSize: 24, color: sliderVal === screen.forbidden ? "#ef9a9a" : "#fff" }}>
            {sliderVal}{sliderVal === screen.forbidden ? " — SOLD OUT!" : ""}
          </Typography>
          <Typography sx={{ fontSize: 12, mb: 1, opacity: 0.85 }}>jar sections</Typography>
          <Slider
            value={sliderVal}
            onChange={(_, v) => setSliderVal(v as number)}
            min={2} max={10} step={1} marks
            sx={{
              color: "#ffb300", mx: 1, width: "calc(100% - 16px)",
              "& .MuiSlider-thumb": { width: 26, height: 26, bgcolor: "#ff9800", border: "3px solid #fff" },
              "& .MuiSlider-rail": { bgcolor: "#8d6e63", opacity: 1, height: 10, borderRadius: 5 },
              "& .MuiSlider-track": { height: 10 },
            }}
          />
          <Box sx={{ display: "flex", gap: 1, justifyContent: "center", mt: 1 }}>
            <Button variant="outlined" onClick={() => { sfxClick(); closePanel("divider"); }}
              sx={{ color: "#fff", borderColor: "#ffffff88", borderRadius: 3, fontWeight: 800 }}>
              Close
            </Button>
            <Button variant="contained" onClick={divide} disabled={sliderVal === screen.forbidden}
              sx={{ bgcolor: "#ff9800", fontWeight: 900, borderRadius: 3, "&:hover": { bgcolor: "#f57c00" } }}>
              Divide 🫙
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
