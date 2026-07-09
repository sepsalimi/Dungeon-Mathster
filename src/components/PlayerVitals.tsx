// Shows current player health anywhere the combat grid is not visible.
import type { PlayerState } from "../game/types";

interface PlayerVitalsProps {
  player: PlayerState;
  highlight?: boolean;
}

export function PlayerVitals({ player, highlight = false }: PlayerVitalsProps) {
  const hpPercent = Math.max(0, Math.round((player.hp / player.maxHp) * 100));
  const shieldPercent = Math.min(100, Math.max(0, Math.round((player.temporaryHp / player.maxHp) * 100)));
  const displayedHp = String(player.hp);
  const shieldLabel = player.temporaryHp > 0 ? `, Shield ${player.temporaryHp}` : "";

  return (
    <div
      className={["player-vitals", highlight ? "player-vitals--tutorial" : ""].filter(Boolean).join(" ")}
      aria-label={`Player HP ${displayedHp} of ${player.maxHp}${shieldLabel}`}
    >
      <span>HP</span>
      <strong>{displayedHp}/{player.maxHp}</strong>
      <div className="player-vitals__track">
        <i style={{ width: `${hpPercent}%` }} />
      </div>
      {player.temporaryHp > 0 && (
        <div className="player-vitals__shield" aria-label={`Shield ${player.temporaryHp}`}>
          <span className="item-icon item-icon--shield" aria-hidden="true" />
          <div className="player-vitals__shield-track">
            <i style={{ width: `${shieldPercent}%` }} />
          </div>
          <strong>{player.temporaryHp}</strong>
        </div>
      )}
    </div>
  );
}
