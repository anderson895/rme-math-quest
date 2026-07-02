import { Box, Chip, Paper, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import type { SortBinsScreen } from "../../types";
import { shuffle } from "../../utils/frac";
import { sfxClick, sfxCorrect, sfxWrong } from "../../sound";

/** Sort inventory boxes onto the shelf of their multiple. Correct boxes
    lock in place; incorrect ones pop back to the tray (per storyboard). */
export default function SortBins({
  screen,
  onSolved,
}: {
  screen: SortBinsScreen;
  onSolved: (perfect: boolean) => void;
}) {
  const tray = useMemo(() => shuffle(screen.items), [screen]);
  const [placed, setPlaced] = useState<Record<number, number[]>>({}); // bin -> items
  const [selected, setSelected] = useState<number | null>(null);
  const [misses, setMisses] = useState(0);
  const [shakeBin, setShakeBin] = useState<number | null>(null);

  const placedItems = Object.values(placed).flat();
  const remaining = tray.filter((it) => !placedItems.includes(it));

  const clickBin = (bin: number) => {
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
            <Typography sx={{ fontWeight: 800, bgcolor: "#6d4c41", color: "#fff", borderRadius: 1, mb: 1 }}>
              Multiples of {bin}
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
        {remaining.map((it) => (
          <Chip
            key={it}
            label={`📦 ${it}`}
            onClick={() => { sfxClick(); setSelected(it); }}
            sx={{
              fontSize: 17, fontWeight: 800, py: 2.4,
              bgcolor: selected === it ? "#f9a825" : "#fff8e1",
              border: "3px solid #5d4037",
              "&:hover": { bgcolor: "#ffe082" },
            }}
          />
        ))}
        {remaining.length === 0 && (
          <Typography sx={{ fontWeight: 800, color: "#2e7d32" }}>🗄️ Inventory sorted — great work, Assistant!</Typography>
        )}
      </Box>
    </Box>
  );
}
