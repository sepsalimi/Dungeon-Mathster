import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
import {
  bargainOptions,
  makeDoorChoices,
  makeEnemy,
  MONSTER_REWARD,
  MONSTER_ROOMS_BEFORE_BOSS,
  shopUpgrades,
} from "./content";
import { isCorrectPath, makePuzzle } from "./math";
import {
  STARTING_MAX_HP,
  addItem,
  addPermutationBonus,
  applyBossItem,
  getBossReward,
  getFloorOperators,
  getRoomPathLength,
} from "./progression";
import type { BargainId, DoorChoice, FeedbackState, GameState, ItemId, PlayerState, ShopUpgradeId, SoundLevel } from "./types";

const initialPlayer: PlayerState = {
  hp: 120,
  maxHp: STARTING_MAX_HP,
  temporaryHp: 0,
  gold: 0,
  goldBonus: 0,
  damageReductionArmor: 0,
  barbedArmor: 0,
  swordDamage: 1,
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
};

interface MusicState {
  interval: number;
  theme: MusicTheme;
}

type MusicTheme = "fight" | "boss" | "door" | "shop" | "bargain";

const soundLevelOrder: SoundLevel[] = ["loud", "mute", "low"];

function nextSoundLevel(current: SoundLevel): SoundLevel {
  const index = soundLevelOrder.indexOf(current);
  return soundLevelOrder[(index + 1) % soundLevelOrder.length];
}

