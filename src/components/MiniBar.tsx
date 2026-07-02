import { Box } from "@mui/material";

/** Small fraction-bar model used in questions and MCQ choices. */
export default function MiniBar({
  shaded,
  parts,
  width = 180,
  height = 34,
  color = "#8bc34a",
}: {
  shaded: number;
  parts: number;
  width?: number;
  height?: number;
  color?: string;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        width,
        height,
        border: "3px solid #5d4037",
        borderRadius: 1.5,
        overflow: "hidden",
        mx: "auto",
      }}
    >
      {Array.from({ length: parts }, (_, i) => (
        <Box
          key={i}
          sx={{
            flex: 1,
            bgcolor: i < shaded ? color : "#fffde7",
            borderRight: i < parts - 1 ? "2px dashed #5d403788" : "none",
          }}
        />
      ))}
    </Box>
  );
}
