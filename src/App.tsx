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

type View = { name: "menu" } | { name: "play"; moduleIdx: number };

export default function App() {
  const [view, setView] = useState<View>({ name: "menu" });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GameProvider>
        {view.name === "menu" ? (
          <MainMenu onPlay={(moduleIdx) => setView({ name: "play", moduleIdx })} />
        ) : (
          <ModulePlay
            key={view.moduleIdx}
            moduleIdx={view.moduleIdx}
            onExit={() => setView({ name: "menu" })}
          />
        )}
      </GameProvider>
    </ThemeProvider>
  );
}
