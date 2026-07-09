// Detects when a player is struggling on floor 1 and should be offered the tutorial.
import type { EnemyState, FightStats, GameState, PlayerState } from "./types";

export function isStruggleEligible(state: GameState): boolean {
  return (
    state.phase === "combat" &&
    state.floor === 1 &&
    state.roomsCleared < 2 &&
    !state.enemy?.isBoss &&
    !state.struggleTutorialOffered &&
    !state.tutorial &&
    !state.paused
  );
}

export function isStruggling(fightStats: FightStats, player: PlayerState, enemy: EnemyState): boolean {
  if (fightStats.misses >= 3) return true;
  if (fightStats.hitsTaken >= 2) return true;
  if (fightStats.correctHits >= 6 && enemy.hp > 0) return true;
  if (player.hp < player.maxHp * 0.5) return true;
  return false;
}

export function withStrugglePause(state: GameState): GameState {
  if (!state.enemy || !isStruggleEligible(state) || !isStruggling(state.fightStats, state.player, state.enemy)) {
    return state;
  }

  return {
    ...state,
    paused: true,
    tutorialOffer: true,
    struggleTutorialOffered: true,
    feedback: { kind: "pause", message: "Paused", nonce: Date.now() },
  };
}
