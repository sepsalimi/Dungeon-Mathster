// Balance regression tests backed by the Monte Carlo simulator.
// Targets: floor 1 is tougher after the +1 monster damage bump, monster
// kills still take about 5 correct answers, and a 5-floor run stays hard to finish.
import { describe, expect, it } from "vitest";
import { makeEnemy } from "./content";
import { FINAL_FLOOR, getBossDefinition } from "./progression";
import { getEnemyAttackInterval } from "./combat";
import { simulateMany, skillProfiles } from "./simulate";

const RUNS = 3000;

function profile(name: string) {
  const found = skillProfiles.find((candidate) => candidate.name === name);
  if (!found) throw new Error(`Unknown profile: ${name}`);
  return found;
}

describe("difficulty curves", () => {
  it("keeps monster and boss stats increasing with floor", () => {
    for (let floor = 1; floor < FINAL_FLOOR; floor += 1) {
      const monster = makeEnemy(false, floor);
      const nextMonster = makeEnemy(false, floor + 1);
      expect(nextMonster.hp).toBeGreaterThan(monster.hp);
      expect(nextMonster.damage).toBeGreaterThanOrEqual(monster.damage);

      const boss = getBossDefinition(floor);
      const nextBoss = getBossDefinition(floor + 1);
      expect(nextBoss.hp).toBeGreaterThan(boss.hp);
      expect(nextBoss.damage).toBeGreaterThan(boss.damage);
    }
  });

  it("keeps bosses tougher than the floor's monsters", () => {
    for (let floor = 1; floor <= FINAL_FLOOR; floor += 1) {
      const monster = makeEnemy(false, floor);
      const boss = getBossDefinition(floor);
      expect(boss.hp).toBeGreaterThan(monster.hp);
      expect(boss.damage).toBeGreaterThan(monster.damage);
    }
  });

  it("tightens the attack timer with depth but never below the cap", () => {
    expect(getEnemyAttackInterval(1)).toBe(8_000);
    for (let floor = 1; floor <= FINAL_FLOOR; floor += 1) {
      expect(getEnemyAttackInterval(floor + 1)).toBeLessThanOrEqual(getEnemyAttackInterval(floor));
      expect(getEnemyAttackInterval(floor)).toBeGreaterThanOrEqual(4_500);
    }
  });
});

describe("simulated players", () => {
  const nonGamer = simulateMany(profile("non-gamer"), RUNS);
  const casual = simulateMany(profile("casual"), RUNS);
  const skilled = simulateMany(profile("skilled"), RUNS);

  it("keeps floor 1 difficult but not impossible for non-gamers", () => {
    expect(nonGamer.clearRateByFloor[0]).toBeGreaterThanOrEqual(0.3);
  });

  it("keeps the full 5-floor run out of reach for non-gamers", () => {
    expect(nonGamer.winRate).toBeLessThanOrEqual(0.15);
  });

  it("makes floor 1 monsters take about 5 correct answers", () => {
    expect(nonGamer.avgFloor1SolvesPerMonster).toBeGreaterThanOrEqual(4.5);
    expect(nonGamer.avgFloor1SolvesPerMonster).toBeLessThanOrEqual(6.5);
  });

  it("gives casual players a comfortable floor 1 but a contested victory", () => {
    expect(casual.clearRateByFloor[0]).toBeGreaterThanOrEqual(0.95);
    expect(casual.winRate).toBeGreaterThanOrEqual(0.1);
    expect(casual.winRate).toBeLessThanOrEqual(0.7);
  });

  it("lets skilled players win most runs without a guarantee", () => {
    expect(skilled.clearRateByFloor[0]).toBeGreaterThanOrEqual(0.99);
    expect(skilled.winRate).toBeGreaterThanOrEqual(0.55);
  });

  it("prints the balance report", () => {
    for (const summary of [
      { name: "non-gamer", data: nonGamer },
      { name: "casual", data: casual },
      { name: "skilled", data: skilled },
    ]) {
      const rates = summary.data.clearRateByFloor
        .map((rate, index) => `F${index + 1} ${(rate * 100).toFixed(0)}%`)
        .join("  ");
      console.log(
        `${summary.name}: win ${(summary.data.winRate * 100).toFixed(0)}%, ` +
          `median ${summary.data.medianFloorsCleared} floors, ` +
          `f1 avg ${summary.data.avgFloor1SolvesPerMonster.toFixed(1)} solves/monster, ` +
          `${summary.data.avgFloor1FightSeconds.toFixed(0)}s/fight | ${rates}`,
      );
    }
    expect(true).toBe(true);
  });
});
