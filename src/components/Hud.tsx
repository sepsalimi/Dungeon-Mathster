import type { GameState, SoundLevel } from "../game/types";

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
  const hpPercent = Math.max(0, Math.round((state.player.hp / state.player.maxHp) * 100));

  return (
    <header className="hud">
      <div className="hp-panel" aria-label={`HP ${state.player.hp} of ${state.player.maxHp}`}>
        <div className="hud-label">
          <span>HP</span>
          <strong>
            {state.player.hp}/{state.player.maxHp}
          </strong>
        </div>
        <div className="hp-track">
          <div className="hp-fill" style={{ width: `${hpPercent}%` }} />
        </div>
        {state.player.lifesteal > 0 && (
          <div className="relic-badge" aria-label={`Lifesteal heals ${state.player.lifesteal} HP per hit`}>
            Lifesteal +{state.player.lifesteal}
          </div>
        )}
      </div>
      <div className="gold-pill" aria-label={`${state.player.gold} gold`}>
        <span className="coin-icon" aria-hidden="true">G</span>
        <span className="gold-text">
          <small>Gold</small>
          <strong>{state.player.gold}</strong>
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
