// Verifies item tooltip stat lines reflect live player bonuses.
import { describe, expect, it } from "vitest";
import { getItemStatLine, getItemTooltipContent } from "./itemStats";
import type { PlayerState } from "./types";

const basePlayer: PlayerState = {
  hp: 100,
  maxHp: 100,
  temporaryHp: 0,
  gold: 0,
  goldBonus: 0,
  damageReductionArmor: 0,
  barbedArmor: 0,
  swordDamage: 2,
  oracleLensChance: 0,
  oraclePathNumbers: 0,
  negativesUnlocked: false,
  extraDamageTaken: 0,
  lifesteal: 0,
  permutationBonus: 0,
  items: {},
};

describe("item tooltip stats", () => {
  it("shows lifesteal bonus as a compact stat line", () => {
    const player = { ...basePlayer, lifesteal: 2, items: { lifesteal: 1 } };
    expect(getItemStatLine("lifesteal", player)).toBe("+2 lifesteal");
  });

  it("includes name, description, and stat line in tooltip content", () => {
    const player = { ...basePlayer, lifesteal: 2, items: { lifesteal: 1 } };
    expect(getItemTooltipContent("lifesteal", player)).toEqual({
      name: "Lifesteal",
      description: "Heal 2 HP on every hit.",
      statLine: "+2 lifesteal",
      count: 1,
      icon: "fang",
    });
  });

  it("shows stacked armor reduction as one total", () => {
    const player = { ...basePlayer, damageReductionArmor: 2, items: { damageReductionArmor: 2 } };
    expect(getItemStatLine("damageReductionArmor", player)).toBe("-2 damage taken");
  });

  it("shows shield HP for the renamed temporary armor item", () => {
    const player = { ...basePlayer, temporaryHp: 25, items: { temporaryArmor: 1 } };
    expect(getItemTooltipContent("temporaryArmor", player)).toEqual({
      name: "Shield",
      description: "Gain temporary shield HP.",
      statLine: "25 shield HP",
      count: 1,
      icon: "shield",
    });
  });

  it("shows when Oracle Lens reveals a two-number path", () => {
    const player = { ...basePlayer, oracleLensChance: 0.25, oraclePathNumbers: 2, items: { oracleLens: 2 } };
    expect(getItemStatLine("oracleLens", player)).toBe("25% two-number path");
  });
});
