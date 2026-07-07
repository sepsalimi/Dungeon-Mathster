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
  lifesteal: 0,
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
}

export function useGame() {
  const [state, setState] = useState<GameState>(initialState);
  const [isMuted, setIsMuted] = useState(false);
  const audioContext = useRef<AudioContext | null>(null);
  const music = useRef<MusicState | null>(null);
  const mutedRef = useRef(false);

  const makeRunPuzzle = useCallback((size: number, player: PlayerState) => {
    return makePuzzle(size, { allowNegative: player.negativesUnlocked });
  }, []);

  const ensureAudio = useCallback(() => {
    primeAudio(audioContext);
    startMusic(audioContext, music, mutedRef);
  }, []);

  const startRun = useCallback(() => {
    ensureAudio();
    window.history.replaceState({ dungeonMathster: true }, "");
    window.history.pushState({ dungeonMathsterPause: true }, "");
    setState({
      ...initialState,
      phase: "combat",
      player: { ...initialPlayer },
      enemy: makeEnemy(false),
      puzzle: makePuzzle(3),
    });
  }, [ensureAudio]);

  const pauseGame = useCallback(() => {
    setState((current) => {
      if (current.phase === "start" || current.phase === "victory" || current.phase === "defeat" || current.paused) {
        return current;
      }
      return { ...current, paused: true, feedback: { kind: "pause", message: "Paused", nonce: Date.now() } };
    });
  }, []);

  const resumeGame = useCallback(() => {
    ensureAudio();
    window.history.pushState({ dungeonMathsterPause: true }, "");
    setState((current) => ({ ...current, paused: false, feedback: null }));
  }, [ensureAudio]);

  const toggleMute = useCallback(() => {
    setIsMuted((current) => {
      const next = !current;
      mutedRef.current = next;
      if (next) {
        stopMusic(music);
      } else {
        primeAudio(audioContext);
        startMusic(audioContext, music, mutedRef);
      }
      return next;
    });
  }, []);

  const startBossFight = useCallback(() => {
    ensureAudio();
    setState((current) => ({
      ...current,
      phase: "combat",
      paused: false,
      feedback: { kind: "blocked", message: "Count Calculus raises the final grid.", nonce: Date.now() },
    }));
  }, [ensureAudio]);

  const submitPath = useCallback((path: string[]) => {
    ensureAudio();
    setState((current) => {
      if (current.paused || current.phase !== "combat" || !current.enemy || !current.puzzle) return current;

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
      const healedPlayer = applyLifesteal(current.player);

      if (nextHp > 0) {
        return {
          ...current,
          enemy: { ...current.enemy, hp: nextHp },
          player: healedPlayer,
          puzzle: makeRunPuzzle(gridSize, healedPlayer),
          feedback: { kind: "hit", message: "", nonce: Date.now(), amount: current.player.swordDamage },
        };
      }

      if (current.enemy.isBoss) {
        stopMusic(music);
        return {
          ...current,
          phase: "victory",
          enemy: { ...current.enemy, hp: 0 },
          puzzle: null,
          player: {
            ...healedPlayer,
            gold: healedPlayer.gold + BOSS_REWARD,
            lifesteal: Math.max(healedPlayer.lifesteal, 1),
          },
          feedback: {
            kind: "hit",
            message: "Lifesteal relic found. Heal on every hit.",
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
        player: { ...healedPlayer, gold: healedPlayer.gold + MONSTER_REWARD },
        feedback: {
          kind: "hit",
          message: `Monster defeated. +${MONSTER_REWARD} gold.`,
          nonce: Date.now(),
          amount: current.player.swordDamage,
        },
      };
    });
  }, [ensureAudio, makeRunPuzzle]);

  const chooseDoor = useCallback((door: DoorChoice) => {
    ensureAudio();
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
      window.setTimeout(() => setState((current) => startNextFight(current, makeRunPuzzle)), 850);
      return;
    }

    setState((current) => startSpecificFight(current, door.kind === "boss", makeRunPuzzle));
  }, [ensureAudio, makeRunPuzzle]);

  const takeBargain = useCallback((id: BargainId) => {
    ensureAudio();
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

      return startNextFight({ ...current, player, feedback: { kind: "buy", message, nonce: Date.now() } }, makeRunPuzzle);
    });
  }, [ensureAudio, makeRunPuzzle]);

  const buyUpgrade = useCallback((id: ShopUpgradeId) => {
    ensureAudio();
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
  }, [ensureAudio]);

  const leaveShop = useCallback(() => {
    ensureAudio();
    setState((current) => startNextFight(current, makeRunPuzzle));
  }, [ensureAudio, makeRunPuzzle]);

  useEffect(() => {
    const onPopState = () => pauseGame();
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [pauseGame]);

  useEffect(() => {
    if (state.feedback) playFeedback(audioContext, state.feedback, mutedRef);
  }, [state.feedback?.nonce]);

  useEffect(() => {
    if (state.phase === "defeat" || state.phase === "victory" || state.phase === "start") stopMusic(music);
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
    isMuted,
    startRun,
    submitPath,
    chooseDoor,
    buyUpgrade,
    leaveShop,
    startBossFight,
    resumeGame,
    pauseGame,
    toggleMute,
    takeBargain,
  };
}

function startNextFight(current: GameState, makeRunPuzzle: (size: number, player: PlayerState) => ReturnType<typeof makePuzzle>): GameState {
  const shouldBoss = current.roomsCleared >= MONSTER_ROOMS_BEFORE_BOSS;
  return startSpecificFight(current, shouldBoss, makeRunPuzzle);
}

function startSpecificFight(
  current: GameState,
  isBoss: boolean,
  makeRunPuzzle: (size: number, player: PlayerState) => ReturnType<typeof makePuzzle>,
): GameState {
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
    feedback: isBoss ? { kind: "blocked", message: "The boss waits behind the iron sum gate.", nonce: Date.now() } : current.feedback,
  };
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
  mutedRef: MutableRefObject<boolean>,
) {
  const context = audioContext.current;
  if (!context || context.state !== "running" || music.current || mutedRef.current) return;

  const bass = [82.41, 98, 110, 73.42, 82.41, 65.41];
  const melody = [196, 174.61, 146.83, 164.81, 130.81, 146.83];
  let index = 0;
  const interval = window.setInterval(() => {
    playTone(context, bass[index % bass.length], 0.015, 0.22, "triangle", 0.026);
    if (index % 2 === 0) {
      window.setTimeout(() => playTone(context, melody[index % melody.length], 0.015, 0.16, "sine", 0.018), 120);
    }
    index += 1;
  }, 520);

  music.current = { interval };
}

