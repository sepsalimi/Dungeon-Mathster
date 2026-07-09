// Unit tests for floor-1 struggle detection and the tutorial-offer pause gate.
import { describe, expect, it } from "vitest";
import { makeEnemy } from "./content";
import { isStruggleEligible, isStruggling, withStrugglePause } from "./struggle";
import type { GameState } from "./types";
import { emptyFightStats } from "./types";

function makeCombatState(overrides: Partial<GameState> = {}): GameState {
  return {
    phase: "combat",
    floor: 1,
    roomsCleared: 0,
    player: {
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
    },
    enemy: makeEnemy(false, 1),
    puzzle: null,
    doors: [],
    feedback: null,
    frozenUntil: 0,
    paused: false,
    tutorial: null,
    tutorialEnemyHitDone: false,
    showFloorScroll: true,
    pendingBossFight: false,
    fightStats: emptyFightStats(),
    struggleTutorialOffered: false,
    tutorialOffer: false,
    ...overrides,
  };
}

describe("struggle detection", () => {
  it("only applies on floor 1 for the first two monsters", () => {
    expect(isStruggleEligible(makeCombatState())).toBe(true);
    expect(isStruggleEligible(makeCombatState({ roomsCleared: 1 }))).toBe(true);
    expect(isStruggleEligible(makeCombatState({ roomsCleared: 2 }))).toBe(false);
    expect(isStruggleEligible(makeCombatState({ floor: 2 }))).toBe(false);
    expect(isStruggleEligible(makeCombatState({ enemy: makeEnemy(true, 1) }))).toBe(false);
  });

  it("does not offer again after the prompt was shown", () => {
    expect(isStruggleEligible(makeCombatState({ struggleTutorialOffered: true }))).toBe(false);
  });

  it("flags repeated misses as struggling", () => {
    const state = makeCombatState({
      fightStats: { misses: 3, hitsTaken: 0, correctHits: 0 },
    });
    expect(isStruggling(state.fightStats, state.player, state.enemy!)).toBe(true);
  });

  it("pauses combat and opens the tutorial offer when struggling", () => {
    const next = withStrugglePause(
      makeCombatState({
        fightStats: { misses: 3, hitsTaken: 0, correctHits: 0 },
      }),
    );

    expect(next.paused).toBe(true);
    expect(next.tutorialOffer).toBe(true);
    expect(next.struggleTutorialOffered).toBe(true);
  });

  it("leaves state unchanged outside the struggle window", () => {
    const state = makeCombatState({
      floor: 2,
      fightStats: { misses: 5, hitsTaken: 3, correctHits: 0 },
    });
    expect(withStrugglePause(state)).toBe(state);
  });
});
