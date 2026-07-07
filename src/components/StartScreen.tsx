interface StartScreenProps {
  onStart: () => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  return (
    <section className="start-screen">
      <div className="start-scene" aria-hidden="true">
        <div className="start-door" />
        <div className="start-floor" />
      </div>
      <div className="start-copy">
        <span>Floor 1</span>
        <h1>Dungeon Mathster</h1>
        <p>Swipe number paths, strike monsters, spend gold, and clear the first boss.</p>
        <button className="primary-action" type="button" onClick={onStart}>
          Start New Run
        </button>
      </div>
    </section>
  );
}
