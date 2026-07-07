import type { GameState } from "../game/types";

interface HudProps {
  state: GameState;
  onRestart: () => void;
}

export function Hud({ state, onRestart }: HudProps) {
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
      </div>
      <div className="gold-pill" aria-label={`${state.player.gold} gold`}>
        <span className="coin-icon" aria-hidden="true" />
        <span className="gold-text">
          <small>Gold</small>
          <strong>{state.player.gold}</strong>
        </span>
      </div>
      <button className="restart-button" type="button" onClick={onRestart} aria-label="Start a new run">
        <strong>New Run</strong>
      </button>
    </header>
  );
}

