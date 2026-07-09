import type { EnemyState, FeedbackState } from "../game/types";

interface RoomSceneProps {
  enemy: EnemyState | null;
  feedback: FeedbackState | null;
  lowHealth: boolean;
  frozen: boolean;
  highlightEnemyHealth?: boolean;
}

export function RoomScene({ enemy, feedback, lowHealth, frozen, highlightEnemyHealth = false }: RoomSceneProps) {
  const feedbackClass = feedback ? `scene-feedback--${feedback.kind}` : "";
  const enemyAttackNonce = feedback?.kind === "enemy" ? feedback.nonce : null;
  const hitNonce = feedback?.kind === "hit" ? feedback.nonce : null;
  const enemyHpPercent = enemy ? Math.max(0, Math.min(100, (enemy.hp / enemy.maxHp) * 100)) : 0;

  return (
    <section
      className={["room-scene", lowHealth ? "room-scene--danger" : "", feedbackClass, frozen ? "room-scene--frozen" : ""]
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
        <div
          key={enemyAttackNonce ? `enemy-attack-${enemyAttackNonce}` : hitNonce ? `enemy-hit-${hitNonce}` : enemy.name}
          className={[
            "monster",
            enemy.isBoss ? "monster--boss" : "",
            enemyAttackNonce ? "monster--attacking" : "",
            hitNonce ? "monster--hurt" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="monster-shadow" />
          <div className="monster-sprite">
            <span className="monster-horn monster-horn--left" />
            <span className="monster-horn monster-horn--right" />
            <span className="monster-eye monster-eye--left" />
            <span className="monster-eye monster-eye--right" />
            <span className="monster-mouth" />
          </div>
          <div className={["enemy-plate", highlightEnemyHealth ? "enemy-plate--tutorial" : ""].filter(Boolean).join(" ")}>
            <strong>{enemy.name}</strong>
            <div className="enemy-health">
              <span className="enemy-health-fill" style={{ width: `${enemyHpPercent}%` }} />
              <span className="enemy-health-marker enemy-health-marker--one" />
              <span className="enemy-health-marker enemy-health-marker--two" />
              <span className="enemy-health-marker enemy-health-marker--three" />
              <span className="enemy-health-marker enemy-health-marker--four" />
            </div>
          </div>
        </div>
      )}

      {feedback?.kind === "hit" && (
        <div key={feedback.nonce} className="slash-hit-overlay">
          <div className="sword-slash" />
          <span>{feedback.amount ?? 0}</span>
        </div>
      )}
      {feedback?.kind === "miss" && (
        <div key={feedback.nonce} className="miss-overlay">
          <span>MISS</span>
          <i />
        </div>
      )}
      {feedback?.kind === "enemy" && <div key={`damage-${feedback.nonce}`} className="damage-number">-{feedback.amount ?? 0}</div>}
      {feedback && feedback.kind !== "miss" && feedback.kind !== "enemy" && feedback.kind !== "hit" && (
        <div key={`toast-${feedback.nonce}`} className="toast">{feedback.message}</div>
      )}
    </section>
  );
}
