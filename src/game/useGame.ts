import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
import {
  BOSS_REWARD,
  bargainOptions,
  makeDoorChoices,
  makeEnemy,
  MONSTER_REWARD,
  MONSTER_ROOMS_BEFORE_BOSS,
  shopUpgrades,
} from "./content";
import { isCorrectPath, makePuzzle } from "./math";
import type { BargainId, DoorChoice, FeedbackState, GameState, PlayerState, ShopUpgradeId } from "./types";

const initialPlayer: PlayerState = {
  hp: 120,
  maxHp: 120,
  gold: 0,
  armor: 0,
  swordDamage: 1,
  freezeNextRoom: false,
  revealStartTile: false,
  negativesUnlocked: false,
  extraDamageTaken: 0,
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
  drone: OscillatorNode;
  droneGain: GainNode;
}

export function useGame() {
  const [state, setState] = useState<GameState>(initialState);
  const audioContext = useRef<AudioContext | null>(null);
  const music = useRef<MusicState | null>(null);

  const makeRunPuzzle = useCallback((size: number, player: PlayerState) => {
    return makePuzzle(size, { allowNegative: player.negativesUnlocked });
  }, []);

  const startRun = useCallback(() => {
    primeAudio(audioContext);
    startMusic(audioContext, music);
    window.history.replaceState({ dungeonMathster: true }, "");
    window.history.pushState({ dungeonMathsterPause: true }, "");
    setState({
      ...initialState,
      phase: "combat",
      player: { ...initialPlayer },
      enemy: makeEnemy(false),
      puzzle: makePuzzle(3),
    });
  }, []);

  const resumeGame = useCallback(() => {
    primeAudio(audioContext);
    startMusic(audioContext, music);
    window.history.pushState({ dungeonMathsterPause: true }, "");
    setState((current) => ({ ...current, paused: false, feedback: null }));
  }, []);

  const startBossFight = useCallback(() => {
    primeAudio(audioContext);
    startMusic(audioContext, music);
    setState((current) => ({
      ...current,
      phase: "combat",
      paused: false,
      feedback: {
        kind: "blocked",
        message: "Count Calculus raises the final grid.",
        nonce: Date.now(),
      },
    }));
  }, []);

  const submitPath = useCallback((path: string[]) => {
    primeAudio(audioContext);
    startMusic(audioContext, music);
    setState((current) => {
      if (current.paused || current.phase !== "combat" || !current.enemy || !current.puzzle) {
        return current;
      }

      const correct = isCorrectPath(path, current.puzzle.tiles, current.puzzle.target);
      const gridSize = current.enemy.isBoss ? 4 : 3;

      if (!correct) {
        return {
          ...current,
          puzzle: makeRunPuzzle(gridSize, current.player),
          feedback: { kind: "miss", message: "MISS", nonce: Date.now() },
        };
      }

      const nextHp = Math.max(0, current.enemy.hp - current.player.swordDamage);
      const defeated = nextHp <= 0;

      if (!defeated) {
        return {
          ...current,
          enemy: { ...current.enemy, hp: nextHp },
          puzzle: makeRunPuzzle(gridSize, current.player),
          feedback: {
            kind: "hit",
            message: `Sword hit for ${current.player.swordDamage}.`,
            nonce: Date.now(),
            amount: current.player.swordDamage,
          },
        };
      }

      if (current.enemy.isBoss) {
        stopMusic(music);
        return {
          ...current,
          phase: "victory",
          enemy: { ...current.enemy, hp: 0 },
          puzzle: null,
          player: { ...current.player, gold: current.player.gold + BOSS_REWARD },
          feedback: {
            kind: "hit",
            message: "The boss falls. Floor 1 is clear.",
            nonce: Date.now(),
            amount: current.player.swordDamage,
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
        player: { ...current.player, gold: current.player.gold + MONSTER_REWARD },
        feedback: {
          kind: "hit",
          message: `Monster defeated. +${MONSTER_REWARD} gold.`,
          nonce: Date.now(),
          amount: current.player.swordDamage,
        },
      };
    });
  }, [makeRunPuzzle]);

  const chooseDoor = useCallback((door: DoorChoice) => {
    primeAudio(audioContext);
    startMusic(audioContext, music);
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
        player: {
          ...current.player,
          hp: Math.min(current.player.maxHp, current.player.hp + 20),
          gold: current.player.gold + 5,
        },
        feedback: { kind: "buy", message: "Mystery room: +20 HP and +5 gold.", nonce: Date.now() },
      }));
      window.setTimeout(() => {
        setState((current) => startNextFight(current, makeRunPuzzle));
      }, 850);
      return;
    }

    setState((current) => {
      const isBoss = door.kind === "boss";
      const frozenUntil = current.player.freezeNextRoom ? Date.now() + 10_000 : 0;
      return {
        ...current,
        phase: isBoss ? "bossIntro" : "combat",
        paused: false,
        enemy: makeEnemy(isBoss),
        puzzle: makeRunPuzzle(isBoss ? 4 : 3, current.player),
        doors: [],
        frozenUntil,
        player: { ...current.player, freezeNextRoom: false },
        feedback: isBoss
          ? { kind: "blocked", message: "The boss waits behind the iron sum gate.", nonce: Date.now() }
          : null,
      };
    });
  }, [makeRunPuzzle]);

  const takeBargain = useCallback((id: BargainId) => {
    primeAudio(audioContext);
    startMusic(audioContext, music);
    setState((current) => {
      const player = { ...current.player };
      let message = bargainOptions.find((option) => option.id === id)?.name ?? "Bargain taken";

      if (id === "oracleLens") {
        player.revealStartTile = true;
        player.maxHp = Math.max(1, player.maxHp - 20);
        player.hp = Math.min(player.hp, player.maxHp);
        message = "Oracle Lens taken. First answer tile now glows.";
      }

      if (id === "negativeHeart") {
        player.maxHp += 30;
        player.hp = Math.min(player.maxHp, player.hp + 30);
        player.negativesUnlocked = true;
        message = "Negative Heart taken. More HP, stranger numbers.";
      }

      if (id === "glassBlade") {
        player.swordDamage = Math.max(1, player.swordDamage * 2);
        player.maxHp = Math.max(1, Math.floor(player.maxHp / 2));
        player.hp = Math.min(player.hp, player.maxHp);
        message = "Glass Blade taken. Damage doubled, health halved.";
      }

      if (id === "coinHex") {
        if (Math.random() < 0.5) {
          player.swordDamage += 1;
          message = "Coin Hex: heads. Sword damage increased.";
        } else {
          player.extraDamageTaken += 2;
          message = "Coin Hex: tails. Monsters hit harder.";
        }
      }

      return startNextFight(
        {
          ...current,
          player,
          feedback: { kind: "buy", message, nonce: Date.now() },
        },
        makeRunPuzzle,
      );
    });
  }, [makeRunPuzzle]);

  const buyUpgrade = useCallback((id: ShopUpgradeId) => {
    primeAudio(audioContext);
    startMusic(audioContext, music);
    const upgrade = shopUpgrades.find((candidate) => candidate.id === id);
    if (!upgrade) return;

    setState((current) => {
      if (current.player.gold < upgrade.cost) {
        return { ...current, feedback: { kind: "blocked", message: "Not enough gold.", nonce: Date.now() } };
      }

      const player = { ...current.player, gold: current.player.gold - upgrade.cost };
      if (id === "heal") player.hp = Math.min(player.maxHp, player.hp + 35);
      if (id === "maxHp") {
        player.maxHp += 20;
        player.hp = Math.min(player.maxHp, player.hp + 20);
      }
      if (id === "armor") player.armor += 1;
      if (id === "freeze") player.freezeNextRoom = true;
      if (id === "sword") player.swordDamage += 1;

      return { ...current, player, feedback: { kind: "buy", message: `${upgrade.name} purchased.`, nonce: Date.now() } };
    });
  }, []);

  const leaveShop = useCallback(() => {
    primeAudio(audioContext);
    startMusic(audioContext, music);
    setState((current) => startNextFight(current, makeRunPuzzle));
  }, [makeRunPuzzle]);

  useEffect(() => {
    const onPopState = () => {
      setState((current) => {
        if (current.phase === "start" || current.phase === "victory" || current.phase === "defeat" || current.paused) {
          return current;
        }

        window.setTimeout(() => window.history.pushState({ dungeonMathsterPause: true }, ""), 0);
        return { ...current, paused: true, feedback: { kind: "pause", message: "Paused", nonce: Date.now() } };
      });
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (state.feedback) playFeedback(audioContext, state.feedback);
  }, [state.feedback?.nonce]);

  useEffect(() => {
    if (state.phase === "defeat" || state.phase === "victory" || state.phase === "start") {
      stopMusic(music);
    }
  }, [state.phase]);

  useEffect(() => {
    if (state.phase !== "combat" || !state.enemy || state.paused) return;

    const timer = window.setInterval(() => {
      setState((current) => {
        if (current.paused || current.phase !== "combat" || !current.enemy) return current;
        if (current.frozenUntil > Date.now()) {
          return { ...current, feedback: { kind: "blocked", message: "Freeze holds the monster still.", nonce: Date.now() } };
        }

        const damage = Math.max(1, current.enemy.damage - current.player.armor + current.player.extraDamageTaken);
        const hp = Math.max(0, current.player.hp - damage);
        if (hp <= 0) stopMusic(music);

        return {
          ...current,
          phase: hp <= 0 ? "defeat" : current.phase,
          player: { ...current.player, hp },
          feedback: { kind: "enemy", message: "", nonce: Date.now(), amount: damage },
        };
      });
    }, 5_000);

    return () => window.clearInterval(timer);
  }, [state.phase, state.enemy?.name, state.paused]);

  return {
    state,
    startRun,
    submitPath,
    chooseDoor,
    buyUpgrade,
    leaveShop,
    startBossFight,
    resumeGame,
    takeBargain,
  };
}

