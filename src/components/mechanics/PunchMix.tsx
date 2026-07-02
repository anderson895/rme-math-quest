/* ============================================================
   PunchMix — Module 3's 🥄 Ladle mechanic, with tool combos:
   • 🥄 ladle  — opens the ladle rack; pouring makes the punch
                 rise with an animation
   • 📏 ruler  — measures the bowl: shows the running total and
                 the target label; without it only the dashed
                 line is visible (estimate vs. measure!)
   • 🧽 eraser — mops up: empties the bowl completely
   Landing EXACTLY on the target line wins; pouring past it
   spills the punch (shake + auto mop-up).
   ============================================================ */

import { Box, Button, Paper, Typography } from "@mui/material";
import SoupKitchenRoundedIcon from "@mui/icons-material/SoupKitchenRounded";
import UndoRoundedIcon from "@mui/icons-material/UndoRounded";
import { useEffect, useState } from "react";
import type { Frac, PunchMixScreen } from "../../types";
import { addFracs, equals, value } from "../../utils/frac";
import FractionText from "../FractionText";
import { sfxClick, sfxCorrect, sfxWrong } from "../../sound";

interface Props {
  screen: PunchMixScreen;
  activeTools: string[];
  closePanel: (id: string) => void;
  eraseSignal: number;
  onSolved: (perfect: boolean) => void;
}

const ZERO: Frac = { n: 0, d: 1 };

