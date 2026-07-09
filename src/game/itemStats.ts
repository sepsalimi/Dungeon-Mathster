// Maps owned items to live stat lines shown in HUD tooltips.
import { itemDefinitions, STARTING_SWORD_DAMAGE } from "./progression";
import type { ItemId, PlayerState } from "./types";

export interface ItemTooltipContent {
  name: string;
  description: string;
  statLine: string | null;
  count: number;
  icon: string;
}

export function getItemTooltipContent(id: ItemId, player: PlayerState): ItemTooltipContent {
  const count = player.items[id] ?? 0;
  const definition = itemDefinitions[id];

  return {
    name: definition.name,
    description: definition.description,
    statLine: getItemStatLine(id, player),
    count,
    icon: definition.icon,
  };
}

export function getItemStatLine(id: ItemId, player: PlayerState): string | null {
  switch (id) {
    case "lifesteal":
      return player.lifesteal > 0 ? `+${player.lifesteal} lifesteal` : null;
    case "sword":
      return player.swordDamage > 0 ? `Deal ${player.swordDamage} damage` : null;
    case "damageReductionArmor":
      return player.damageReductionArmor > 0 ? `-${player.damageReductionArmor} damage taken` : null;
    case "barbedArmor":
      return player.barbedArmor > 0 ? `+${player.barbedArmor} thorns` : null;
    case "goldBonus":
      return player.goldBonus > 0 ? `+${player.goldBonus} gold` : null;
    case "maxHp":
      return `${player.maxHp} max HP`;
    case "temporaryArmor":
      return player.temporaryHp > 0 ? `${player.temporaryHp} temp HP` : "+25 temp HP per buy";
    case "oracleLens":
      return player.oracleLensChance > 0 ? `${Math.round(player.oracleLensChance * 100)}% glow chance` : null;
    case "glassBlade":
      return player.swordDamage > STARTING_SWORD_DAMAGE ? `Deal ${player.swordDamage} damage` : null;
    case "coinHex":
      if (player.extraDamageTaken > 0) return `+${player.extraDamageTaken} enemy damage`;
      if (player.swordDamage > STARTING_SWORD_DAMAGE) return `Deal ${player.swordDamage} damage`;
      return null;
    case "longEquation":
      return player.permutationBonus > 0 ? `+${player.permutationBonus} answer length` : null;
    default:
      return null;
  }
}
