export type TileType = "number" | "operator";
export type SoundLevel = "mute" | "low" | "loud";
export type RoomKind = "monster" | "shop" | "boss" | "mystery" | "bargain";
export type MathOperator = "+" | "-" | "*";
export type ItemId =
  | "oracleLens"
  | "negativeHeart"
  | "glassBlade"
  | "coinHex"
  | "lifesteal"
  | "damageReductionArmor"
  | "temporaryArmor"
  | "barbedArmor"
  | "sword"
  | "maxHp"
  | "goldBonus"
  | "longEquation";
export type TutorialStep = "swipe" | "finish" | "enemyHit" | "killEnemy" | "gold" | "door" | "shop";
export type GamePhase =
  | "start"
  | "floorIntro"
  | "combat"
  | "door"
  | "shop"
  | "bargain"
  | "bossIntro"
  | "victory"
  | "defeat";

export interface GridTile {
  id: string;
  row: number;
  col: number;
  type: TileType;
  value: string;
}

export interface Puzzle {
  size: number;
  target: number;
  tiles: GridTile[];
  answerPath: string[];
}

export interface PlayerState {
  hp: number;
  maxHp: number;
  temporaryHp: number;
  gold: number;
  goldBonus: number;
  damageReductionArmor: number;
  barbedArmor: number;
  swordDamage: number;
  oracleLensChance: number;
  negativesUnlocked: boolean;
  extraDamageTaken: number;
  lifesteal: number;
  permutationBonus: number;
  items: Partial<Record<ItemId, number>>;
}

export interface EnemyState {
  name: string;
  hp: number;
  maxHp: number;
  damage: number;
  isBoss: boolean;
}

export interface DoorChoice {
  id: string;
  kind: RoomKind;
  label: string;
  icon: string;
  tone: "danger" | "safe" | "rare";
}

export interface FeedbackState {
  kind: "hit" | "miss" | "enemy" | "buy" | "blocked" | "pause";
  message: string;
  nonce: number;
  amount?: number;
  rewards?: RewardCue[];
}

export type RewardCue =
  | { kind: "gold"; amount: number }
  | { kind: "item"; itemId: ItemId };

export interface GameState {
  phase: GamePhase;
  floor: number;
  roomsCleared: number;
  player: PlayerState;
  enemy: EnemyState | null;
  puzzle: Puzzle | null;
  doors: DoorChoice[];
  feedback: FeedbackState | null;
  frozenUntil: number;
  paused: boolean;
  tutorial: TutorialStep | null;
  tutorialEnemyHitDone: boolean;
  showFloorScroll: boolean;
  floorIntroNonce: number;
  pendingBossFight: boolean;
}

export type ShopUpgradeId = "heal" | "maxHp" | "damageReductionArmor" | "temporaryArmor" | "barbedArmor" | "sword";
export type BargainId = "oracleLens" | "negativeHeart" | "glassBlade" | "coinHex" | "giantEquation";

export interface ShopUpgrade {
  id: ShopUpgradeId;
  name: string;
  description: string;
  cost: number;
  costStep: number;
}

export interface BargainOption {
  id: BargainId;
  name: string;
  upside: string;
  downside: string;
}
