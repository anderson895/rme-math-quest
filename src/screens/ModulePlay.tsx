import { useState } from "react";
import { MODULES } from "../data/modules";
import { useGame } from "../state/GameContext";
import GameShell from "../components/GameShell";
import DialogueScene from "../components/mechanics/DialogueScene";
import CutShare from "../components/mechanics/CutShare";
import BridgeBuild from "../components/mechanics/BridgeBuild";
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
import type { DialogueScreen as DialogueScreenType, Screen } from "../types";
import { sfxCoin } from "../sound";

/* which tools each mechanic gets; the first one is the primary tool
   (gets the guide arrow). Ruler + eraser combine with the primary. */
const TOOLSETS: Partial<Record<Screen["type"], string[]>> = {
  "cut-share":    ["scissors", "ruler", "glue"],
  "bridge-build": ["ruler", "scissors", "glue"],
  "jar-fill":     ["divider", "ruler"],
  "punch-mix":    ["ladle", "ruler"],
  numberline:     ["ruler"],
  "model-shade":  ["brush", "eraser", "ruler"],
  mcq:            ["magnifier"],
  order:          ["scale", "ruler"],
  "sort-bins":    ["table"],
  balance:        ["ruler"],
  simplify:       ["factor"],
  equation:       ["lcd", "scratchpad"],
  // boss stays tool-free on purpose — it's a timed assessment
};

/* HIGHER levels (lesson 8+) demand a COMBINATION of instruments:
   a second tool joins the set and part of the level starts hidden
   or locked until that tool is used */
const ADVANCED_AT = 8; // screen index (lesson number) where combos begin
const ADVANCED_TOOLS: Partial<Record<Screen["type"], string[]>> = {
  numberline:  ["magnifier"],  // road signs arrive covered — inspect them
  "sort-bins": ["magnifier"],  // shelf labels are covered — inspect them
  balance:     ["magnifier"],  // the customer's order is a mystery
  simplify:    ["eraser"],     // the old label is dirty — clean it first
};

/** Runs one module: renders the current screen's mechanic inside GameShell
    and handles progression, coins, tools, and resume position. */
