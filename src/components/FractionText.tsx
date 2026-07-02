import { Box } from "@mui/material";
import type { Frac } from "../types";

/** Stacked fraction display, supports mixed numbers (whole part). */
export default function FractionText({ frac, size = 22 }: { frac: Frac; size?: number }) {
  return (
    <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, mx: 0.5 }}>
      {frac.w ? (
        <Box component="span" sx={{ fontSize: size * 1.3, fontWeight: 700 }}>
          {frac.w}
        </Box>
      ) : null}
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          flexDirection: "column",
          textAlign: "center",
          fontWeight: 700,
          lineHeight: 1.15,
          fontSize: size,
        }}
      >
        <Box component="span" sx={{ borderBottom: "2.5px solid currentColor", px: 0.8 }}>
          {frac.n}
        </Box>
        <Box component="span" sx={{ px: 0.8 }}>{frac.d}</Box>
      </Box>
    </Box>
  );
}
