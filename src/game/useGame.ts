// Game state hook: run lifecycle, combat loop, doors, shop, bargains, and audio.
import { useCallback, useEffect, useRef, useState } from "react";
import {
  nextSoundLevel,
  pauseAudio,
  playBossDialogTick as playBossDialogTickSound,
  playFeedback,
  primeAudio,
  startMusic,
  stopMusic,
  type MusicState,
  type MusicTheme,
} from "./audio";
import {
  makeDoorChoices,
  makeEnemy,
  MONSTER_REWARD,
  MONSTER_ROOMS_BEFORE_BOSS,
  MYSTERY_GOLD,
  MYSTERY_HEAL,
} from "./content";
import { applyLifesteal, getEnemyAttackInterval, resolveEnemyAttack } from "./combat";
import { isCorrectPath, makePuzzle } from "./math";
import { makeTutorialDoors, makeTutorialEnemy } from "./tutorial";
import {
  FINAL_FLOOR,
  STARTING_MAX_HP,
  STARTING_SWORD_DAMAGE,
  addPermutationBonus,
  applyBossItem,
  getBossReward,
  getFloorOperators,
  getRoomPathLength,
} from "./progression";
import { applyBargain, applyShopUpgrade, getShopRewardItem, getUpgradeCost, shopUpgrades } from "./shop";
import type { BargainId, DoorChoice, GameState, PlayerState, ShopUpgradeId, SoundLevel } from "./types";

const initialPlayer: PlayerState = {
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
  paused: false,
  tutorial: null,
  tutorialEnemyHitDone: false,
  showFloorScroll: true,
  floorIntroNonce: 0,
  pendingBossFight: false,
};