export default function ModulePlay({
  moduleIdx,
  startIndex,
  onExit,
}: {
  moduleIdx: number;
  startIndex?: number;   // replay a specific level from the level select
  onExit: () => void;
}) {
  const module = MODULES[moduleIdx];
  const { progress, addCoins, setScreenIndex, completeModule } = useGame();

  const [idx, setIdx] = useState(() =>
    Math.min(startIndex ?? progress.screenIndex[module.id] ?? 0, module.screens.length - 1)
  );
  const [solved, setSolved] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [activeTools, setActiveTools] = useState<string[]>([]);
  const [eraseSignal, setEraseSignal] = useState(0);
  const [toolUsed, setToolUsed] = useState(false);
  // the level's celebration scene — plays after solving, as a
  // continuation of the level, before walking on the map
  const [inOutro, setInOutro] = useState(false);

  const screen = module.screens[idx];
  const advanced = idx >= ADVANCED_AT;
  const base = TOOLSETS[screen.type];
  const tools = base
    ? [...base, ...(advanced ? ADVANCED_TOOLS[screen.type] ?? [] : [])]
    : undefined;

  /* the outro rendered as a narrative dialogue screen (same look as
     the storyboard feedback slides) */
  const outroScreen: DialogueScreenType | null =
    inOutro && screen.outro
      ? {
          id: `${screen.id}-outro`,
          slide: screen.slide,
          type: "dialogue",
          banner: screen.outro.banner,
          dialogue: screen.outro.dialogue,
          art: screen.outro.art,
          buttonLabel: screen.outro.buttonLabel,
          rme: screen.rme,
          reward: screen.outro.reward ?? 0,
        }
      : null;

  const clearToolState = () => {
    setActiveTools([]);
    setEraseSignal(0);
    setToolUsed(false);
  };

  const handleTool = (id: string) => {
    setToolUsed(true);
    // the eraser is a one-shot action, not a mode — pulse the signal instead
    if (id === "eraser") {
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
    // never rewind the frontier — finishing a REPLAYED old level must
    // not move the traveler backwards or re-enable/disable stop points
    setScreenIndex(module.id, Math.max(progress.screenIndex[module.id] ?? 0, next));
    // back to the map — the traveler walks to the next stop point.
    // (the briefing flows straight into its first lesson instead)
    if (screen.type === "dialogue" && idx === 0) {
      setIdx(next);
      setSolved(false);
      setResetKey(0);
      setInOutro(false);
      clearToolState();
      return;
    }
    onExit();
  };

  // NEXT after solving: play the level's outro celebration first (a
  // continuation of the level's animation), THEN walk on the map
  const handleNext = () => {
    if (screen.outro && !inOutro) {
      setInOutro(true);
      return;
    }
    advance();
  };

  // the outro's own button — award its bonus, then really advance
  const outroDone = () => {
    const bonus = screen.outro?.reward ?? 0;
    if (bonus > 0) {
      sfxCoin();
      addCoins(bonus);
    }
    setInOutro(false);
    advance();
  };

  // dialogue screens complete via their own button and advance directly
  const dialogueDone = () => {
    if (screen.reward > 0) {
      sfxCoin();
      addCoins(screen.reward);
    }
    advance();
  };

  /* outro phase — the celebration scene replaces the workspace; its
     button (not the NEXT arrow) continues the journey */
  if (outroScreen) {
    return (
      <GameShell
        module={module}
        screen={outroScreen}
        screenNumber={idx + 1}
        screenCount={module.screens.length}
        coins={progress.coins}
        solved={false}
        onHome={onExit}
        onReset={() => { setInOutro(false); setSolved(false); setResetKey((k) => k + 1); clearToolState(); }}
        onNext={outroDone}
      >
        <DialogueScene screen={outroScreen} onDone={outroDone} />
      </GameShell>
    );
  }

  return (
    <GameShell
      module={module}
      screen={screen}
      screenNumber={idx + 1}
      screenCount={module.screens.length}
      coins={progress.coins}
      solved={solved && screen.type !== "dialogue"}
      hint={screen.type === "equation" ? screen.hint : undefined}
      advanced={advanced}
      tools={tools}
      activeTools={activeTools}
      toolAttention={!!tools && !toolUsed && !solved}
      onTool={handleTool}
      onHome={onExit}
      onReset={() => { setSolved(false); setResetKey((k) => k + 1); clearToolState(); }}
      onNext={handleNext}
    >
      <Mechanic
        key={`${screen.id}-${resetKey}`}
        screen={screen}
        advanced={advanced}
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
  advanced,
  onSolved,
  onDialogueDone,
  activeTools,
  closePanel,
  eraseSignal,
}: {
  screen: Screen;
  advanced: boolean;
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
    case "bridge-build": return <BridgeBuild screen={screen} onSolved={onSolved} activeTools={activeTools} closePanel={closePanel} />;
    case "jar-fill":    return <JarFill screen={screen} onSolved={onSolved} {...toolProps} />;
    case "punch-mix":   return <PunchMix screen={screen} onSolved={onSolved} {...toolProps} />;
    case "numberline":  return <NumberLinePlot screen={screen} onSolved={onSolved} activeTools={activeTools} advanced={advanced} />;
    case "model-shade": return <ModelShade screen={screen} onSolved={onSolved} {...toolProps} />;
    case "mcq":         return <MCQ screen={screen} onSolved={onSolved} activeTools={activeTools} />;
    case "order":       return <OrderCards screen={screen} onSolved={onSolved} activeTools={activeTools} />;
    case "sort-bins":   return <SortBins screen={screen} onSolved={onSolved} activeTools={activeTools} closePanel={closePanel} advanced={advanced} />;
    case "balance":     return <BalanceScale screen={screen} onSolved={onSolved} activeTools={activeTools} advanced={advanced} />;
    case "simplify":    return <SimplifyStation screen={screen} onSolved={onSolved} activeTools={activeTools} eraseSignal={eraseSignal} advanced={advanced} />;
    case "equation":    return <EquationBuilder screen={screen} onSolved={onSolved} activeTools={activeTools} advanced={advanced} />;
    case "boss":        return <BossChallenge screen={screen} onSolved={onSolved} />;
  }
}
