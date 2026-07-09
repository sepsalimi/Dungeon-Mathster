// Monte Carlo run simulator for balance tuning. Reuses the real combat, shop,
// and progression code so the numbers here match the shipped game exactly.
// Player skill is modeled as puzzle solve time plus accuracy per attempt.
import { applyLifesteal, getEnemyAttackInterval, resolveEnemyAttack } from "./combat";
import { makeDoorChoices, makeEnemy, MONSTER_REWARD, MONSTER_ROOMS_BEFORE_BOSS, MYSTERY_GOLD, MYSTERY_HEAL } from "./content";
import { FINAL_FLOOR, applyBossItem, getBossReward, getItemCount, STARTING_MAX_HP, STARTING_SWORD_DAMAGE } from "./progression";
import { applyBargain, applyShopUpgrade, getUpgradeCost, shopUpgrades } from "./shop";
import type { EnemyState, PlayerState, ShopUpgradeId } from "./types";

export interface SkillProfile {
  name: string;
  // Seconds per solve attempt on a floor 1 grid, before complexity multipliers.
  solveTimeMean: number;
  solveTimeSd: number;
  // Chance an attempt submits the correct path.
  accuracy: number;
  // Whether this player risks the cursed altar when offered.
  takesBargains: boolean;
}

export interface RunResult {
  won: boolean;
  floorsCleared: number;
  floor1MonsterSolves: number[];
  floor1FightSeconds: number[];
}

export interface SimulationSummary {
  runs: number;
  winRate: number;
  medianFloorsCleared: number;
  clearRateByFloor: number[];
  avgFloor1SolvesPerMonster: number;
  avgFloor1FightSeconds: number;
}

const MIN_ATTEMPT_SECONDS = 1.5;

function makeSimPlayer(): PlayerState {
  return {
    hp: STARTING_MAX_HP,
    maxHp: STARTING_MAX_HP,
    temporaryHp: 0,
    gold: 0,
    goldBonus: 0,
    damageReductionArmor: 0,
    barbedArmor: 0,
    swordDamage: STARTING_SWORD_DAMAGE,
    oracleLensChance: 0,
    negativesUnlocked: false,
    extraDamageTaken: 0,
    lifesteal: 0,
    permutationBonus: 0,
    items: {},
  };
}

// Higher floors slow players down: multiplication arrives on floor 3,
// 5-tile paths on floor 4, and bosses fight on a larger 4x4 grid.
function solveTimeMultiplier(floor: number, isBoss: boolean): number {
  let multiplier = 1;
  if (floor >= 3) multiplier *= 1.2;
  if (floor >= 4) multiplier *= 1.25;
  if (isBoss) multiplier *= 1.25;
  return multiplier;
}

function accuracyMultiplier(floor: number, isBoss: boolean): number {
  let multiplier = 1;
  if (floor >= 3) multiplier *= 0.97;
  if (floor >= 4) multiplier *= 0.95;
  if (isBoss) multiplier *= 0.95;
  return multiplier;
}

