// Owns WebAudio playback for game music and feedback sounds.
import type { MutableRefObject } from "react";
import type { FeedbackState, SoundLevel } from "./types";

export type MusicTheme = "fight" | "boss" | "door" | "shop" | "bargain";

export interface MusicState {
  interval: number;
  theme: MusicTheme;
  timeouts: number[];
}

const soundLevelOrder: SoundLevel[] = ["loud", "mute", "low"];

export function nextSoundLevel(current: SoundLevel): SoundLevel {
  const index = soundLevelOrder.indexOf(current);
  return soundLevelOrder[(index + 1) % soundLevelOrder.length];
}

function getVolumeMultiplier(level: SoundLevel): number {
  if (level === "mute") return 0;
  if (level === "low") return 1;
  return 3;
}

export function primeAudio(audioContext: MutableRefObject<AudioContext | null>) {
  const AudioCtor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return;
  audioContext.current ??= new AudioCtor();
  void audioContext.current.resume();
}

export function pauseAudio(audioContext: MutableRefObject<AudioContext | null>, music: MutableRefObject<MusicState | null>) {
  stopMusic(music);
  const context = audioContext.current;
  if (context?.state === "running") void context.suspend();
}

export function startMusic(
  audioContext: MutableRefObject<AudioContext | null>,
  music: MutableRefObject<MusicState | null>,
  soundLevelRef: MutableRefObject<SoundLevel>,
  theme: MusicTheme,
) {
  const context = audioContext.current;
  const volumeMultiplier = getVolumeMultiplier(soundLevelRef.current);
  if (!context || context.state !== "running" || music.current || volumeMultiplier === 0) return;

  const pattern = musicPatterns[theme];
  const timeouts: number[] = [];
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
      const timeout = window.setTimeout(() => {
        playTone(
          context,
          pattern.melody[index % pattern.melody.length],
          0.025,
          pattern.beat * 0.00034,
          "sine",
          pattern.volume * 0.82 * volumeMultiplier,
        );
        const timeoutIndex = timeouts.indexOf(timeout);
        if (timeoutIndex !== -1) timeouts.splice(timeoutIndex, 1);
      }, pattern.beat * 0.24);
      timeouts.push(timeout);
    }

    index += 1;
  };

  playStep();
  const interval = window.setInterval(playStep, pattern.beat);

  music.current = { interval, theme, timeouts };
}

export function stopMusic(music: MutableRefObject<MusicState | null>) {
  if (!music.current) return;
  window.clearInterval(music.current.interval);
  for (const timeout of music.current.timeouts) window.clearTimeout(timeout);
  music.current = null;
}

export function playFeedback(
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
  if (feedback.kind === "blocked") {
    playTone(context, 240, 0.02, 0.08, "sine", 0.06 * volumeMultiplier);
  }
}

export function playBossDialogTick(audioContext: MutableRefObject<AudioContext | null>, soundLevelRef: MutableRefObject<SoundLevel>, index: number) {
  const context = audioContext.current;
  const volumeMultiplier = getVolumeMultiplier(soundLevelRef.current);
  if (!context || context.state !== "running" || volumeMultiplier === 0) return;

  const pitch = index % 2 === 0 ? 420 : 520;
  playTone(context, pitch, 0.003, 0.035, "square", 0.028 * volumeMultiplier);
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
