import { Box, Button, Chip, Paper, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import type { SortBinsScreen } from "../../types";
import { shuffle } from "../../utils/frac";
import { sfxClick, sfxCorrect, sfxWrong } from "../../sound";

/** Sort inventory boxes onto the shelf of their multiple. Correct boxes
    lock in place; incorrect ones pop back to the tray (per storyboard).
    INSTRUMENTS (required):
    • ✖️ inventory checker — the boxes arrive SEALED: open each one with
      the checker to see its number (the panel shows the multiples chart).
    • 🔍 magnifier (combo levels) — the shelf signs are covered too;
      inspect each shelf before boxes can go on it. */
export default function SortBins({
  screen,
  activeTools = [],
  advanced = false,
  closePanel,
  onSolved,
}: {
  screen: SortBinsScreen;
  activeTools?: string[];
  advanced?: boolean;
  closePanel?: (id: string) => void;
  onSolved: (perfect: boolean) => void;
}) {
  const tray = useMemo(() => shuffle(screen.items), [screen]);
  const [placed, setPlaced] = useState<Record<number, number[]>>({}); // bin -> items
  const [selected, setSelected] = useState<number | null>(null);
  const [misses, setMisses] = useState(0);
  const [shakeBin, setShakeBin] = useState<number | null>(null);
  const [openedItems, setOpenedItems] = useState<number[]>([]); // ✖️ unsealed boxes
  const [readBins, setReadBins] = useState<number[]>([]);       // 🔍 inspected shelves
  const [msg, setMsg] = useState<string | null>(null);

  const checker = activeTools.includes("table");
  const magnifier = activeTools.includes("magnifier");
  const placedItems = Object.values(placed).flat();
  const remaining = tray.filter((it) => !placedItems.includes(it));
  const binHidden = (bin: number) => advanced && !readBins.includes(bin);

  const clickItem = (it: number) => {
    /* sealed box — the checker is the only way to open it */
    if (!openedItems.includes(it)) {
      if (!checker) {
        sfxWrong();
        setMsg("✖️ The box is sealed — open it with the inventory checker first!");
        return;
      }
      sfxClick();
      setOpenedItems((v) => [...v, it]);
      setMsg(`✖️ Opened: this box holds ${it}. Which shelf's multiple is it?`);
      return;
    }
    sfxClick();
    setSelected(it);
    setMsg(null);
  };

  const clickBin = (bin: number) => {
    /* covered shelf sign — inspect it with the magnifier */
    if (binHidden(bin)) {
      if (magnifier) {
        sfxClick();
        setReadBins((v) => [...v, bin]);
        setMsg(`🔍 Inspected: this shelf takes the multiples of ${bin}.`);
      } else {
        sfxWrong();
        setMsg("🔍 The shelf sign is covered — inspect it with the magnifier first!");
        setShakeBin(bin);
        setTimeout(() => setShakeBin(null), 500);
      }
      return;
    }
    if (selected === null) return;
    if (selected % bin === 0) {
      sfxCorrect();
      const next = { ...placed, [bin]: [...(placed[bin] ?? []), selected] };
      setPlaced(next);
      setSelected(null);
      if (Object.values(next).flat().length === screen.items.length) onSolved(misses === 0);
    } else {
      sfxWrong();
      setMisses((m) => m + 1);
      setShakeBin(bin);
      setTimeout(() => setShakeBin(null), 500);
    }
  };

  return (
    <Box sx={{ textAlign: "center" }}>
      <Typography sx={{ fontWeight: 700, mb: 2, color: "#5d4037" }}>
        📦 Tap a box, then tap the shelf of its multiple.
      </Typography>

      {/* ✖️ inventory checker panel: opens boxes + shows the multiples chart */}
      {checker && (
        <Paper sx={{ display: "inline-block", px: 2, py: 1.2, mb: 2, bgcolor: "#fff8e1", border: "2px solid #f9a825", borderRadius: 2 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 13, color: "#5d4037", mb: 0.5 }}>
            ✖️ Inventory checker — tap a sealed 📦 to open it
          </Typography>
          {screen.bins.map((bin) => (
            <Typography key={bin} sx={{ fontSize: 13, fontWeight: 700, color: "#37474f", fontFamily: "monospace" }}>
              {binHidden(bin) ? "❔" : bin} × … = {binHidden(bin)
                ? "🔍 inspect the shelf sign to read this row"
                : Array.from({ length: 10 }, (_, k) => bin * (k + 1)).join(", ")}
            </Typography>
          ))}
          <Button size="small" onClick={() => { sfxClick(); closePanel?.("table"); }} sx={{ mt: 0.5, fontWeight: 800 }}>
            Close
          </Button>
        </Paper>
      )}

      {msg && (
        <Typography sx={{ mb: 1.5, fontWeight: 800, fontSize: 13.5, color: "#00695c" }}>{msg}</Typography>
      )}

      {/* shelves */}
      <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center", mb: 2, flexWrap: "wrap" }}>
        {screen.bins.map((bin) => (
          <Paper
            key={bin}
            onClick={() => clickBin(bin)}
            sx={{
              minWidth: 130, minHeight: 110, p: 1, cursor: "pointer",
              bgcolor: "#efebe9", border: "4px solid #6d4c41", borderRadius: 2,
              animation: shakeBin === bin ? "shake 0.4s" : "none",
              "&:hover": { bgcolor: "#ffe082" },
            }}
          >
            <Typography sx={{ fontWeight: 800, bgcolor: binHidden(bin) ? "#78909c" : "#6d4c41", color: "#fff", borderRadius: 1, mb: 1 }}>
              {binHidden(bin) ? "Multiples of ❔" : `Multiples of ${bin}`}
            </Typography>
            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", justifyContent: "center" }}>
              {(placed[bin] ?? []).map((it) => (
                <Chip key={it} label={it} size="small" sx={{ bgcolor: "#43a047", color: "#fff", fontWeight: 800 }} />
              ))}
            </Box>
          </Paper>
        ))}
      </Box>

      {/* delivery tray */}
      <Typography sx={{ fontSize: 13, color: "#666", mb: 1 }}>Delivery tray:</Typography>
      <Box sx={{ display: "flex", gap: 1, justifyContent: "center", flexWrap: "wrap" }}>
        {remaining.map((it) => {
          const sealed = !openedItems.includes(it);
          return (
            <Chip
              key={it}
              label={sealed ? "📦 ❔" : `📦 ${it}`}
              onClick={() => clickItem(it)}
              sx={{
                fontSize: 17, fontWeight: 800, py: 2.4,
                bgcolor: sealed ? "#cfd8dc" : selected === it ? "#f9a825" : "#fff8e1",
                border: "3px solid #5d4037",
                "&:hover": { bgcolor: sealed ? "#b0bec5" : "#ffe082" },
              }}
            />
          );
        })}
        {remaining.length === 0 && (
          <Typography sx={{ fontWeight: 800, color: "#2e7d32" }}>🗄️ Inventory sorted — great work, Assistant!</Typography>
        )}
      </Box>
    </Box>
  );
}