function sampleNormal(mean: number, sd: number): number {
  const u1 = Math.max(Math.random(), 1e-9);
  const u2 = Math.random();
  return mean + sd * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

interface FightResult {
  player: PlayerState;
  won: boolean;
  solves: number;
  seconds: number;
}

function simulateFight(startPlayer: PlayerState, enemy: EnemyState, floor: number, profile: SkillProfile): FightResult {
  const interval = getEnemyAttackInterval(floor) / 1000;
  const attemptMean = profile.solveTimeMean * solveTimeMultiplier(floor, enemy.isBoss);
  const attemptSd = profile.solveTimeSd * solveTimeMultiplier(floor, enemy.isBoss);
  const accuracy = profile.accuracy * accuracyMultiplier(floor, enemy.isBoss);

  let player = startPlayer;
  let enemyHp = enemy.hp;
  let time = 0;
  let nextAttack = interval;
  let solves = 0;

  while (true) {
    const attempt = Math.max(MIN_ATTEMPT_SECONDS, sampleNormal(attemptMean, attemptSd));

    while (nextAttack <= time + attempt) {
      const result = resolveEnemyAttack(player, { ...enemy, hp: enemyHp });
      player = result.player;
      enemyHp = result.enemyHp;
      nextAttack += interval;
      if (player.hp <= 0) return { player, won: false, solves, seconds: nextAttack - interval };
      if (enemyHp <= 0) return { player, won: true, solves, seconds: nextAttack - interval };
    }

    time += attempt;
    if (Math.random() < accuracy) {
      solves += 1;
      enemyHp = Math.max(0, enemyHp - player.swordDamage);
      player = applyLifesteal(player);
      if (enemyHp <= 0) return { player, won: true, solves, seconds: time };
    }
  }
}

// A reasonable player: heal when hurting, then push sword damage to keep kills
// fast, then armor, then max HP with whatever gold is left.
function pickPurchase(player: PlayerState, floor: number): ShopUpgradeId | null {
  const canAfford = (id: ShopUpgradeId) => {
    const upgrade = shopUpgrades.find((candidate) => candidate.id === id);
    return upgrade !== undefined && player.gold >= getUpgradeCost(player, upgrade);
  };

  if (player.hp < player.maxHp * 0.6 && player.hp <= player.maxHp - 35 && canAfford("heal")) return "heal";
  if (player.swordDamage < 2 + floor && canAfford("sword")) return "sword";
  if (player.damageReductionArmor < Math.ceil(floor / 2) && canAfford("damageReductionArmor")) return "damageReductionArmor";
  if (canAfford("maxHp")) return "maxHp";
  if (player.hp <= player.maxHp - 35 && canAfford("heal")) return "heal";
  return null;
}

function visitShop(player: PlayerState, floor: number): PlayerState {
  let next = player;
  let purchase = pickPurchase(next, floor);
  while (purchase !== null) {
    next = applyShopUpgrade(next, purchase);
    purchase = pickPurchase(next, floor);
  }
  return next;
}

function visitBargain(player: PlayerState): PlayerState {
  const id = getItemCount(player, "negativeHeart") === 0 ? "negativeHeart" : "coinHex";
  return applyBargain(player, id).player;
}

export function simulateRun(profile: SkillProfile): RunResult {
  let player = makeSimPlayer();
  let floor = 1;
  let roomsCleared = 0;
  const floor1MonsterSolves: number[] = [];
  const floor1FightSeconds: number[] = [];

  while (true) {
    const isBossRoom = roomsCleared >= MONSTER_ROOMS_BEFORE_BOSS;
    const enemy = makeEnemy(isBossRoom, floor);
    const result = simulateFight(player, enemy, floor, profile);
    player = result.player;

    if (floor === 1) {
      floor1FightSeconds.push(result.seconds);
      if (!enemy.isBoss) floor1MonsterSolves.push(result.solves);
    }

    if (!result.won) {
      return { won: false, floorsCleared: floor - 1, floor1MonsterSolves, floor1FightSeconds };
    }

    if (isBossRoom) {
      if (floor >= FINAL_FLOOR) {
        return { won: true, floorsCleared: FINAL_FLOOR, floor1MonsterSolves, floor1FightSeconds };
      }
      player = applyBossItem({ ...player, gold: player.gold + getBossReward(floor) }, floor).player;
      floor += 1;
      roomsCleared = 0;
      continue;
    }

    roomsCleared += 1;
    player = { ...player, gold: player.gold + MONSTER_REWARD + player.goldBonus };

    if (roomsCleared < MONSTER_ROOMS_BEFORE_BOSS) {
      const usefulDoor = makeDoorChoices(roomsCleared).find((door) => door.kind !== "monster");
      if (usefulDoor?.kind === "shop") player = visitShop(player, floor);
      if (usefulDoor?.kind === "mystery") {
        player = {
          ...player,
          hp: Math.min(player.maxHp, player.hp + MYSTERY_HEAL),
          gold: player.gold + MYSTERY_GOLD,
        };
      }
      if (usefulDoor?.kind === "bargain" && profile.takesBargains) player = visitBargain(player);
    }
  }
}

export function simulateMany(profile: SkillProfile, runs: number): SimulationSummary {
  const floorsCleared: number[] = [];
  let wins = 0;
  let solveSum = 0;
  let solveCount = 0;
  let fightSecondsSum = 0;
  let fightCount = 0;

  for (let run = 0; run < runs; run += 1) {
    const result = simulateRun(profile);
    floorsCleared.push(result.floorsCleared);
    if (result.won) wins += 1;
    for (const solves of result.floor1MonsterSolves) {
      solveSum += solves;
      solveCount += 1;
    }
    for (const seconds of result.floor1FightSeconds) {
      fightSecondsSum += seconds;
      fightCount += 1;
    }
  }

  floorsCleared.sort((a, b) => a - b);
  const clearRateByFloor: number[] = [];
  for (let floor = 1; floor <= FINAL_FLOOR; floor += 1) {
    clearRateByFloor.push(floorsCleared.filter((cleared) => cleared >= floor).length / runs);
  }

  return {
    runs,
    winRate: wins / runs,
    medianFloorsCleared: floorsCleared[Math.floor(runs / 2)],
    clearRateByFloor,
    avgFloor1SolvesPerMonster: solveCount === 0 ? 0 : solveSum / solveCount,
    avgFloor1FightSeconds: fightCount === 0 ? 0 : fightSecondsSum / fightCount,
  };
}

export const skillProfiles: SkillProfile[] = [
  { name: "non-gamer", solveTimeMean: 12, solveTimeSd: 4, accuracy: 0.85, takesBargains: false },
  { name: "casual", solveTimeMean: 8, solveTimeSd: 3, accuracy: 0.9, takesBargains: true },
  { name: "skilled", solveTimeMean: 4.5, solveTimeSd: 1.5, accuracy: 0.96, takesBargains: true },
];