function startNextFight(
  current: GameState,
  makeRunPuzzle: (size: number, player: PlayerState) => ReturnType<typeof makePuzzle>,
): GameState {
  const shouldBoss = current.roomsCleared >= MONSTER_ROOMS_BEFORE_BOSS;
  const frozenUntil = current.player.freezeNextRoom ? Date.now() + 10_000 : 0;
  return {
    ...current,
    phase: shouldBoss ? "bossIntro" : "combat",
    paused: false,
    enemy: makeEnemy(shouldBoss),
    puzzle: makeRunPuzzle(shouldBoss ? 4 : 3, current.player),
    doors: [],
    frozenUntil,
    player: { ...current.player, freezeNextRoom: false },
  };
}

function primeAudio(audioContext: MutableRefObject<AudioContext | null>) {
  const AudioCtor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return;
  audioContext.current ??= new AudioCtor();
  void audioContext.current.resume();
}

function startMusic(audioContext: MutableRefObject<AudioContext | null>, music: MutableRefObject<MusicState | null>) {
  const context = audioContext.current;
  if (!context || context.state !== "running" || music.current) return;

  const drone = context.createOscillator();
  const droneGain = context.createGain();
  drone.type = "sawtooth";
  drone.frequency.setValueAtTime(55, context.currentTime);
  droneGain.gain.setValueAtTime(0.018, context.currentTime);
  drone.connect(droneGain);
  droneGain.connect(context.destination);
  drone.start();

  const notes = [110, 130.81, 98, 146.83, 82.41, 98];
  let index = 0;
  const interval = window.setInterval(() => {
    playTone(context, notes[index % notes.length], 0.02, 0.28, "triangle", 0.045);
    index += 1;
  }, 620);

  music.current = { interval, drone, droneGain };
}