function stopMusic(music: MutableRefObject<MusicState | null>) {
  if (!music.current) return;
  window.clearInterval(music.current.interval);
  music.current = null;
}

function playFeedback(audioContext: MutableRefObject<AudioContext | null>, feedback: FeedbackState, mutedRef: MutableRefObject<boolean>) {
  const context = audioContext.current;
  if (!context || context.state !== "running" || mutedRef.current) return;

  if (feedback.kind === "hit") {
    playTone(context, 960, 0.004, 0.055, "square", 0.13);
    window.setTimeout(() => playTone(context, 420, 0.006, 0.08, "sawtooth", 0.08), 32);
  }
  if (feedback.kind === "miss") playTone(context, 260, 0.02, 0.13, "sine", 0.045);
  if (feedback.kind === "enemy") {
    playTone(context, 72, 0.06, 0.16, "sawtooth", 0.11);
    window.setTimeout(() => playTone(context, 55, 0.04, 0.1, "square", 0.08), 55);
  }
  if (feedback.kind === "buy") {
    playTone(context, 660, 0.02, 0.08, "triangle", 0.09);
    window.setTimeout(() => playTone(context, 880, 0.02, 0.08, "triangle", 0.08), 70);
  }
  if (feedback.kind === "blocked" || feedback.kind === "pause") playTone(context, 240, 0.02, 0.08, "sine", 0.06);
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
