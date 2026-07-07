export type TileType = "number" | "operator";
export type RoomKind = "monster" | "shop" | "boss" | "mystery";
export type GamePhase =
  | "start"
  | "combat"
  | "door"
  | "shop"
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
  gold: number;
  armor: number;
  swordDamage: number;
  freezeNextRoom: boolean;
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
  kind: "hit" | "miss" | "enemy" | "buy" | "blocked";
  message: string;
  nonce: number;
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
}

export type ShopUpgradeId =
  | "heal"
  | "maxHp"
  | "armor"
  | "freeze"
  | "sword";

export interface ShopUpgrade {
  id: ShopUpgradeId;
  name: string;
  description: string;
  cost: number;
}
