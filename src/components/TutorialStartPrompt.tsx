// Start-run tutorial prompt shown before the dungeon begins.
interface TutorialStartPromptProps {
  dontAskAgain: boolean;
  onChangeDontAskAgain: (checked: boolean) => void;
  onAccept: () => void;
  onDecline: () => void;
}

export function TutorialStartPrompt({
  dontAskAgain,
  onChangeDontAskAgain,
  onAccept,
  onDecline,
}: TutorialStartPromptProps) {
  return (
    <section className="tutorial-start-prompt" aria-label="Tutorial prompt">
      <div className="tutorial-start-prompt__panel">
        <span>New Run</span>
        <h1>Want a tutorial?</h1>
        <p>You can learn the swipe, enemy attack, door, and shop basics first.</p>
        <label className="prompt-toggle">
          <input
            type="checkbox"
            checked={dontAskAgain}
            onChange={(event) => onChangeDontAskAgain(event.currentTarget.checked)}
          />
          <span>Don't ask me again</span>
        </label>
        <div className="pause-actions">
          <button className="primary-action" type="button" onClick={onAccept}>
            Yes
          </button>
          <button className="secondary-action" type="button" onClick={onDecline}>
            No
          </button>
        </div>
      </div>
    </section>
  );
}
