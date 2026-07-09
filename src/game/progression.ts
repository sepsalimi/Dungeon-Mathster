// Defines floor rules, boss rewards, and relic labels for the dungeon run.
import type { MathOperator, PlayerState, RelicId } from "./types";

export const MAX_FLOOR = 5;
export const STARTING_MAX_HP = 120;

export interface BossDefinition {
  name: string;
  hp: number;
  damage: number;
  intro: string;
  relic: RelicId | null;
}

export interface RelicDefinition {
  name: string;
  description: string;
}

export const bossDefinitions: Record<number, BossDefinition> = {
  1: {
    name: "Count Calculus",
    hp: 6,
    damage: 5,
    intro: "Three rooms brought you here, little solver. My grid is larger, and my sums bite harder.",
    relic: "vampireFang",
  },
  2: {
    name: "Minus Wraith",
    hp: 8,
    damage: 7,
    intro: "Every step down takes something away. Show me you can survive subtraction.",
    relic: "ironTheorem",
  },
  3: {
    name: "Product Golem",
    hp: 11,
    damage: 9,
    intro: "Multiplication comes first in my halls. Build the product before chasing the sum.",
    relic: "timeshard",
  },
  4: {
    name: "Order Hydra",
    hp: 14,
    damage: 11,
    intro: "Many heads, one order. Keep your operations clean or lose the thread.",
    relic: "goldenAbacus",
  },
  5: {
    name: "The Bedmas King",
    hp: 18,
    damage: 13,
    intro: "This is the last floor. Addition, subtraction, and products all answer to me.",
    relic: null,
  },
};

export const relicDefinitions: Record<RelicId, RelicDefinition> = {
  oracleLens: {
    name: "Oracle Lens",
    description: "The first answer tile glows.",
  },
  negativeHeart: {
    name: "Negative Heart",
    description: "Negative numbers enter the grid.",
  },
  glassBlade: {
    name: "Glass Blade",
    description: "Sword damage doubles.",
  },
  coinHex: {
    name: "Coin Hex",
    description: "A coin chose your fate.",
  },
  vampireFang: {
    name: "Vampire Fang",
    description: "Heal 1 HP on every hit.",
  },
  ironTheorem: {
    name: "Iron Theorem",
    description: "Gain 1 armor.",
  },
  timeshard: {
    name: "Timeshard",
    description: "Gain 1 sword damage.",
  },
  goldenAbacus: {
    name: "Golden Abacus",
    description: "Monsters drop 8 extra gold.",
  },
};

export function getFloorOperators(floor: number): MathOperator[] {
  if (floor >= 3) return ["+", "-", "*"];
  if (floor >= 2) return ["+", "-"];
  return ["+"];
}

export function getRoomPathLength(size: number, floor: number, isBoss: boolean): number | undefined {
  if (isBoss) return pickBossPathLength(floor);
  if (size === 3 && floor >= 3) return 5;
  return undefined;
}

export function getBossReward(floor: number): number {
  return 45 + floor * 15;
}

export function applyBossRelic(player: PlayerState, floor: number): { player: PlayerState; message: string } {
  const relic = bossDefinitions[floor].relic;
  const rewardedPlayer = relic ? addRelic(player, relic) : player;

  if (relic === "vampireFang") {
    return {
      player: { ...rewardedPlayer, lifesteal: rewardedPlayer.lifesteal + 1 },
      message: "Vampire Fang relic found. Heal on every hit.",
    };
  }

  if (relic === "ironTheorem") {
    return {
      player: { ...rewardedPlayer, armor: rewardedPlayer.armor + 1 },
      message: "Iron Theorem relic found. Armor increased.",
    };
  }

  if (relic === "timeshard") {
    return {
      player: { ...rewardedPlayer, swordDamage: rewardedPlayer.swordDamage + 1 },
      message: "Timeshard relic found. Sword damage increased.",
    };
  }

  if (relic === "goldenAbacus") {
    return {
      player: { ...rewardedPlayer, goldBonus: rewardedPlayer.goldBonus + 8 },
      message: "Golden Abacus relic found. Monsters drop more gold.",
    };
  }

  return { player: rewardedPlayer, message: "Final boss defeated." };
}

export function addRelic(player: PlayerState, relic: RelicId): PlayerState {
  if (player.relics.includes(relic)) return player;
  return { ...player, relics: [...player.relics, relic] };
}

export function getRelicBadges(player: PlayerState): string[] {
  const badges = player.relics.map((relic) => relicDefinitions[relic].name);
  if (player.swordDamage > 1) badges.push(`Sword +${player.swordDamage - 1}`);
  if (player.armor > 0) badges.push(`Armor +${player.armor}`);
  if (player.maxHp > STARTING_MAX_HP) badges.push(`Max HP +${player.maxHp - STARTING_MAX_HP}`);
  if (player.goldBonus > 0) badges.push(`Gold +${player.goldBonus}`);
  if (player.lifesteal > 0) badges.push(`Lifesteal +${player.lifesteal}`);
  return [...new Set(badges)];
}

function pickBossPathLength(floor: number): number {
  const roll = Math.random();
  if (floor < 3) {
    if (roll < 0.55) return 3;
    if (roll < 0.9) return 5;
    return 7;
  }
  if (roll < 0.25) return 3;
  if (roll < 0.72) return 5;
  return 7;
}
