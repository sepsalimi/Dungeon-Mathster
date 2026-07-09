// Verifies floor difficulty helpers and boss rewards that shape a run.
import { describe, expect, it, vi } from "vitest";
import { addPermutationBonus, applyBossItem, getBossDefinition, getRoomPathLength } from "./progression";
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
    oraclePathNumbers: 0,
    negativesUnlocked: false,
    extraDamageTaken: 0,
    lifesteal: 0,
    permutationBonus: 0,
    items: {},
    ...overrides,
  };
}

describe("progression puzzle length rules", () => {
  it("varies normal room path length instead of always using two numbers", () => {
    vi.spyOn(Math, "random").mockReturnValueOnce(0.2).mockReturnValueOnce(0.8);

    expect(getRoomPathLength(3, 1, false)).toBe(3);
    expect(getRoomPathLength(3, 1, false)).toBe(5);

    vi.restoreAllMocks();
  });

  it("adds one answer number for permutation bargains when the grid can fit it", () => {
    expect(addPermutationBonus(3, 3, 1)).toBe(5);
    expect(addPermutationBonus(5, 3, 1)).toBe(5);
    expect(addPermutationBonus(5, 4, 1)).toBe(7);
  });

  it("keeps boss dialogue aligned with the five-door route", () => {
    expect(getBossDefinition(1).intro).toContain("Five doors");
  });

  it("gives Oracle Lens at 25% when the boss reward finds no lens", () => {
    const reward = applyBossItem(makePlayer(), 4);

    expect(reward.item).toBe("oracleLens");
    expect(reward.player.items.oracleLens).toBe(1);
    expect(reward.player.oracleLensChance).toBe(0.25);
    expect(reward.player.oraclePathNumbers).toBe(1);
  });

  it("upgrades an existing Oracle Lens to reveal a two-number path at 25%", () => {
    const reward = applyBossItem(makePlayer({ oracleLensChance: 0.25, oraclePathNumbers: 1, items: { oracleLens: 1 } }), 4);

    expect(reward.player.items.oracleLens).toBe(2);
    expect(reward.player.oracleLensChance).toBe(0.25);
    expect(reward.player.oraclePathNumbers).toBe(2);
    expect(reward.message).toContain("two-number path");
  });
});
