/* ============================================================
   Shared types — the whole game is data-driven from these.
   Each storyboard slide in the Design Matrix maps to one Screen.
   ============================================================ */

export interface Frac {
  n: number;      // numerator
  d: number;      // denominator
  w?: number;     // optional whole part (mixed number)
}

export type RMEPrinciple =
  | "Reality Principle"
  | "Activity Principle"
  | "Level Principle"
  | "Guidance Principle"
  | "Interactivity Principle"
  | "Intertwinement Principle";

/* celebration scene that plays right AFTER a level is solved, as a
   continuation of the level's animation (feedback / story beat) —
   its button then sends the traveler walking to the next stop */
export interface Outro {
  banner: string;
  dialogue: string;
  art?: string;           // big emoji scene art
  buttonLabel: string;
  reward?: number;        // bonus coins granted when the outro closes
}

interface BaseScreen {
  id: string;
  slide: string;          // storyboard slide title, e.g. "Slide 3: Fraction Trail Map"
  banner: string;         // top question/goal banner (blue bar in the reference UI)
  dialogue: string;       // NPC speech bubble text
  rme: RMEPrinciple;
  reward: number;         // coins granted on completion
  outro?: Outro;          // feedback scene shown after solving, before the map walk
}

/* ---------- screen variants (game mechanics) ---------- */

export interface DialogueScreen extends BaseScreen {
  type: "dialogue";
  art?: string;                                   // big emoji scene art
  demo?: "numberline" | "equivalent" | "lcd";     // optional mini teaching diagram
  avatarSelect?: boolean;                         // title screen avatar picker
  buttonLabel: string;
}

export interface NumberLineScreen extends BaseScreen {
  type: "numberline";
  den: number;            // number line partitioned into den equal hops
  targets: number[];      // numerators of the fraction markers to place
}

export interface CutShareScreen extends BaseScreen {
  type: "cut-share";
  eaters: number;      // friends needing equal shares (= target denominator)
  eaterIcon: string;   // temporary emoji for the characters
  itemLabel: string;   // what is being cut, e.g. "wooden plank"
}

export interface BridgeBuildScreen extends BaseScreen {
  type: "bridge-build";
  den: number;       // ruler divisions across the bridge (0 to 1)
  gapNum: number;    // missing parts — the gap is gapNum/den wide
  walker: string;    // character waiting to cross (temporary emoji)
}

export interface JarFillScreen extends BaseScreen {
  type: "jar-fill";
  target: Frac;         // amount the customer ordered
  forbidden?: number;   // jar size that is "sold out" — forces an equivalent form
  customerIcon: string; // temporary emoji
}

export interface PunchMixScreen extends BaseScreen {
  type: "punch-mix";
  target: Frac;         // exact level the bowl must reach
  ladles: Frac[];       // ladle sizes available on the rack
}

export interface ModelShadeScreen extends BaseScreen {
  type: "model-shade";
  frac: Frac;             // fraction to represent
  shape: "bar" | "grid";  // bar = 1 row, grid = 2 rows
}

export interface MCQChoice {
  label?: string;
  frac?: Frac;
  bar?: { shaded: number; parts: number };  // renders a mini fraction bar
}

export interface MCQScreen extends BaseScreen {
  type: "mcq";
  question: string;
  questionBar?: { shaded: number; parts: number };
  choices: MCQChoice[];
  answer: number;         // index of correct choice
}

export interface OrderScreen extends BaseScreen {
  type: "order";
  fracs: Frac[];          // will be shuffled; player arranges ascending
}

export interface SortBinsScreen extends BaseScreen {
  type: "sort-bins";
  bins: number[];         // shelf base numbers
  items: number[];        // each item is a multiple of exactly one bin
}

export interface BalanceScreen extends BaseScreen {
  type: "balance";
  target: Frac;
  choices: Frac[];        // exactly one is equivalent to target
}

export interface SimplifyScreen extends BaseScreen {
  type: "simplify";
  frac: Frac;             // reduce to simplest form by clicking common factors
}

export interface EquationScreen extends BaseScreen {
  type: "equation";
  expr: string;           // rendered problem text, e.g. "1/3 + 1/2 = ?"
  story?: string;         // word-problem context
  answer: Frac;           // any equivalent value is accepted
  allowWhole?: boolean;   // show a whole-number input (mixed numbers)
  hint: string;
}

export interface BossQuestion {
  question: string;
  choices: MCQChoice[];
  answer: number;
}

export interface BossScreen extends BaseScreen {
  type: "boss";
  seconds: number;
  questions: BossQuestion[];
}

export type Screen =
  | DialogueScreen
  | NumberLineScreen
  | CutShareScreen
  | BridgeBuildScreen
  | JarFillScreen
  | PunchMixScreen
  | ModelShadeScreen
  | MCQScreen
  | OrderScreen
  | SortBinsScreen
  | BalanceScreen
  | SimplifyScreen
  | EquationScreen
  | BossScreen;

/* ---------- module ---------- */

export interface NPC {
  icon: string;           // TEMPORARY emoji placeholder — swap with real art later
  name: string;
  role: string;
}

export interface GameModule {
  id: string;
  title: string;
  subtitle: string;
  npc: NPC;
  competencies: string[];
  scenery: string;        // bottom decorative row (emoji fallback)
  sceneryImgs?: string[]; // image sprites for the bottom row (from asset packs)
  themeColor: string;
  screens: Screen[];      // exactly 16: 1 mission briefing + 15 playable levels
}