export default function PunchMix({ screen, activeTools, closePanel, eraseSignal, onSolved }: Props) {
  const [pours, setPours] = useState<Frac[]>([]);
  const [misses, setMisses] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [spilling, setSpilling] = useState(false);
  const [pouring, setPouring] = useState(false);   // shows the falling stream
  const [done, setDone] = useState(false);

  const rackOpen = activeTools.includes("ladle") && !done;
  const ruler = activeTools.includes("ruler");
  const sum = pours.reduce(addFracs, ZERO);
  const level = Math.min(value(sum), 1);

  /* 🧽 eraser pulse: mop the bowl dry */
  useEffect(() => {
    if (eraseSignal === 0 || done) return;
    sfxClick();
    setPours([]);
    setFeedback("🧽 Bowl emptied and wiped dry! Start pouring again.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eraseSignal]);

  const pour = (ladle: Frac) => {
    if (done || spilling) return;
    const next = addFracs(sum, ladle);

    // falling stream animation while the punch rises
    setPouring(true);
    setTimeout(() => setPouring(false), 650);

    if (value(next) > value(screen.target) + 1e-9) {
      // overflow — spill!
      sfxWrong();
      setMisses((m) => m + 1);
      setSpilling(true);
      setPours([...pours, ladle]); // show it rise past the line briefly
      setFeedback(`💦 Sobra! ${fmtFrac(next)} is past the ${fmtFrac(screen.target)} line — the punch spilled! Mopping up…`);
      setTimeout(() => {
        setPours([]);
        setSpilling(false);
      }, 1200);
      return;
    }

    sfxClick();
    setPours([...pours, ladle]);

    if (equals(next, screen.target)) {
      sfxCorrect();
      setDone(true);
      setFeedback(`🎉 Exactly ${fmtFrac(screen.target)}! The fiesta punch is perfect!`);
      closePanel("ladle");
      onSolved(misses === 0);
    } else {
      setFeedback(
        ruler
          ? `Bowl is now at ${fmtFrac(next)}. Keep pouring to reach ${fmtFrac(screen.target)}!`
          : `The punch rose a little… turn on the 📏 ruler to measure exactly how much!`
      );
    }
  };

  const undo = () => {
    if (done || spilling || pours.length === 0) return;
    sfxClick();
    setPours(pours.slice(0, -1));
    setFeedback("↩️ Poured one ladle back.");
  };

  return (
    <Box sx={{ textAlign: "center", position: "relative" }}>
      <Typography sx={{ fontWeight: 700, mb: 1.5, color: "#4a148c", display: "flex", justifyContent: "center", alignItems: "center" }}>
        🥤 Fill the bowl to exactly&nbsp;<FractionText frac={screen.target} size={17} />&nbsp;— don't overflow!
      </Typography>

      <Box sx={{ display: "flex", justifyContent: "center" }}>
        {/* the punch bowl */}
        <Box sx={{ position: "relative", animation: spilling ? "shake 0.4s 3" : "none" }}>
          {/* spilled droplets falling off the sides */}
          {spilling && (
            <>
              <Typography sx={{ position: "absolute", top: -6, left: -22, fontSize: 26, animation: "spillDrop .9s ease-in forwards", zIndex: 3 }}>💦</Typography>
              <Typography sx={{ position: "absolute", top: -10, right: -22, fontSize: 26, animation: "spillDrop .9s ease-in .15s forwards", zIndex: 3 }}>💦</Typography>
            </>
          )}
          <Box
            sx={{
              position: "relative",
              width: 220, height: 210,
              border: "6px solid #90a4ae",
              borderTopWidth: 3,
              borderRadius: "14px 14px 110px 110px",
              overflow: "hidden",
              bgcolor: "#eceff133",
              boxShadow: "inset 0 0 22px #b0bec555",
            }}
          >
            {/* rising punch */}
            <Box sx={{
              position: "absolute", left: 0, right: 0, bottom: 0,
              height: `${level * 100}%`,
              background: "linear-gradient(#ffb74d, #f57c00)",
              transition: "height .6s ease",
              opacity: 0.95,
            }}>
              <Box sx={{ height: 8, bgcolor: "#ffe0b2aa" }} />
            </Box>
            {/* falling juice stream while pouring */}
            {pouring && (
              <Box sx={{
                position: "absolute", top: 0, left: "47%", width: 12,
                height: `${Math.max(8, (1 - level) * 100)}%`,
                background: "linear-gradient(#ffe0b2, #f57c00)",
                borderRadius: 2,
                animation: "streamPour .65s ease-out forwards",
                zIndex: 2,
              }} />
            )}
            {/* target line */}
            <Box sx={{
              position: "absolute", left: 0, right: 0,
              bottom: `${value(screen.target) * 100}%`,
              borderTop: "3px dashed #c62828",
            }} />
            {/* floating fruit for flavor */}
            {level > 0.08 && (
              <Typography sx={{
                position: "absolute", left: "18%", bottom: `${level * 100 - 6}%`,
                fontSize: 22, transition: "bottom .6s ease",
              }}>
                🍋
              </Typography>
            )}
          </Box>
          {/* 📏 ruler shows the target label beside the line */}
          {ruler && (
            <Box sx={{
              position: "absolute", right: -56,
              bottom: `${value(screen.target) * 100 * (210 / 224)}%`,
              transform: "translateY(50%)",
              bgcolor: "#c62828", color: "#fff", borderRadius: 1.5, px: 0.8, py: 0.2,
              fontWeight: 900, fontSize: 13,
            }}>
              {fmtFrac(screen.target)}
            </Box>
          )}
          <Typography sx={{ mt: 0.5, fontWeight: 900, color: ruler ? "#00838f" : "#9e9e9e" }}>
            {ruler
              ? `📏 Total: ${pours.length === 0 ? "0" : fmtFrac(sum)}`
              : "📏 ruler off — pour carefully!"}
          </Typography>
        </Box>
      </Box>

      {/* pour history */}
      {pours.length > 0 && (
        <Typography sx={{ mt: 0.5, fontSize: 13, color: "#6d4c41", fontWeight: 700 }}>
          Poured: {pours.map((p) => fmtFrac(p)).join(" + ")}
        </Typography>
      )}

      {feedback && (
        <Typography sx={{ mt: 1, fontWeight: 700, fontSize: 14, color: done ? "#2e7d32" : spilling ? "#c62828" : "#4a148c" }}>
          {feedback}
        </Typography>
      )}
      {pours.length === 0 && !rackOpen && !feedback && (
        <Typography sx={{ mt: 1, fontWeight: 700, fontSize: 14, color: "#5d4037" }}>
          👉 Tap the 🥄 ladle tool at the lower right to start pouring!
        </Typography>
      )}

      {/* ladle rack (opened by the shell tool button) */}
      {rackOpen && (
        <Paper
          elevation={8}
          sx={{
            position: "absolute", right: 0, top: "12%",
            zIndex: 10, p: 2, width: 186,
            bgcolor: "#4a148c", border: "5px solid #311b92", borderRadius: 3, color: "#fff",
          }}
        >
          <Typography sx={{ fontWeight: 900, mb: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 0.7, fontSize: 14 }}>
            <SoupKitchenRoundedIcon fontSize="small" /> LADLE RACK
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {screen.ladles.map((l, i) => (
              <Button
                key={i}
                variant="contained"
                onClick={() => pour(l)}
                disabled={spilling}
                sx={{
                  bgcolor: "#ff9800", fontWeight: 900, borderRadius: 3, gap: 0.5,
                  "&:hover": { bgcolor: "#f57c00" },
                }}
              >
                🥄 Pour <FractionText frac={l} size={15} /> cup
              </Button>
            ))}
            <Button
              variant="outlined"
              onClick={undo}
              disabled={pours.length === 0 || spilling}
              startIcon={<UndoRoundedIcon />}
              sx={{ color: "#fff", borderColor: "#ffffff88", borderRadius: 3, fontWeight: 800 }}
            >
              Pour back
            </Button>
            <Button variant="outlined" onClick={() => { sfxClick(); closePanel("ladle"); }}
              sx={{ color: "#fff", borderColor: "#ffffff88", borderRadius: 3, fontWeight: 800 }}>
              Close
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
}

const fmtFrac = (f: Frac) => `${f.n}/${f.d}`;
