/* Global game progress: coins, unlocked modules, per-module screen
   position, avatar. Persisted to localStorage so pupils can resume. */

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type Gender = "" | "male" | "female";

export interface Progress {
  coins: number;
  name: string;                           // student name (profile setup)
  gender: Gender;
  avatar: string;                         // derived from gender
  unlocked: number;                       // how many modules are playable
  screenIndex: Record<string, number>;    // moduleId -> next screen to play
  completed: Record<string, boolean>;     // moduleId -> finished flag
}

const DEFAULT: Progress = {
  coins: 0,
  name: "",
  gender: "",
  avatar: "🧒🏽",
  unlocked: 1,
  screenIndex: {},
  completed: {},
};

const KEY = "rme-math-quest-progress";

interface GameCtx {
  progress: Progress;
  addCoins: (n: number) => void;
  setProfile: (name: string, gender: Gender) => void;
  setScreenIndex: (moduleId: string, idx: number) => void;
  completeModule: (moduleId: string, moduleCount: number) => void;
  resetProgress: () => void;
}

const Ctx = createContext<GameCtx | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
    } catch {
      return DEFAULT;
    }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(progress));
  }, [progress]);

  const api = useMemo<GameCtx>(
    () => ({
      progress,
      addCoins: (n) => setProgress((p) => ({ ...p, coins: p.coins + n })),
      setProfile: (name, gender) =>
        setProgress((p) => ({
          ...p,
          name: name.trim(),
          gender,
          avatar: gender === "male" ? "👦🏽" : gender === "female" ? "👧🏽" : "🧒🏽",
        })),
      setScreenIndex: (id, idx) =>
        setProgress((p) => ({ ...p, screenIndex: { ...p.screenIndex, [id]: idx } })),
      completeModule: (id, moduleCount) =>
        setProgress((p) => ({
          ...p,
          completed: { ...p.completed, [id]: true },
          unlocked: Math.min(moduleCount, Math.max(p.unlocked, moduleIndexFromId(id) + 2)),
        })),
      resetProgress: () => setProgress(DEFAULT),
    }),
    [progress]
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

const moduleIndexFromId = (id: string) => Number(id.replace("m", "")) - 1;

export function useGame(): GameCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGame must be used inside GameProvider");
  return ctx;
}
