import type { GameState, SoundLevel } from "../game/types";

interface HudProps {
  gold: GameState["player"]["gold"];
  soundLevel: SoundLevel;
  onPause: () => void;
  onCycleSoundLevel: () => void;
}

const soundLabels: Record<SoundLevel, string> = {
  mute: "Sound off",
  low: "Low sound",
  loud: "Loud sound",
};

export function Hud({ gold, soundLevel, onPause, onCycleSoundLevel }: HudProps) {
  return (
    <header className="hud">
      <div className="gold-pill" aria-label={`${gold} gold`}>
        <span className="coin-icon" aria-hidden="true">G</span>
        <span className="gold-text">
          <small>Gold</small>
          <strong>{gold}</strong>
        </span>
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
