import type { GameState } from "../game/types";

interface HudProps {
  state: GameState;
  isMuted: boolean;
  onPause: () => void;
  onToggleMute: () => void;
}

export function Hud({ state, isMuted, onPause, onToggleMute }: HudProps) {
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
      <button className="hud-button" type="button" onClick={onToggleMute} aria-label={isMuted ? "Unmute" : "Mute"}>
        <span className={isMuted ? "mute-icon is-muted" : "mute-icon"} aria-hidden="true" />
      </button>
      <button className="hud-button" type="button" onClick={onPause} aria-label="Pause game">
        <span aria-hidden="true">II</span>
      </button>
    </header>
  );
}