const REWARD_TRANSITION_DELAY = 1_550;
const TUTORIAL_REWARD_TRANSITION_DELAY = 4_400;
export function useGame() {
  const [state, setState] = useState<GameState>(initialState);
  const [soundLevel, setSoundLevel] = useState<SoundLevel>("loud");
  const audioContext = useRef<AudioContext | null>(null);
  const music = useRef<MusicState | null>(null);
  const soundLevelRef = useRef<SoundLevel>("loud");
  const musicTheme = useRef<MusicTheme>("fight");

  const makeRunPuzzle = useCallback((size: number, player: PlayerState, floor: number, isBoss = false) => {
    const pathLength = getRoomPathLength(size, floor, isBoss);
    return makePuzzle(size, {
      allowNegative: player.negativesUnlocked,
      operators: getFloorOperators(floor),
      pathLength: addPermutationBonus(pathLength, size, player.permutationBonus),
    });
  }, []);

  const ensureAudio = useCallback((theme?: MusicTheme) => {
    if (theme) musicTheme.current = theme;
    primeAudio(audioContext);
    if (theme && music.current?.theme !== theme) stopMusic(music);
    startMusic(audioContext, music, soundLevelRef, musicTheme.current);
  }, []);

  const startRun = useCallback((withTutorial = false) => {
    ensureAudio("fight");
    window.history.replaceState({ dungeonMathster: true }, "");
    window.history.pushState({ dungeonMathsterPause: true }, "");
    setState(makeNewRunState(withTutorial));
  }, [ensureAudio]);

  const confirmFloorReady = useCallback(() => {
    ensureAudio("fight");
    setState((current) => {
      return startSpecificFight(
        {
          ...current,
          tutorialEnemyHitDone: false,
        },
        current.pendingBossFight,
        makeRunPuzzle,
      );
    });
  }, [ensureAudio, makeRunPuzzle]);

  const pauseGame = useCallback(() => {
    setState((current) => {
      if (current.phase === "start" || current.phase === "victory" || current.phase === "defeat" || current.paused) {
        return current;
      }
      pauseAudio(audioContext, music);
      return { ...current, paused: true, feedback: { kind: "pause", message: "Paused", nonce: Date.now() } };
    });
  }, []);

  const resumeGame = useCallback(() => {
    ensureAudio(musicTheme.current);
    window.history.pushState({ dungeonMathsterPause: true }, "");
    setState((current) => ({ ...current, paused: false, feedback: null }));
  }, [ensureAudio]);

  const cycleSoundLevel = useCallback(() => {
    setSoundLevel((current) => {
      const next = nextSoundLevel(current);
      soundLevelRef.current = next;
      if (next === "mute") {
        stopMusic(music);
      } else {
        stopMusic(music);
        primeAudio(audioContext);
        startMusic(audioContext, music, soundLevelRef, musicTheme.current);
      }
      return next;
    });
  }, []);

  const playBossDialogTick = useCallback((index: number) => {
    playBossDialogTickSound(audioContext, soundLevelRef, index);
  }, []);

  const startBossFight = useCallback(() => {
    ensureAudio("boss");
    setState((current) => ({
      ...current,
      phase: "combat",
      paused: false,
      feedback: { kind: "blocked", message: `${current.enemy?.name ?? "The boss"} raises the final grid.`, nonce: Date.now() },
    }));
  }, [ensureAudio]);

  const submitPath = useCallback((path: string[]) => {
    ensureAudio(musicTheme.current);
    setState((current) => {
      if (current.paused || current.phase !== "combat" || !current.enemy || !current.puzzle) return current;
      if (current.tutorial === "finish" || current.tutorial === "enemyHit") {
        return {
          ...current,
          feedback: { kind: "blocked", message: "Wait for the enemy to strike your health bar.", nonce: Date.now() },
        };
      }

      const correct = isCorrectPath(path, current.puzzle.tiles, current.puzzle.target);
      const gridSize = current.enemy.isBoss ? 4 : 3;

      if (!correct) {
        return {
          ...current,
          puzzle: makeRunPuzzle(gridSize, current.player, current.floor, current.enemy.isBoss),
          feedback: { kind: "miss", message: "MISS", nonce: Date.now() },
        };
      }

      const nextHp = Math.max(0, current.enemy.hp - current.player.swordDamage);
      const healedPlayer = applyLifesteal(current.player);

      if (nextHp > 0) {
        return {
          ...current,
          enemy: { ...current.enemy, hp: nextHp },
          player: healedPlayer,
          puzzle: makeRunPuzzle(gridSize, healedPlayer, current.floor, current.enemy.isBoss),
          feedback: { kind: "hit", message: "", nonce: Date.now(), amount: current.player.swordDamage },
          tutorial: current.tutorial === "swipe" ? "finish" : current.tutorial,
        };
      }

      if (current.enemy.isBoss) {
        const bossGold = getBossReward(current.floor);

        if (current.floor >= FINAL_FLOOR) {
          return {
            ...current,
            phase: "victory",
            enemy: { ...current.enemy, hp: 0 },
            puzzle: null,
            doors: [],
            player: { ...healedPlayer, gold: healedPlayer.gold + bossGold },
            feedback: null,
          };
        }

        const bossReward = applyBossItem({ ...healedPlayer, gold: healedPlayer.gold + bossGold }, current.floor);
        const nextFloor = current.floor + 1;
        const nonce = Date.now();
        window.setTimeout(() => {
          setState((scheduled) => {
            if (scheduled.feedback?.nonce !== nonce) return scheduled;
            return {
              ...scheduled,
              phase: "door",
              floor: nextFloor,
              roomsCleared: 0,
              enemy: null,
              puzzle: null,
              doors: makeDoorChoices(0),
              feedback: {
                kind: "buy",
                message: `${bossReward.message} Floor ${nextFloor} opens. +${bossGold} gold.`,
                nonce: Date.now(),
              },
            };
          });
        }, REWARD_TRANSITION_DELAY);
        return {
          ...current,
          enemy: null,
          puzzle: null,
          doors: [],
          player: bossReward.player,
          feedback: {
            kind: "buy",
            message: `${bossReward.message} Floor ${nextFloor} opens. +${bossGold} gold.`,
            nonce,
            rewards: [
              { kind: "gold", amount: bossGold },
              { kind: "item", itemId: bossReward.item },
            ],
          },
        };
      }

      const roomsCleared = current.roomsCleared + 1;
      const reward = MONSTER_REWARD + healedPlayer.goldBonus;
      const nonce = Date.now();
      window.setTimeout(() => {
        setState((scheduled) => {
          if (scheduled.feedback?.nonce !== nonce) return scheduled;
          return {
            ...scheduled,
            phase: "door",
            roomsCleared,
            enemy: null,
            puzzle: null,
            doors: scheduled.tutorial ? makeTutorialDoors() : makeDoorChoices(roomsCleared),
            tutorial: scheduled.tutorial ? "door" : null,
            feedback: {
              kind: "buy",
              message: `Monster defeated. +${reward} gold.`,
              nonce: Date.now(),
            },
          };
        });
      }, current.tutorial ? TUTORIAL_REWARD_TRANSITION_DELAY : REWARD_TRANSITION_DELAY);
      return {
        ...current,
        enemy: null,
        puzzle: null,
        doors: [],
        player: { ...healedPlayer, gold: healedPlayer.gold + reward },
        tutorial: current.tutorial ? "gold" : null,
        feedback: {
          kind: "hit",
          message: `Monster defeated. +${reward} gold.`,
          nonce,
          amount: current.player.swordDamage,
          rewards: [{ kind: "gold", amount: reward }],
        },
      };
    });
  }, [ensureAudio, makeRunPuzzle]);

  const chooseDoor = useCallback((door: DoorChoice) => {
    ensureAudio(getDoorMusicTheme(door.kind));
    if (door.kind === "shop") {
      setState((current) => ({
        ...current,
        phase: "shop",
        paused: false,
        doors: [],
        enemy: null,
        tutorial: current.tutorial === "door" ? "shop" : current.tutorial,
        feedback: { kind: "buy", message: "A quiet merchant opens a brass chest.", nonce: Date.now() },
      }));
      return;
    }

    if (door.kind === "bargain") {
      setState((current) => ({
        ...current,
        phase: "bargain",
        paused: false,
        doors: [],
        enemy: null,
        puzzle: null,
        feedback: { kind: "blocked", message: "A cursed altar offers power for pain.", nonce: Date.now() },
      }));
      return;
    }

    if (door.kind === "mystery") {
      setState((current) => ({
        ...current,
        doors: [],
        player: {
          ...current.player,
          hp: Math.min(current.player.maxHp, current.player.hp + MYSTERY_HEAL),
          gold: current.player.gold + MYSTERY_GOLD,
        },
        feedback: {
          kind: "buy",
          message: `Mystery room: +${MYSTERY_HEAL} HP and +${MYSTERY_GOLD} gold.`,
          nonce: Date.now(),
          rewards: [{ kind: "gold", amount: MYSTERY_GOLD }],
        },
      }));
      window.setTimeout(() => setState((current) => beginFightEntry({ ...current, feedback: null }, false, makeRunPuzzle)), 1_800);
      return;
    }

    setState((current) => beginFightEntry(current, door.kind === "boss", makeRunPuzzle));
  }, [ensureAudio, makeRunPuzzle]);

  const takeBargain = useCallback((id: BargainId) => {
    ensureAudio("bargain");
    setState((current) => {
      const { player, message, item } = applyBargain(current.player, id);
      const shouldBoss = current.roomsCleared >= MONSTER_ROOMS_BEFORE_BOSS;
      return beginFightEntry(
        {
          ...current,
          player,
          feedback: {
            kind: "buy",
            message,
            nonce: Date.now(),
            rewards: item ? [{ kind: "item", itemId: item }] : undefined,
          },
        },
        shouldBoss,
        makeRunPuzzle,
      );
    });
  }, [ensureAudio, makeRunPuzzle]);

  const buyUpgrade = useCallback((id: ShopUpgradeId) => {
    ensureAudio("shop");
    const upgrade = shopUpgrades.find((candidate) => candidate.id === id);
    if (!upgrade) return;

    setState((current) => {
      if (current.tutorial === "shop" && id !== "heal") {
        return { ...current, feedback: { kind: "blocked", message: "Buy Heal HP first.", nonce: Date.now() } };
      }

      const cost = getUpgradeCost(current.player, upgrade);
      if (current.player.gold < cost) {
        return { ...current, feedback: { kind: "blocked", message: "Not enough gold.", nonce: Date.now() } };
      }

      const rewardItem = getShopRewardItem(id);
      const player = applyShopUpgrade(current.player, id);
      if (current.tutorial === "shop" && id === "heal") {
        return {
          ...current,
          tutorial: "healthBought",
          player,
          feedback: {
            kind: "buy",
            message: `Heal HP purchased: -${cost}g. HP ${current.player.hp}/${current.player.maxHp} -> ${player.hp}/${player.maxHp}.`,
            nonce: Date.now(),
          },
        };
      }

      return {
        ...current,
        player,
        feedback: {
          kind: "buy",
          message: `${upgrade.name} purchased.`,
          nonce: Date.now(),
          rewards: rewardItem ? [{ kind: "item", itemId: rewardItem }] : undefined,
        },
      };
    });
  }, [ensureAudio]);

  const leaveShop = useCallback(() => {
    ensureAudio("fight");
    setState((current) => {
      if (current.tutorial === "shop") {
        return { ...current, feedback: { kind: "blocked", message: "Buy Heal HP first.", nonce: Date.now() } };
      }

      const tutorialEnding = current.tutorial === "healthBought";
      if (tutorialEnding) return makeNewRunState(false);

      return startNextFight({ ...current, feedback: null }, makeRunPuzzle);
    });
  }, [ensureAudio, makeRunPuzzle]);

  const skipTutorial = useCallback(() => {
    setState(makeNewRunState(false));
  }, []);

  useEffect(() => {
    if (state.tutorial !== "finish") return;
    const timer = window.setTimeout(() => {
      setState((current) => (current.tutorial === "finish" ? { ...current, tutorial: "enemyHit" } : current));
    }, 2_200);
    return () => window.clearTimeout(timer);
  }, [state.tutorial]);

  useEffect(() => {
    if (state.tutorial !== "enemyHit" || state.tutorialEnemyHitDone || !state.enemy) return;
    const timer = window.setTimeout(() => {
      setState((current) => {
        if (current.tutorial !== "enemyHit" || current.tutorialEnemyHitDone || !current.enemy) return current;
        const { player, enemyHp, damage } = resolveEnemyAttack(current.player, current.enemy);
        return {
          ...current,
          player,
          enemy: { ...current.enemy, hp: enemyHp },
          tutorialEnemyHitDone: true,
          tutorial: "killEnemy",
          feedback: { kind: "enemy", message: "", nonce: Date.now(), amount: damage },
        };
      });
    }, 2_400);
    return () => window.clearTimeout(timer);
  }, [state.tutorial, state.tutorialEnemyHitDone, state.enemy?.name]);

  useEffect(() => {
    const onPopState = () => pauseGame();
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [pauseGame]);

  useEffect(() => {
    if (state.feedback) playFeedback(audioContext, state.feedback, soundLevelRef);
  }, [state.feedback?.nonce]);

  useEffect(() => {
    if (state.phase === "defeat" || state.phase === "victory" || state.phase === "start") stopMusic(music);
  }, [state.phase]);

  useEffect(() => {
    const nextTheme = getMusicTheme(state);
    if (!nextTheme) return;
    musicTheme.current = nextTheme;
    if (!audioContext.current || soundLevelRef.current === "mute") return;
    if (music.current?.theme !== nextTheme) {
      stopMusic(music);
      startMusic(audioContext, music, soundLevelRef, nextTheme);
    }
  }, [state.phase, state.enemy?.isBoss]);

  useEffect(() => {
    if (state.phase !== "combat" || !state.enemy || state.paused || state.tutorial) return;

    const timer = window.setInterval(() => {
      setState((current) => {
        if (current.paused || current.phase !== "combat" || !current.enemy) return current;
        const { player, enemyHp, damage } = resolveEnemyAttack(current.player, current.enemy);
        if (player.hp <= 0) stopMusic(music);

        if (player.hp > 0 && enemyHp <= 0 && current.player.barbedArmor > 0) {
          if (current.enemy.isBoss) {
            const bossGold = getBossReward(current.floor);

            if (current.floor >= FINAL_FLOOR) {
              return {
                ...current,
                phase: "victory",
                enemy: { ...current.enemy, hp: 0 },
                puzzle: null,
                doors: [],
                player: { ...player, gold: player.gold + bossGold },
                feedback: null,
              };
            }

            const bossReward = applyBossItem({ ...player, gold: player.gold + bossGold }, current.floor);
            const nextFloor = current.floor + 1;
            return {
              ...current,
              phase: "door",
              floor: nextFloor,
              roomsCleared: 0,
              enemy: { ...current.enemy, hp: 0 },
              puzzle: null,
              doors: makeDoorChoices(0),
              player: bossReward.player,
              feedback: {
                kind: "buy",
                message: `Barbed Armor defeated the boss. ${bossReward.message} Floor ${nextFloor} opens.`,
                nonce: Date.now(),
                rewards: [
                  { kind: "gold", amount: bossGold },
                  { kind: "item", itemId: bossReward.item },
                ],
              },
            };
          }

          const roomsCleared = current.roomsCleared + 1;
          const reward = MONSTER_REWARD + player.goldBonus;
          return {
            ...current,
            phase: "door",
            roomsCleared,
            enemy: { ...current.enemy, hp: 0 },
            puzzle: null,
            doors: makeDoorChoices(roomsCleared),
            player: { ...player, gold: player.gold + reward },
            feedback: {
              kind: "buy",
              message: `Barbed Armor defeated the monster. +${reward} gold.`,
              nonce: Date.now(),
              rewards: [{ kind: "gold", amount: reward }],
            },
          };
        }

        return {
          ...current,
          phase: player.hp <= 0 ? "defeat" : current.phase,
          enemy: { ...current.enemy, hp: enemyHp },
          player,
          feedback: { kind: "enemy", message: "", nonce: Date.now(), amount: damage },
        };
      });
    }, getEnemyAttackInterval(state.floor));

    return () => window.clearInterval(timer);
  }, [state.phase, state.enemy?.name, state.paused, state.floor, state.tutorial]);

  return {
    state,
    soundLevel,
    confirmFloorReady,
    startRun,
    submitPath,
    chooseDoor,
    buyUpgrade,
    leaveShop,
    startBossFight,
    playBossDialogTick,
    resumeGame,
    pauseGame,
    cycleSoundLevel,
    takeBargain,
    skipTutorial,
  };
}

function makeNewRunState(withTutorial: boolean): GameState {
  return {
    ...initialState,
    phase: "floorIntro",
    player: { ...initialPlayer },
    tutorial: withTutorial ? "swipe" : null,
    tutorialEnemyHitDone: false,
    showFloorScroll: true,
    floorIntroNonce: Date.now(),
    pendingBossFight: false,
  };
}

function beginFightEntry(
  current: GameState,
  isBoss: boolean,
  makeRunPuzzle: (size: number, player: PlayerState, floor: number, isBoss?: boolean) => ReturnType<typeof makePuzzle>,
): GameState {
  if (isBoss) return startSpecificFight(current, true, makeRunPuzzle);

  if (current.roomsCleared === 0) {
    return {
      ...current,
      phase: "floorIntro",
      showFloorScroll: true,
      floorIntroNonce: Date.now(),
      pendingBossFight: false,
      paused: false,
      enemy: null,
      puzzle: null,
      doors: [],
      feedback: null,
    };
  }

  return startSpecificFight(current, false, makeRunPuzzle);
}

function startNextFight(
  current: GameState,
  makeRunPuzzle: (size: number, player: PlayerState, floor: number, isBoss?: boolean) => ReturnType<typeof makePuzzle>,
): GameState {
  const shouldBoss = current.roomsCleared >= MONSTER_ROOMS_BEFORE_BOSS;
  return beginFightEntry(current, shouldBoss, makeRunPuzzle);
}

function startSpecificFight(
  current: GameState,
  isBoss: boolean,
  makeRunPuzzle: (size: number, player: PlayerState, floor: number, isBoss?: boolean) => ReturnType<typeof makePuzzle>,
): GameState {
  const enemy = makeEnemy(isBoss, current.floor);

  return {
    ...current,
    phase: isBoss ? "bossIntro" : "combat",
    paused: false,
    enemy: current.tutorial && !isBoss ? makeTutorialEnemy(enemy) : enemy,
    puzzle: makeRunPuzzle(isBoss ? 4 : 3, current.player, current.floor, isBoss),
    doors: [],
    frozenUntil: 0,
    tutorialEnemyHitDone: false,
    showFloorScroll: false,
    pendingBossFight: false,
    feedback: isBoss
      ? { kind: "blocked", message: "The boss waits behind the iron sum gate.", nonce: Date.now() }
      : current.feedback?.kind === "hit"
        ? null
        : current.feedback,
  };
}

function getMusicTheme(state: GameState): MusicTheme | null {
  if (state.phase === "combat") return state.enemy?.isBoss ? "boss" : "fight";
  if (state.phase === "floorIntro") return "fight";
  if (state.phase === "bossIntro") return "boss";
  if (state.phase === "door") return "door";
  if (state.phase === "shop") return "shop";
  if (state.phase === "bargain") return "bargain";
  return null;
}

function getDoorMusicTheme(kind: DoorChoice["kind"]): MusicTheme {
  if (kind === "shop") return "shop";
  if (kind === "bargain") return "bargain";
  if (kind === "boss") return "boss";
  return "door";
}