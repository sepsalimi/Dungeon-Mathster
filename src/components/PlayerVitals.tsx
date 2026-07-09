// Shows current player health anywhere the combat grid is not visible.
import type { PlayerState } from "../game/types";

interface PlayerVitalsProps {
  player: PlayerState;
  highlight?: boolean;
}

export function PlayerVitals({ player, highlight = false }: PlayerVitalsProps) {
  const hpPercent = Math.max(0, Math.round((player.hp / player.maxHp) * 100));
  const displayedHp = player.temporaryHp > 0 ? `${player.hp}+${player.temporaryHp}` : String(player.hp);

  return (
    <div
      className={["player-vitals", highlight ? "player-vitals--tutorial" : ""].filter(Boolean).join(" ")}
      aria-label={`Player HP ${displayedHp} of ${player.maxHp}`}
    >
      <span>HP</span>
      <strong>{displayedHp}/{player.maxHp}</strong>
      <div className="player-vitals__track">
        <i style={{ width: `${hpPercent}%` }} />
      </div>
    </div>
  );
}
