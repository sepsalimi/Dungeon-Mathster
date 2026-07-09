interface TutorialOfferOverlayProps {
  onAccept: () => void;
  onDecline: () => void;
}

export function TutorialOfferOverlay({ onAccept, onDecline }: TutorialOfferOverlayProps) {
  return (
    <section className="pause-overlay" aria-label="Tutorial offer">
      <div className="pause-panel">
        <span>Need a hand?</span>
        <h1>Having trouble?</h1>
        <p>Would you like a tutorial?</p>
        <div className="pause-actions">
          <button className="primary-action" type="button" onClick={onAccept}>
            Yes, show tutorial
          </button>
          <button className="secondary-action" type="button" onClick={onDecline}>
            No thanks
          </button>
        </div>
      </div>
    </section>
  );
}
