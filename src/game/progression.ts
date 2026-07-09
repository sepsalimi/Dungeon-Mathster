// Defines floor rules, boss item rewards, and item labels for the dungeon run.
import type { ItemId, MathOperator, PlayerState } from "./types";

export const STARTING_MAX_HP = 120;
export const STARTING_SWORD_DAMAGE = 2;

export interface BossDefinition {
  name: string;
  hp: number;
  damage: number;
  intro: string;
  item: ItemId;
}

export interface ItemDefinition {
  name: string;
  description: string;
  icon: string;
}

// Template HP targets roughly 5-6 correct answers at the sword damage a player
// is expected to have on that floor. Damage stays a point or two above the
// floor's normal monsters so bosses feel dangerous without one-shotting slow solvers.
const bossTemplates: BossDefinition[] = [
  {
    name: "Count Calculus",
    hp: 10,
    damage: 4,
    intro: "Three rooms brought you here, little solver. My grid is larger, and my sums bite harder.",
    item: "lifesteal",
  },
  {
    name: "Minus Wraith",
    hp: 13,
    damage: 6,
    intro: "Every step down takes something away. Show me you can survive subtraction.",
    item: "damageReductionArmor",
  },
  {
    name: "Product Golem",
    hp: 16,
    damage: 7,
    intro: "Multiplication comes first in my halls. Build the product before chasing the sum.",
    item: "barbedArmor",
  },
  {
    name: "Order Hydra",
    hp: 20,
    damage: 8,
    intro: "Many heads, one order. Keep your operations clean or lose the thread.",
    item: "goldBonus",
  },
  {
    name: "The Bedmas King",
    hp: 24,
    damage: 9,
    intro: "Addition, subtraction, and products all answer to me.",
    item: "sword",
  },
];

export const itemDefinitions: Record<ItemId, ItemDefinition> = {
  oracleLens: {
    name: "Oracle Lens",
    description: "Chance to glow the first answer tile.",
    icon: "eye",
  },
  negativeHeart: {
    name: "Negative Heart",
    description: "Negative numbers enter the grid.",
    icon: "heart",
  },
  glassBlade: {
    name: "Glass Blade",
    description: "Sword damage doubles.",
    icon: "blade",
  },
  coinHex: {
    name: "Coin Hex",
    description: "A coin chose your fate.",
    icon: "hex",
  },
  lifesteal: {
    name: "Lifesteal",
    description: "Heal 2 HP on every hit.",
    icon: "fang",
  },
  damageReductionArmor: {
    name: "Damage Reduction Armor",
    description: "Reduce monster attacks by 1.",
    icon: "shield",
  },
  temporaryArmor: {
    name: "Armor",
    description: "Gain temporary HP.",
    icon: "helm",
  },
  barbedArmor: {
    name: "Barbed Armor",
    description: "Hurt enemies when they hit you.",
    icon: "barb",
  },
  sword: {
    name: "Sword",
    description: "Deal 1 extra damage.",
    icon: "sword",
  },
  maxHp: {
    name: "Max HP",
    description: "Raise max health.",
    icon: "plus",
  },
  goldBonus: {
    name: "Gold Bonus",
    description: "Monsters drop 8 extra gold.",
    icon: "coin",
  },
};

// Cycle bonuses keep boss stats monotonic across the template wrap
// (floor 5 Bedmas King -> floor 6 Count Calculus).
export function getBossDefinition(floor: number): BossDefinition {
  const template = bossTemplates[(floor - 1) % bossTemplates.length];
  const cycle = Math.floor((floor - 1) / bossTemplates.length);
  return {
    ...template,
    hp: template.hp + cycle * 14 + (floor - 1) * 2,
    damage: template.damage + cycle * 5 + (floor - 1),
  };
}

export function getFloorOperators(floor: number): MathOperator[] {
  if (floor >= 3) return ["+", "-", "*"];
  if (floor >= 2) return ["+", "-"];
  return ["+"];
}

// Longer 5-tile paths wait until floor 4 so multiplication (floor 3) and path
// length never spike difficulty on the same floor.
export function getRoomPathLength(size: number, floor: number, isBoss: boolean): number | undefined {
  if (isBoss) return pickBossPathLength(floor);
  if (size === 3 && floor >= 4) return 5;
  return undefined;
}

export function getBossReward(floor: number): number {
  return 45 + floor * 15;
}

export function applyBossItem(player: PlayerState, floor: number): { player: PlayerState; message: string } {
  const item = getBossDefinition(floor).item;
  let rewardedPlayer = addItem(player, item);

  if (item === "lifesteal") {
    rewardedPlayer = { ...rewardedPlayer, lifesteal: rewardedPlayer.lifesteal + 2 };
  }
  if (item === "damageReductionArmor") {
    rewardedPlayer = { ...rewardedPlayer, damageReductionArmor: rewardedPlayer.damageReductionArmor + 1 };
  }
  if (item === "barbedArmor") {
    rewardedPlayer = { ...rewardedPlayer, barbedArmor: rewardedPlayer.barbedArmor + 1 };
  }
  if (item === "goldBonus") {
    rewardedPlayer = { ...rewardedPlayer, goldBonus: rewardedPlayer.goldBonus + 8 };
  }
  if (item === "sword") {
    rewardedPlayer = { ...rewardedPlayer, swordDamage: rewardedPlayer.swordDamage + 1 };
  }

  return { player: rewardedPlayer, message: `${itemDefinitions[item].name} found.` };
}

export function addItem(player: PlayerState, item: ItemId, amount = 1): PlayerState {
  return {
    ...player,
    items: {
      ...player.items,
      [item]: getItemCount(player, item) + amount,
    },
  };
}

export function getItemCount(player: PlayerState, item: ItemId): number {
  return player.items[item] ?? 0;
}

export function getItemStacks(player: PlayerState): Array<{ id: ItemId; count: number; label: string; icon: string }> {
  return (Object.keys(itemDefinitions) as ItemId[])
    .map((id) => ({
      id,
      count: getItemCount(player, id),
      label: itemDefinitions[id].name,
      icon: itemDefinitions[id].icon,
    }))
    .filter((item) => item.count > 0);
}

// Early bosses stay on short paths so new players are not asked to plan
// 7-tile swipes before they have learned the grid.
function pickBossPathLength(floor: number): number {
  const roll = Math.random();
  if (floor < 3) {
    return roll < 0.65 ? 3 : 5;
  }
  if (floor < 5) {
    if (roll < 0.35) return 3;
    if (roll < 0.8) return 5;
    return 7;
  }
  if (roll < 0.25) return 3;
  if (roll < 0.7) return 5;
  return 7;
}
