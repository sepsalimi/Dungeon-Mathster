import type { EnemyState, FeedbackState } from "../game/types";

interface RoomSceneProps {
  enemy: EnemyState | null;
  feedback: FeedbackState | null;
  lowHealth: boolean;
  frozen: boolean;
}

export function RoomScene({ enemy, feedback, lowHealth, frozen }: RoomSceneProps) {
  const feedbackClass = feedback ? `scene-feedback--${feedback.kind}` : "";

  return (
    <section
      className={[
        "room-scene",
        lowHealth ? "room-scene--danger" : "",
        feedbackClass,
        frozen ? "room-scene--frozen" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="First person pixel dungeon room"
    >
      <div className="ceiling-grid" />
      <div className="back-wall">
        <div className="torch torch--left" />
        <div className="torch torch--right" />
      </div>
      <div className="side-wall side-wall--left" />
      <div className="side-wall side-wall--right" />
      <div className="floor-grid" />

      {enemy && (
        <div className={`monster ${enemy.isBoss ? "monster--boss" : ""}`}>
          <div className="monster-shadow" />
          <div className="monster-sprite">
            <span className="monster-horn monster-horn--left" />
            <span className="monster-horn monster-horn--right" />
            <span className="monster-eye monster-eye--left" />
            <span className="monster-eye monster-eye--right" />
            <span className="monster-mouth" />
          </div>
          <div className="enemy-plate">
            <strong>{enemy.name}</strong>
            <div className="enemy-health">
              {Array.from({ length: enemy.maxHp }, (_, index) => (
                <span
                  key={index}
                  className={index < enemy.hp ? "enemy-heart is-full" : "enemy-heart"}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {feedback?.kind === "hit" && <div key={feedback.nonce} className="sword-slash" />}
      {feedback?.kind === "miss" && (
        <div key={feedback.nonce} className="miss-overlay">
          <span>MISS</span>
          <i />
        </div>
      )}
      {feedback?.kind === "enemy" && (
        <>
          <div key={`hurt-${feedback.nonce}`} className="hurt-flash" />
          <div key={`damage-${feedback.nonce}`} className="damage-number">
            -{feedback.amount ?? 0}
          </div>
        </>
      )}
      {feedback && feedback.kind !== "miss" && (
        <div key={`toast-${feedback.nonce}`} className="toast">
          {feedback.message}
        </div>
      )}
    </section>
  );
}
