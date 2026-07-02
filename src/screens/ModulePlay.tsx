import { useState } from "react";
import { MODULES } from "../data/modules";
import { useGame } from "../state/GameContext";
import GameShell from "../components/GameShell";
import DialogueScene from "../components/mechanics/DialogueScene";
import CutShare from "../components/mechanics/CutShare";
import NumberLinePlot from "../components/mechanics/NumberLinePlot";
import ModelShade from "../components/mechanics/ModelShade";
import MCQ from "../components/mechanics/MCQ";
import OrderCards from "../components/mechanics/OrderCards";
import SortBins from "../components/mechanics/SortBins";
import BalanceScale from "../components/mechanics/BalanceScale";
import SimplifyStation from "../components/mechanics/SimplifyStation";
import EquationBuilder from "../components/mechanics/EquationBuilder";
import BossChallenge from "../components/mechanics/BossChallenge";
import type { Screen } from "../types";
import { sfxCoin } from "../sound";

/** Runs one module: renders the current screen's mechanic inside GameShell
    and handles progression, coins, and resume position. */
export default function ModulePlay({
  moduleIdx,
  onExit,
}: {
  moduleIdx: number;
  onExit: () => void;
}) {
  const module = MODULES[moduleIdx];
  const { progress, addCoins, setScreenIndex, completeModule } = useGame();

  const [idx, setIdx] = useState(() =>
    Math.min(progress.screenIndex[module.id] ?? 0, module.screens.length - 1)
  );
  const [solved, setSolved] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [cutterOpen, setCutterOpen] = useState(false);

  const screen = module.screens[idx];
  const isCutShare = screen.type === "cut-share";

  const handleSolved = () => {
    if (solved) return;
    setSolved(true);
    if (screen.reward > 0) {
      sfxCoin();
      addCoins(screen.reward);
    }
  };

  const advance = () => {
    const next = idx + 1;
    if (next >= module.screens.length) {
      completeModule(module.id, MODULES.length);
      setScreenIndex(module.id, 0); // replay from the top next time
      onExit();
      return;
    }
    setScreenIndex(module.id, next);
    setIdx(next);
    setSolved(false);
    setResetKey(0);
    setCutterOpen(false);
  };

  // dialogue screens complete via their own button and advance directly
  const dialogueDone = () => {
    if (screen.reward > 0) {
      sfxCoin();
      addCoins(screen.reward);
    }
    advance();
  };

  return (
    <GameShell
      module={module}
      screen={screen}
      screenNumber={idx + 1}
      screenCount={module.screens.length}
      coins={progress.coins}
      solved={solved && screen.type !== "dialogue"}
      hint={screen.type === "equation" ? screen.hint : undefined}
      tool={isCutShare ? "scissors" : undefined}
      toolActive={cutterOpen}
      toolAttention={isCutShare && !cutterOpen && !solved}
      onTool={() => setCutterOpen((o) => !o)}
      onHome={onExit}
      onReset={() => { setSolved(false); setResetKey((k) => k + 1); setCutterOpen(false); }}
      onNext={advance}
    >
      <Mechanic
        key={`${screen.id}-${resetKey}`}
        screen={screen}
        onSolved={handleSolved}
        onDialogueDone={dialogueDone}
        cutterOpen={cutterOpen}
        closeCutter={() => setCutterOpen(false)}
      />
    </GameShell>
  );
}

function Mechanic({
  screen,
  onSolved,
  onDialogueDone,
  cutterOpen,
  closeCutter,
}: {
  screen: Screen;
  onSolved: (perfect: boolean) => void;
  onDialogueDone: () => void;
  cutterOpen: boolean;
  closeCutter: () => void;
}) {
  switch (screen.type) {
    case "dialogue":    return <DialogueScene screen={screen} onDone={onDialogueDone} />;
    case "cut-share":   return <CutShare screen={screen} cutterOpen={cutterOpen} closeCutter={closeCutter} onSolved={onSolved} />;
    case "numberline":  return <NumberLinePlot screen={screen} onSolved={onSolved} />;
    case "model-shade": return <ModelShade screen={screen} onSolved={onSolved} />;
    case "mcq":         return <MCQ screen={screen} onSolved={onSolved} />;
    case "order":       return <OrderCards screen={screen} onSolved={onSolved} />;
    case "sort-bins":   return <SortBins screen={screen} onSolved={onSolved} />;
    case "balance":     return <BalanceScale screen={screen} onSolved={onSolved} />;
    case "simplify":    return <SimplifyStation screen={screen} onSolved={onSolved} />;
    case "equation":    return <EquationBuilder screen={screen} onSolved={onSolved} />;
    case "boss":        return <BossChallenge screen={screen} onSolved={onSolved} />;
  }
}
