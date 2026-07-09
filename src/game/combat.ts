// Pure combat math shared by the game loop and the balance simulation.
import type { EnemyState, PlayerState } from "./types";

// Enemies attack on a timer. Floor 1 gives slow solvers breathing room, then the
// timer tightens by half a second per floor down to a hard cap.
export function getEnemyAttackInterval(floor: number): number {
  return Math.max(4_500, 7_500 - (floor - 1) * 500);
}

export interface EnemyAttackResult {
  player: PlayerState;
  enemyHp: number;
  damage: number;
}

export function resolveEnemyAttack(player: PlayerState, enemy: EnemyState): EnemyAttackResult {
  const damage = Math.max(1, enemy.damage - player.damageReductionArmor + player.extraDamageTaken);
  const temporaryHp = Math.max(0, player.temporaryHp - damage);
  const damageToHp = Math.max(0, damage - player.temporaryHp);
  const hp = Math.max(0, player.hp - damageToHp);
  const enemyHp = Math.max(0, enemy.hp - player.barbedArmor);

  return { player: { ...player, hp, temporaryHp }, enemyHp, damage };
}

export function applyLifesteal(player: PlayerState): PlayerState {
  if (player.lifesteal <= 0 || player.hp <= 0) return player;
  return { ...player, hp: Math.min(player.maxHp, player.hp + player.lifesteal) };
}