function getVolumeMultiplier(level: SoundLevel): number {
  if (level === "mute") return 0;
  if (level === "low") return 1;
  return 3;
}

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

  const startRun = useCallback(() => {
    ensureAudio("fight");
    window.history.replaceState({ dungeonMathster: true }, "");
    window.history.pushState({ dungeonMathsterPause: true }, "");
    setState({
      ...initialState,
      phase: "combat",
      player: { ...initialPlayer },
      enemy: makeEnemy(false, 1),
      puzzle: makeRunPuzzle(3, initialPlayer, 1),
    });
  }, [ensureAudio, makeRunPuzzle]);

  const pauseGame = useCallback(() => {
    setState((current) => {
      if (current.phase === "start" || current.phase === "victory" || current.phase === "defeat" || current.paused) {
        return current;
      }
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
        };
      }

      if (current.enemy.isBoss) {
        const bossGold = getBossReward(current.floor);
        const bossReward = applyBossItem({ ...healedPlayer, gold: healedPlayer.gold + bossGold }, current.floor);
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
            message: `${bossReward.message} Floor ${nextFloor} opens. +${bossGold} gold.`,
            nonce: Date.now(),
            rewards: [
              { kind: "gold", amount: bossGold },
              { kind: "item", itemId: bossReward.item },
            ],
          },
        };
      }

      const roomsCleared = current.roomsCleared + 1;
      const reward = MONSTER_REWARD + healedPlayer.goldBonus;
      return {
        ...current,
        phase: "door",
        roomsCleared,
        enemy: { ...current.enemy, hp: 0 },
        puzzle: null,
        doors: makeDoorChoices(roomsCleared),
        player: { ...healedPlayer, gold: healedPlayer.gold + reward },
        feedback: {
          kind: "hit",
          message: `Monster defeated. +${reward} gold.`,
          nonce: Date.now(),
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
          hp: Math.min(current.player.maxHp, current.player.hp + 20),
          gold: current.player.gold + 5,
        },
        feedback: {
          kind: "buy",
          message: "Mystery reward: +20 HP and +5 gold.",
          nonce: Date.now(),
          rewards: [{ kind: "gold", amount: 5 }],
        },
      }));
      window.setTimeout(() => setState((current) => startNextFight({ ...current, feedback: null }, makeRunPuzzle)), 1_800);
      return;
    }

    setState((current) => startSpecificFight(current, door.kind === "boss", makeRunPuzzle));
  }, [ensureAudio, makeRunPuzzle]);

  const takeBargain = useCallback((id: BargainId) => {
    ensureAudio("bargain");
    setState((current) => {
      let player = { ...current.player };
      let message = bargainOptions.find((option) => option.id === id)?.name ?? "Bargain taken";
      let rewardItem: ItemId | null = null;

      if (id === "oracleLens") {
        player = addItem(player, "oracleLens");
        rewardItem = "oracleLens";
        player.oracleLensChance = Math.min(0.8, player.oracleLensChance + 0.22);
        player.maxHp = Math.max(1, player.maxHp - 20);
        player.hp = Math.min(player.hp, player.maxHp);
        message = "Oracle Lens taken. Some answer starts will glow.";
      }
      if (id === "negativeHeart") {
        player = addItem(player, "negativeHeart");
        rewardItem = "negativeHeart";
        player.maxHp += 30;
        player.hp = Math.min(player.maxHp, player.hp + 30);
        player.negativesUnlocked = true;
        message = "Negative Heart taken. More HP, stranger numbers.";
      }
      if (id === "glassBlade") {
        player = addItem(player, "glassBlade");
        rewardItem = "glassBlade";
        player.swordDamage = Math.max(1, player.swordDamage * 2);
        player.maxHp = Math.max(1, Math.floor(player.maxHp / 2));
        player.hp = Math.min(player.hp, player.maxHp);
        message = "Glass Blade taken. Damage doubled, health halved.";
      }
      if (id === "coinHex") {
        player = addItem(player, "coinHex");
        rewardItem = "coinHex";
        if (Math.random() < 0.5) {
          player.swordDamage += 1;
          message = "Coin Hex: heads. Sword damage increased.";
        } else {
          player.extraDamageTaken += 2;
          message = "Coin Hex: tails. Monsters hit harder.";
        }
      }
      if (id === "giantEquation") {
        player = addItem(player, "longEquation");
        rewardItem = "longEquation";
        player.maxHp += 40;
        player.hp = Math.min(player.maxHp, player.hp + 40);
        player.swordDamage += 2;
        player.permutationBonus += 1;
        message = "Giant Equation taken. More power, longer answers.";
      }

      return startNextFight(
        {
          ...current,
          player,
          feedback: {
            kind: "buy",
            message,
            nonce: Date.now(),
            rewards: rewardItem ? [{ kind: "item", itemId: rewardItem }] : undefined,
          },
        },
        makeRunPuzzle,
      );
    });
  }, [ensureAudio, makeRunPuzzle]);

  const buyUpgrade = useCallback((id: ShopUpgradeId) => {
    ensureAudio("shop");
    const upgrade = shopUpgrades.find((candidate) => candidate.id === id);
    if (!upgrade) return;

    setState((current) => {
      if (current.player.gold < upgrade.cost) {
        return { ...current, feedback: { kind: "blocked", message: "Not enough gold.", nonce: Date.now() } };
      }

      const player = { ...current.player, gold: current.player.gold - upgrade.cost };
      const rewardItem = getShopRewardItem(id);
      if (id === "heal") player.hp = Math.min(player.maxHp, player.hp + 35);
      if (id === "maxHp") {
        Object.assign(player, addItem(player, "maxHp"));
        player.maxHp += 20;
        player.hp = Math.min(player.maxHp, player.hp + 20);
      }
      if (id === "damageReductionArmor") {
        Object.assign(player, addItem(player, "damageReductionArmor"));
        player.damageReductionArmor += 1;
      }
      if (id === "temporaryArmor") {
        Object.assign(player, addItem(player, "temporaryArmor"));
        player.temporaryHp += 25;
      }
      if (id === "barbedArmor") {
        Object.assign(player, addItem(player, "barbedArmor"));
        player.barbedArmor += 1;
      }
      if (id === "sword") {
        Object.assign(player, addItem(player, "sword"));
        player.swordDamage += 1;
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
    setState((current) => startNextFight({ ...current, feedback: null }, makeRunPuzzle));
  }, [ensureAudio, makeRunPuzzle]);

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
    if (state.phase !== "combat" || !state.enemy || state.paused) return;

    const timer = window.setInterval(() => {
      setState((current) => {
        if (current.paused || current.phase !== "combat" || !current.enemy) return current;
        const damage = Math.max(1, current.enemy.damage - current.player.damageReductionArmor + current.player.extraDamageTaken);
        const temporaryHp = Math.max(0, current.player.temporaryHp - damage);
        const damageToHp = Math.max(0, damage - current.player.temporaryHp);
        const hp = Math.max(0, current.player.hp - damageToHp);
        const enemyHp = Math.max(0, current.enemy.hp - current.player.barbedArmor);
        const player = { ...current.player, hp, temporaryHp };
        if (hp <= 0) stopMusic(music);

        if (hp > 0 && enemyHp <= 0 && current.player.barbedArmor > 0) {
          if (current.enemy.isBoss) {
            const bossGold = getBossReward(current.floor);
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
          phase: hp <= 0 ? "defeat" : current.phase,
          enemy: { ...current.enemy, hp: enemyHp },
          player,
          feedback: { kind: "enemy", message: "", nonce: Date.now(), amount: damage },
        };
      });
    }, 5_000);

    return () => window.clearInterval(timer);
  }, [state.phase, state.enemy?.name, state.paused]);

  return {
    state,
    soundLevel,
    startRun,
    submitPath,
    chooseDoor,
    buyUpgrade,
    leaveShop,
    startBossFight,
    resumeGame,
    pauseGame,
    cycleSoundLevel,
    takeBargain,
  };
}

function startNextFight(
  current: GameState,
  makeRunPuzzle: (size: number, player: PlayerState, floor: number, isBoss?: boolean) => ReturnType<typeof makePuzzle>,
): GameState {
  const shouldBoss = current.roomsCleared >= MONSTER_ROOMS_BEFORE_BOSS;
  return startSpecificFight(current, shouldBoss, makeRunPuzzle);
}

function startSpecificFight(
  current: GameState,
  isBoss: boolean,
  makeRunPuzzle: (size: number, player: PlayerState, floor: number, isBoss?: boolean) => ReturnType<typeof makePuzzle>,
): GameState {
  return {
    ...current,
    phase: isBoss ? "bossIntro" : "combat",
    paused: false,
    enemy: makeEnemy(isBoss, current.floor),
    puzzle: makeRunPuzzle(isBoss ? 4 : 3, current.player, current.floor, isBoss),
    doors: [],
    frozenUntil: 0,
    feedback: isBoss
      ? { kind: "blocked", message: "The boss waits behind the iron sum gate.", nonce: Date.now() }
      : current.feedback?.kind === "hit"
        ? null
        : current.feedback,
  };
}

function getShopRewardItem(id: ShopUpgradeId): ItemId | null {
  if (id === "heal") return null;
  if (id === "maxHp") return "maxHp";
  if (id === "damageReductionArmor") return "damageReductionArmor";
  if (id === "temporaryArmor") return "temporaryArmor";
  if (id === "barbedArmor") return "barbedArmor";
  return "sword";
}

function applyLifesteal(player: PlayerState): PlayerState {
  if (player.lifesteal <= 0 || player.hp <= 0) return player;
  return { ...player, hp: Math.min(player.maxHp, player.hp + player.lifesteal) };
}

function primeAudio(audioContext: MutableRefObject<AudioContext | null>) {
  const AudioCtor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return;
  audioContext.current ??= new AudioCtor();
  void audioContext.current.resume();
}

function startMusic(
  audioContext: MutableRefObject<AudioContext | null>,
  music: MutableRefObject<MusicState | null>,
  soundLevelRef: MutableRefObject<SoundLevel>,
  theme: MusicTheme,
) {
  const context = audioContext.current;
  const volumeMultiplier = getVolumeMultiplier(soundLevelRef.current);
  if (!context || context.state !== "running" || music.current || volumeMultiplier === 0) return;

  const pattern = musicPatterns[theme];
  let index = 0;
const playStep = () => {
    playTone(
      context,
      pattern.bass[index % pattern.bass.length],
      0.025,
      pattern.beat * 0.00048,
      pattern.bassType,
      pattern.volume * volumeMultiplier,
    );
    if (index % pattern.melodyEvery === 0) {
      window.setTimeout(
        () =>
          playTone(
            context,
            pattern.melody[index % pattern.melody.length],
            0.025,
            pattern.beat * 0.00034,
            "sine",
            pattern.volume * 0.82 * volumeMultiplier,
          ),
        pattern.beat * 0.24,
      );
    }
    index += 1;
  };
  playStep();
  const interval = window.setInterval(playStep, pattern.beat);

  music.current = { interval, theme };
}

function stopMusic(music: MutableRefObject<MusicState | null>) {
  if (!music.current) return;
  window.clearInterval(music.current.interval);
  music.current = null;
}

function playFeedback(
  audioContext: MutableRefObject<AudioContext | null>,
  feedback: FeedbackState,
  soundLevelRef: MutableRefObject<SoundLevel>,
) {
  const context = audioContext.current;
  const volumeMultiplier = getVolumeMultiplier(soundLevelRef.current);
  if (!context || context.state !== "running" || volumeMultiplier === 0) return;

  if (feedback.kind === "hit") {
    playTone(context, 960, 0.004, 0.055, "square", 0.13 * volumeMultiplier);
    window.setTimeout(() => playTone(context, 420, 0.006, 0.08, "sawtooth", 0.08 * volumeMultiplier), 32);
  }
  if (feedback.kind === "miss") playTone(context, 260, 0.02, 0.13, "sine", 0.045 * volumeMultiplier);
  if (feedback.kind === "enemy") {
    playTone(context, 196, 0.004, 0.075, "triangle", 0.08 * volumeMultiplier);
    window.setTimeout(() => playTone(context, 147, 0.006, 0.09, "sine", 0.055 * volumeMultiplier), 42);
  }
  if (feedback.kind === "buy") {
    playTone(context, 660, 0.02, 0.08, "triangle", 0.09 * volumeMultiplier);
    window.setTimeout(() => playTone(context, 880, 0.02, 0.08, "triangle", 0.08 * volumeMultiplier), 70);
  }
  if (feedback.kind === "blocked" || feedback.kind === "pause") {
    playTone(context, 240, 0.02, 0.08, "sine", 0.06 * volumeMultiplier);
  }
}

function playTone(context: AudioContext, frequency: number, attack: number, duration: number, type: OscillatorType, volume = 0.11) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + attack);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.02);
}
function getMusicTheme(state: GameState): MusicTheme | null {
  if (state.phase === "combat") return state.enemy?.isBoss ? "boss" : "fight";
  if (state.phase === "bossIntro") return "boss";
  if (state.phase === "door") return "door";
  if (state.phase === "shop") return "shop";
  if (state.phase === "bargain") return "bargain";
  return null;
}

