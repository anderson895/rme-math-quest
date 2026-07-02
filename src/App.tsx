import { useState } from "react";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { GameProvider } from "./state/GameContext";
import MainMenu from "./screens/MainMenu";
import ModulePlay from "./screens/ModulePlay";

const theme = createTheme({
  palette: {
    primary: { main: "#2e7d32" },
    secondary: { main: "#f57c00" },
  },
  typography: {
    fontFamily: `"Comic Sans MS", "Segoe UI", system-ui, sans-serif`,
  },
  shape: { borderRadius: 10 },
});

type View =
  | { name: "menu" }
  | { name: "play"; moduleIdx: number; startIndex?: number };

export default function App() {
  const [view, setView] = useState<View>({ name: "menu" });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GameProvider>
        {/* shown only on touch devices held in portrait */}
        <div className="rotate-overlay">
          <div className="rotate-phone" />
          <div style={{ fontWeight: 800, fontSize: 22 }}>I-rotate ang device mo!</div>
          <div style={{ fontSize: 15, opacity: 0.9 }}>
            Mas maganda ang Barangay Masagana Math Quest sa landscape view.
          </div>
        </div>
        {view.name === "menu" ? (
          <MainMenu onPlay={(moduleIdx, startIndex) => setView({ name: "play", moduleIdx, startIndex })} />
        ) : (
          <ModulePlay
            key={`${view.moduleIdx}-${view.startIndex ?? "resume"}`}
            moduleIdx={view.moduleIdx}
            startIndex={view.startIndex}
            onExit={() => setView({ name: "menu" })}
          />
        )}
      </GameProvider>
    </ThemeProvider>
  );
}
