// Shop upgrades and cursed bargains: catalog, pricing, and pure apply functions.
// Kept free of React state so the balance simulation can reuse the exact same rules.
import type { BargainId, BargainOption, PlayerState, ShopUpgrade, ShopUpgradeId } from "./types";
import { addItem, getItemCount } from "./progression";

export const shopUpgrades: ShopUpgrade[] = [
  { id: "heal", name: "Heal HP", description: "Restore 35 HP now.", cost: 15, costStep: 0 },
  { id: "maxHp", name: "Increase Max HP", description: "Gain 20 max HP and heal 20.", cost: 30, costStep: 10 },
  { id: "damageReductionArmor", name: "Damage Reduction Armor", description: "Reduce monster attacks by 1.", cost: 30, costStep: 15 },
  { id: "temporaryArmor", name: "Armor", description: "Gain 25 temporary HP.", cost: 20, costStep: 0 },
  { id: "barbedArmor", name: "Barbed Armor", description: "Deal 1 damage when enemies hit you.", cost: 25, costStep: 10 },
  { id: "sword", name: "Sword Upgrade", description: "Deal 1 extra damage per correct answer.", cost: 35, costStep: 15 },
];

// Repeat purchases of permanent upgrades get pricier so gold snowballs
// cannot trivialize later floors.
export function getUpgradeCost(player: PlayerState, upgrade: ShopUpgrade): number {
  if (upgrade.costStep === 0 || upgrade.id === "heal") return upgrade.cost;
  return upgrade.cost + upgrade.costStep * getItemCount(player, upgrade.id);
}

// Assumes the caller already verified the player can afford the upgrade.
export function applyShopUpgrade(player: PlayerState, id: ShopUpgradeId): PlayerState {
  const upgrade = shopUpgrades.find((candidate) => candidate.id === id);
  if (!upgrade) return player;

  const next = { ...player, gold: player.gold - getUpgradeCost(player, upgrade) };
  if (id === "heal") {
    next.hp = Math.min(next.maxHp, next.hp + 35);
    return next;
  }

  const withItem = addItem(next, id);
  if (id === "maxHp") {
    withItem.maxHp += 20;
    withItem.hp = Math.min(withItem.maxHp, withItem.hp + 20);
  }
  if (id === "damageReductionArmor") withItem.damageReductionArmor += 1;
  if (id === "temporaryArmor") withItem.temporaryHp += 25;
  if (id === "barbedArmor") withItem.barbedArmor += 1;
  if (id === "sword") withItem.swordDamage += 1;
  return withItem;
}

export const bargainOptions: BargainOption[] = [
  {
    id: "oracleLens",
    name: "Oracle Lens",
    upside: "Often the first number in an answer glows.",
    downside: "Lose 15 max HP permanently.",
  },
  {
    id: "negativeHeart",
    name: "Negative Heart",
    upside: "Gain 30 max HP and heal 30.",
    downside: "Negative numbers enter the grid.",
  },
  {
    id: "glassBlade",
    name: "Glass Blade",
    upside: "Double your sword damage.",
    downside: "Your max HP is halved.",
  },
  {
    id: "coinHex",
    name: "Coin Hex",
    upside: "Heads: gain 2 sword damage.",
    downside: "Tails: monsters deal 1 extra damage.",
  },
];

export function applyBargain(
  player: PlayerState,
  id: BargainId,
  rng: () => number = Math.random,
): { player: PlayerState; message: string } {
  let next = addItem({ ...player }, id);
  let message = bargainOptions.find((option) => option.id === id)?.name ?? "Bargain taken";

  if (id === "oracleLens") {
    next.oracleLensChance = Math.min(0.75, next.oracleLensChance + 0.25);
    next.maxHp = Math.max(1, next.maxHp - 15);
    next.hp = Math.min(next.hp, next.maxHp);
    message = "Oracle Lens taken. Some answer starts will glow.";
  }
  if (id === "negativeHeart") {
    next.maxHp += 30;
    next.hp = Math.min(next.maxHp, next.hp + 30);
    next.negativesUnlocked = true;
    message = "Negative Heart taken. More HP, stranger numbers.";
  }
  if (id === "glassBlade") {
    next.swordDamage = Math.max(1, next.swordDamage * 2);
    next.maxHp = Math.max(1, Math.floor(next.maxHp / 2));
    next.hp = Math.min(next.hp, next.maxHp);
    message = "Glass Blade taken. Damage doubled, health halved.";
  }
  if (id === "coinHex") {
    if (rng() < 0.5) {
      next.swordDamage += 2;
      message = "Coin Hex: heads. Sword damage increased.";
    } else {
      next.extraDamageTaken += 1;
      message = "Coin Hex: tails. Monsters hit harder.";
    }
  }

  return { player: next, message };
}
