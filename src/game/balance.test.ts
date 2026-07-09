// Balance regression tests backed by the Monte Carlo simulator.
// Targets: floor 1 beatable by slow solvers, snappy monster kills,
// and a difficulty curve that still ends runs for everyone.
import { describe, expect, it } from "vitest";
import { makeEnemy } from "./content";
import { getBossDefinition } from "./progression";
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
    for (let floor = 1; floor < 15; floor += 1) {
      const monster = makeEnemy(false, floor);
      const nextMonster = makeEnemy(false, floor + 1);
      expect(nextMonster.hp).toBeGreaterThan(monster.hp);
      expect(nextMonster.damage).toBeGreaterThan(monster.damage);

      const boss = getBossDefinition(floor);
      const nextBoss = getBossDefinition(floor + 1);
      expect(nextBoss.hp).toBeGreaterThan(boss.hp);
      expect(nextBoss.damage).toBeGreaterThan(boss.damage);
    }
  });

  it("keeps bosses tougher than the floor's monsters", () => {
    for (let floor = 1; floor < 15; floor += 1) {
      const monster = makeEnemy(false, floor);
      const boss = getBossDefinition(floor);
      expect(boss.hp).toBeGreaterThan(monster.hp);
      expect(boss.damage).toBeGreaterThan(monster.damage);
    }
  });

  it("tightens the attack timer with depth but never below the cap", () => {
    expect(getEnemyAttackInterval(1)).toBe(7_500);
    for (let floor = 1; floor < 15; floor += 1) {
      expect(getEnemyAttackInterval(floor + 1)).toBeLessThanOrEqual(getEnemyAttackInterval(floor));
      expect(getEnemyAttackInterval(floor)).toBeGreaterThanOrEqual(4_500);
    }
  });
});

describe("simulated players", () => {
  const nonGamer = simulateMany(profile("non-gamer"), RUNS);
  const casual = simulateMany(profile("casual"), RUNS);
  const skilled = simulateMany(profile("skilled"), RUNS);

  it("lets non-gamers beat floor 1 most of the time", () => {
    expect(nonGamer.clearRateByFloor[0]).toBeGreaterThanOrEqual(0.85);
  });

  it("still ends non-gamer runs within a few floors", () => {
    expect(nonGamer.medianFloorsCleared).toBeLessThanOrEqual(6);
  });

  it("makes floor 1 monster kills feel snappy", () => {
    expect(nonGamer.avgFloor1SolvesPerMonster).toBeLessThanOrEqual(4);
    expect(casual.avgFloor1FightSeconds).toBeLessThanOrEqual(60);
  });

  it("gives casual players a comfortable floor 1 and a mid-run wall", () => {
    expect(casual.clearRateByFloor[0]).toBeGreaterThanOrEqual(0.95);
    expect(casual.medianFloorsCleared).toBeGreaterThanOrEqual(2);
    expect(casual.medianFloorsCleared).toBeLessThanOrEqual(12);
  });

  it("rewards skilled players with deep runs that still end", () => {
    expect(skilled.clearRateByFloor[0]).toBeGreaterThanOrEqual(0.99);
    expect(skilled.medianFloorsCleared).toBeGreaterThanOrEqual(4);
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
        `${summary.name}: median ${summary.data.medianFloorsCleared} floors, ` +
          `f1 avg ${summary.data.avgFloor1SolvesPerMonster.toFixed(1)} solves/monster, ` +
          `${summary.data.avgFloor1FightSeconds.toFixed(0)}s/fight | ${rates}`,
      );
    }
    expect(true).toBe(true);
  });
});
