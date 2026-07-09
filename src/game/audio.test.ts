// Verifies game audio helpers stop cleanly when pause silences playback.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { pauseAudio, playFeedback, startMusic, type MusicState } from "./audio";
import type { FeedbackState, SoundLevel } from "./types";

class FakeAudioContext {
  currentTime = 0;
  destination = {};
  oscillatorCount = 0;
  state: AudioContextState = "running";
  suspendCalls = 0;

  createOscillator() {
    this.oscillatorCount += 1;
    return {
      connect: vi.fn(),
      frequency: { setValueAtTime: vi.fn() },
      start: vi.fn(),
      stop: vi.fn(),
      type: "sine" as OscillatorType,
    };
  }

  createGain() {
    return {
      connect: vi.fn(),
      gain: {
        exponentialRampToValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        setValueAtTime: vi.fn(),
      },
    };
  }

  suspend() {
    this.suspendCalls += 1;
    this.state = "suspended";
    return Promise.resolve();
  }
}

const browserTimers = {
  clearInterval: globalThis.clearInterval.bind(globalThis),
  clearTimeout: globalThis.clearTimeout.bind(globalThis),
  setInterval: globalThis.setInterval.bind(globalThis),
  setTimeout: globalThis.setTimeout.bind(globalThis),
};

function audioRef(context: FakeAudioContext) {
  return { current: context as unknown as AudioContext };
}

function soundRef(level: SoundLevel = "loud") {
  return { current: level };
}

function pauseFeedback(): FeedbackState {
  return { kind: "pause", message: "Paused", nonce: 1 };
}

describe("audio pause behavior", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("window", browserTimers);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("does not play a feedback tone for pause", () => {
    const context = new FakeAudioContext();

    playFeedback(audioRef(context), pauseFeedback(), soundRef());

    expect(context.oscillatorCount).toBe(0);
  });

  it("stops looped music and queued melody notes when audio is paused", () => {
    const context = new FakeAudioContext();
    const music = { current: null as MusicState | null };

    startMusic(audioRef(context), music, soundRef(), "fight");
    expect(music.current).not.toBeNull();

    const oscillatorCountAfterStart = context.oscillatorCount;
    pauseAudio(audioRef(context), music);
    vi.advanceTimersByTime(2_000);

    expect(music.current).toBeNull();
    expect(context.suspendCalls).toBe(1);
    expect(context.oscillatorCount).toBe(oscillatorCountAfterStart);
  });
});
