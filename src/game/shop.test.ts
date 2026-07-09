// Verifies shop and bargain pure functions stay aligned with their player-facing copy.
import { describe, expect, it } from "vitest";
import { applyBargain } from "./shop";
import type { PlayerState } from "./types";

function makePlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    hp: 120,
    maxHp: 120,
    temporaryHp: 0,
    gold: 0,
    goldBonus: 0,
    damageReductionArmor: 0,
    barbedArmor: 0,
    swordDamage: 2,
    oracleLensChance: 0,
    negativesUnlocked: false,
    extraDamageTaken: 0,
    lifesteal: 0,
    permutationBonus: 0,
    items: {},
    ...overrides,
  };
}

describe("bargain options", () => {
  it("Oracle Lens adds a 25% glow chance and unlocks negative numbers", () => {
    const { player, message, item } = applyBargain(makePlayer(), "oracleLens");

    expect(player.oracleLensChance).toBe(0.25);
    expect(player.negativesUnlocked).toBe(true);
    expect(player.maxHp).toBe(120);
    expect(message).toContain("25%");
    expect(message).toContain("Negative numbers enter the grid.");
    expect(item).toBe("oracleLens");
  });

  it("Negative Heart adds a monster answer permutation instead of max HP", () => {
    const { player, message, item } = applyBargain(makePlayer(), "negativeHeart");

    expect(player.permutationBonus).toBe(1);
    expect(player.negativesUnlocked).toBe(true);
    expect(player.maxHp).toBe(120);
    expect(player.hp).toBe(120);
    expect(message).toContain("Monster answers grow longer.");
    expect(item).toBe("negativeHeart");
  });
});