const musicPatterns: Record<MusicTheme, {
  bass: number[];
  melody: number[];
  beat: number;
  volume: number;
  melodyEvery: number;
  bassType: OscillatorType;
}> = {
  fight: {
    bass: [82.41, 98, 110, 73.42, 82.41, 65.41],
    melody: [196, 174.61, 146.83, 164.81, 130.81, 146.83],
    beat: 560,
    volume: 0.045,
    melodyEvery: 2,
    bassType: "triangle",
  },
  boss: {
    bass: [65.41, 65.41, 73.42, 61.74, 55, 61.74],
    melody: [130.81, 146.83, 123.47, 98],
    beat: 430,
    volume: 0.052,
    melodyEvery: 2,
    bassType: "sawtooth",
  },
  door: {
    bass: [98, 123.47, 146.83, 123.47],
    melody: [246.94, 293.66, 261.63, 220],
    beat: 760,
    volume: 0.038,
    melodyEvery: 1,
    bassType: "triangle",
  },
  shop: {
    bass: [110, 146.83, 164.81, 146.83],
    melody: [329.63, 293.66, 246.94, 293.66],
    beat: 700,
    volume: 0.036,
    melodyEvery: 1,
    bassType: "sine",
  },
  bargain: {
    bass: [73.42, 69.3, 61.74, 69.3],
    melody: [155.56, 146.83, 123.47, 116.54],
    beat: 640,
    volume: 0.043,
    melodyEvery: 2,
    bassType: "triangle",
  },
};
function getDoorMusicTheme(kind: DoorChoice["kind"]): MusicTheme {
  if (kind === "shop") return "shop";
  if (kind === "bargain") return "bargain";
  if (kind === "boss") return "boss";
  return "door";
}