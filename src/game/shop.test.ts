// Verifies shop and bargain pure functions stay aligned with their player-facing copy.
import { describe, expect, it } from "vitest";
import { applyBargain } from "./shop";
import type { PlayerState } from "./types";

function makePlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    hp: 100,
    maxHp: 100,
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
    expect(player.maxHp).toBe(100);
    expect(message).toContain("25%");
    expect(message).toContain("Negative numbers enter the grid.");
    expect(item).toBe("oracleLens");
  });

  it("Oracle Lens costs 20 max HP when negative numbers are already in the grid", () => {
    const first = applyBargain(makePlayer(), "oracleLens");
    const { player, message } = applyBargain(first.player, "oracleLens");

    expect(player.oracleLensChance).toBe(0.5);
    expect(player.negativesUnlocked).toBe(true);
    expect(player.maxHp).toBe(80);
    expect(player.hp).toBe(80);
    expect(message).toContain("Max HP reduced by 20.");
  });
});
