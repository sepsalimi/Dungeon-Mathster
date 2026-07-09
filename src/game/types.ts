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
  | "goldBonus";
export type GamePhase =
  | "start"
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
}

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
}

export type ShopUpgradeId = "heal" | "maxHp" | "damageReductionArmor" | "temporaryArmor" | "barbedArmor" | "sword";
export type BargainId = "oracleLens" | "negativeHeart" | "glassBlade" | "coinHex";

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
