import { useState } from "react";
import { MODULES } from "../data/modules";
import { useGame } from "../state/GameContext";
import GameShell from "../components/GameShell";
import DialogueScene from "../components/mechanics/DialogueScene";
import CutShare from "../components/mechanics/CutShare";
import JarFill from "../components/mechanics/JarFill";
import PunchMix from "../components/mechanics/PunchMix";
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

/* which tools each mechanic gets; the first one is the primary tool
   (gets the guide arrow). Ruler + eraser combine with the primary. */
const TOOLSETS: Partial<Record<Screen["type"], string[]>> = {
  "cut-share": ["scissors", "ruler", "eraser"],
  "jar-fill":  ["divider", "ruler", "eraser"],
  "punch-mix": ["ladle", "ruler", "eraser"],
};

/** Runs one module: renders the current screen's mechanic inside GameShell
    and handles progression, coins, tools, and resume position. */
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
  const [activeTools, setActiveTools] = useState<string[]>([]);
  const [eraseSignal, setEraseSignal] = useState(0);
  const [toolUsed, setToolUsed] = useState(false);

  const screen = module.screens[idx];
  const tools = TOOLSETS[screen.type];

  const clearToolState = () => {
    setActiveTools([]);
    setEraseSignal(0);
    setToolUsed(false);
  };

  const handleTool = (id: string) => {
    setToolUsed(true);
    if (id === "eraser") {
      // instant tool: fires an erase pulse into the mechanic
      setEraseSignal((s) => s + 1);
      return;
    }
    setActiveTools((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));
  };

  const closePanel = (id: string) =>
    setActiveTools((t) => t.filter((x) => x !== id));

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
    clearToolState();
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
      tools={tools}
      activeTools={activeTools}
      toolAttention={!!tools && !toolUsed && !solved}
      onTool={handleTool}
      onHome={onExit}
      onReset={() => { setSolved(false); setResetKey((k) => k + 1); clearToolState(); }}
      onNext={advance}
    >
      <Mechanic
        key={`${screen.id}-${resetKey}`}
        screen={screen}
        onSolved={handleSolved}
        onDialogueDone={dialogueDone}
        activeTools={activeTools}
        closePanel={closePanel}
        eraseSignal={eraseSignal}
      />
    </GameShell>
  );
}

function Mechanic({
  screen,
  onSolved,
  onDialogueDone,
  activeTools,
  closePanel,
  eraseSignal,
}: {
  screen: Screen;
  onSolved: (perfect: boolean) => void;
  onDialogueDone: () => void;
  activeTools: string[];
  closePanel: (id: string) => void;
  eraseSignal: number;
}) {
  const toolProps = { activeTools, closePanel, eraseSignal };
  switch (screen.type) {
    case "dialogue":    return <DialogueScene screen={screen} onDone={onDialogueDone} />;
    case "cut-share":   return <CutShare screen={screen} onSolved={onSolved} {...toolProps} />;
    case "jar-fill":    return <JarFill screen={screen} onSolved={onSolved} {...toolProps} />;
    case "punch-mix":   return <PunchMix screen={screen} onSolved={onSolved} {...toolProps} />;
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
