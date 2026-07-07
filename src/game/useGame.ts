import { useCallback, useEffect, useState } from "react";
import {
  BOSS_REWARD,
  makeDoorChoices,
  makeEnemy,
  MONSTER_REWARD,
  MONSTER_ROOMS_BEFORE_BOSS,
  shopUpgrades,
} from "./content";
import { isCorrectPath, makePuzzle } from "./math";
import type { DoorChoice, GameState, PlayerState, ShopUpgradeId } from "./types";

const initialPlayer: PlayerState = {
  hp: 120,
  maxHp: 120,
  gold: 0,
  armor: 0,
  swordDamage: 1,
  freezeNextRoom: false,
};

const initialState: GameState = {
  phase: "start",
  floor: 1,
  roomsCleared: 0,
  player: initialPlayer,
  enemy: null,
  puzzle: null,
  doors: [],
  feedback: null,
  frozenUntil: 0,
};

export function useGame() {
  const [state, setState] = useState<GameState>(initialState);

  const startRun = useCallback(() => {
    setState({
      ...initialState,
      phase: "combat",
      player: { ...initialPlayer },
      enemy: makeEnemy(false),
      puzzle: makePuzzle(3),
    });
  }, []);

  const startBossFight = useCallback(() => {
    setState((current) => ({
      ...current,
      phase: "combat",
      feedback: {
        kind: "blocked",
        message: "Count Calculus raises the final grid.",
        nonce: Date.now(),
      },
    }));
  }, []);

  const submitPath = useCallback((path: string[]) => {
    setState((current) => {
      if (current.phase !== "combat" || !current.enemy || !current.puzzle) {
        return current;
      }

      const correct = isCorrectPath(path, current.puzzle.tiles, current.puzzle.target);

      if (!correct) {
        return {
          ...current,
          puzzle: makePuzzle(current.enemy.isBoss ? 4 : 3),
          feedback: {
            kind: "miss",
            message: "Miss. The dungeon shifts to a new sum.",
            nonce: Date.now(),
          },
        };
      }

      const nextHp = Math.max(0, current.enemy.hp - current.player.swordDamage);
      const defeated = nextHp <= 0;

      if (!defeated) {
        return {
          ...current,
          enemy: { ...current.enemy, hp: nextHp },
          puzzle: makePuzzle(current.enemy.isBoss ? 4 : 3),
          feedback: {
            kind: "hit",
            message: `Sword hit for ${current.player.swordDamage}.`,
            nonce: Date.now(),
          },
        };
      }

      if (current.enemy.isBoss) {
        return {
          ...current,
          phase: "victory",
          enemy: { ...current.enemy, hp: 0 },
          puzzle: null,
          player: {
            ...current.player,
            gold: current.player.gold + BOSS_REWARD,
          },
          feedback: {
            kind: "hit",
            message: "The boss falls. Floor 1 is clear.",
            nonce: Date.now(),
          },
        };
      }

      const roomsCleared = current.roomsCleared + 1;
      return {
        ...current,
        phase: "door",
        roomsCleared,
        enemy: { ...current.enemy, hp: 0 },
        puzzle: null,
        doors: makeDoorChoices(roomsCleared),
        player: {
          ...current.player,
          gold: current.player.gold + MONSTER_REWARD,
        },
        feedback: {
          kind: "hit",
          message: `Monster defeated. +${MONSTER_REWARD} gold.`,
          nonce: Date.now(),
        },
      };
    });
  }, []);

  const chooseDoor = useCallback((door: DoorChoice) => {
    if (door.kind === "shop") {
      setState((current) => ({
        ...current,
        phase: "shop",
        doors: [],
        enemy: null,
        feedback: {
          kind: "buy",
          message: "A quiet merchant opens a brass chest.",
          nonce: Date.now(),
        },
      }));
      return;
    }

    if (door.kind === "mystery") {
      setState((current) => {
        const healed = Math.min(current.player.maxHp, current.player.hp + 20);
        return {
          ...current,
          player: { ...current.player, hp: healed, gold: current.player.gold + 5 },
          feedback: {
            kind: "buy",
            message: "Mystery room: +20 HP and +5 gold.",
            nonce: Date.now(),
          },
        };
      });
      window.setTimeout(() => {
        setState((current) => {
          const shouldBoss = current.roomsCleared >= MONSTER_ROOMS_BEFORE_BOSS;
          const frozenUntil = current.player.freezeNextRoom ? Date.now() + 10_000 : 0;
          return {
            ...current,
            phase: shouldBoss ? "bossIntro" : "combat",
            enemy: makeEnemy(shouldBoss),
            puzzle: makePuzzle(shouldBoss ? 4 : 3),
            doors: [],
            frozenUntil,
            player: { ...current.player, freezeNextRoom: false },
          };
        });
      }, 850);
      return;
    }

    setState((current) => {
      const isBoss = door.kind === "boss";
      const frozenUntil = current.player.freezeNextRoom ? Date.now() + 10_000 : 0;
      return {
        ...current,
        phase: isBoss ? "bossIntro" : "combat",
        enemy: makeEnemy(isBoss),
        puzzle: makePuzzle(isBoss ? 4 : 3),
        doors: [],
        frozenUntil,
        player: { ...current.player, freezeNextRoom: false },
        feedback: isBoss
          ? {
              kind: "blocked",
              message: "The boss waits behind the iron sum gate.",
              nonce: Date.now(),
            }
          : null,
      };
    });
  }, []);

  const buyUpgrade = useCallback((id: ShopUpgradeId) => {
    const upgrade = shopUpgrades.find((candidate) => candidate.id === id);
    if (!upgrade) {
      return;
    }

    setState((current) => {
      if (current.player.gold < upgrade.cost) {
        return {
          ...current,
          feedback: {
            kind: "blocked",
            message: "Not enough gold.",
            nonce: Date.now(),
          },
        };
      }

      const player = { ...current.player, gold: current.player.gold - upgrade.cost };

      if (id === "heal") {
        player.hp = Math.min(player.maxHp, player.hp + 35);
      }
      if (id === "maxHp") {
        player.maxHp += 20;
        player.hp = Math.min(player.maxHp, player.hp + 20);
      }
      if (id === "armor") {
        player.armor += 1;
      }
      if (id === "freeze") {
        player.freezeNextRoom = true;
      }
      if (id === "sword") {
        player.swordDamage += 1;
      }

      return {
        ...current,
        player,
        feedback: {
          kind: "buy",
          message: `${upgrade.name} purchased.`,
          nonce: Date.now(),
        },
      };
    });
  }, []);

  const leaveShop = useCallback(() => {
    setState((current) => {
      const shouldBoss = current.roomsCleared >= MONSTER_ROOMS_BEFORE_BOSS;
      const frozenUntil = current.player.freezeNextRoom ? Date.now() + 10_000 : 0;

      return {
        ...current,
        phase: shouldBoss ? "bossIntro" : "combat",
        enemy: makeEnemy(shouldBoss),
        puzzle: makePuzzle(shouldBoss ? 4 : 3),
        frozenUntil,
        player: { ...current.player, freezeNextRoom: false },
        feedback: null,
      };
    });
  }, []);

  useEffect(() => {
    if (state.phase !== "combat" || !state.enemy) {
      return;
    }

    const timer = window.setInterval(() => {
      setState((current) => {
        if (current.phase !== "combat" || !current.enemy) {
          return current;
        }
        if (current.frozenUntil > Date.now()) {
          return {
            ...current,
            feedback: {
              kind: "blocked",
              message: "Freeze holds the monster still.",
              nonce: Date.now(),
            },
          };
        }

        const damage = Math.max(1, current.enemy.damage - current.player.armor);
        const hp = Math.max(0, current.player.hp - damage);

        return {
          ...current,
          phase: hp <= 0 ? "defeat" : current.phase,
          player: { ...current.player, hp },
          feedback: {
            kind: "enemy",
            message: `${current.enemy.name} hits for ${damage}.`,
            nonce: Date.now(),
          },
        };
      });
    }, 5_000);

    return () => window.clearInterval(timer);
  }, [state.phase, state.enemy?.name]);

  return {
    state,
    startRun,
    submitPath,
    chooseDoor,
    buyUpgrade,
    leaveShop,
    startBossFight,
  };
}
