interface PauseOverlayProps {
  onResume: () => void;
  onRestart: () => void;
}

export function PauseOverlay({ onResume, onRestart }: PauseOverlayProps) {
  return (
    <section className="pause-overlay" aria-label="Game paused">
      <div className="pause-panel">
        <span>Paused</span>
        <h1>Dungeon Halted</h1>
        <div className="pause-actions">
          <button className="primary-action" type="button" onClick={onResume}>
            Resume
          </button>
          <button className="secondary-action" type="button" onClick={onRestart}>
            New Run
          </button>
        </div>
      </div>
    </section>
  );
}