function stopMusic(music: MutableRefObject<MusicState | null>) {
  if (!music.current) return;
  window.clearInterval(music.current.interval);
  music.current.droneGain.gain.exponentialRampToValueAtTime(0.001, music.current.droneGain.context.currentTime + 0.08);
  music.current.drone.stop(music.current.droneGain.context.currentTime + 0.1);
  music.current = null;
}

function playFeedback(audioContext: MutableRefObject<AudioContext | null>, feedback: FeedbackState) {
  const context = audioContext.current;
  if (!context || context.state !== "running") return;

  if (feedback.kind === "hit") {
    playTone(context, 180, 0.03, 0.08, "sawtooth");
    window.setTimeout(() => playTone(context, 520, 0.02, 0.07, "triangle"), 45);
  }
  if (feedback.kind === "miss") playTone(context, 110, 0.05, 0.12, "square");
  if (feedback.kind === "enemy") {
    playTone(context, 72, 0.06, 0.16, "sawtooth");
    window.setTimeout(() => playTone(context, 55, 0.04, 0.1, "square"), 55);
  }
  if (feedback.kind === "buy") {
    playTone(context, 660, 0.02, 0.08, "triangle");
    window.setTimeout(() => playTone(context, 880, 0.02, 0.08, "triangle"), 70);
  }
  if (feedback.kind === "blocked" || feedback.kind === "pause") playTone(context, 240, 0.02, 0.08, "sine");
}

function playTone(
  context: AudioContext,
  frequency: number,
  attack: number,
  duration: number,
  type: OscillatorType,
  volume = 0.11,
) {
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
