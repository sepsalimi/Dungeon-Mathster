import type { GameState, SoundLevel } from "../game/types";
import { MAX_FLOOR, getRelicBadges } from "../game/progression";

interface HudProps {
  state: GameState;
  soundLevel: SoundLevel;
  onPause: () => void;
  onCycleSoundLevel: () => void;
}

const soundLabels: Record<SoundLevel, string> = {
  mute: "Sound off",
  low: "Low sound",
  loud: "Loud sound",
};

export function Hud({ state, soundLevel, onPause, onCycleSoundLevel }: HudProps) {
  const relics = getRelicBadges(state.player);

  return (
    <header className="hud">
      <div className="run-panel" aria-label={`Floor ${state.floor} of ${MAX_FLOOR}, ${state.player.gold} gold`}>
        <div className="run-panel__topline">
          <span>Floor {state.floor}/{MAX_FLOOR}</span>
          <strong>{state.player.gold}g</strong>
        </div>
        <div className="relic-list" aria-label={relics.length ? `Relics: ${relics.join(", ")}` : "Relics: none"}>
          <small>Relics</small>
          <span>{relics.length ? relics.join(" | ") : "None"}</span>
        </div>
      </div>
      <button className="hud-button" type="button" onClick={onCycleSoundLevel} aria-label={soundLabels[soundLevel]}>
        <span className={`sound-icon sound-icon--${soundLevel}`} aria-hidden="true">
          {soundLevel === "loud" && <i className="sound-icon__wave sound-icon__wave--outer" />}
        </span>
      </button>
      <button className="hud-button" type="button" onClick={onPause} aria-label="Pause game">
        <span aria-hidden="true">II</span>
      </button>
    </header>
  );
}
