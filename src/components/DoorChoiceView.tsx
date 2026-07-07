import type { DoorChoice, GameState } from "../game/types";
import { Hud } from "./Hud";

interface DoorChoiceViewProps {
  state: GameState;
  onChooseDoor: (door: DoorChoice) => void;
  onRestart: () => void;
}

export function DoorChoiceView({ state, onChooseDoor, onRestart }: DoorChoiceViewProps) {
  return (
    <div className="game-screen">
      <Hud state={state} onRestart={onRestart} />
      <section className="door-room" aria-label="Choose a dungeon door">
        <div className="door-copy">
          <span>Room {state.roomsCleared} cleared</span>
          <h1>Choose a Door</h1>
        </div>
        <div className="doors">
          {state.doors.map((door, index) => (
            <button
              key={`${door.id}-${index}`}
              type="button"
              className={`door door--${door.tone}`}
              onClick={() => onChooseDoor(door)}
            >
              <span className={`door-icon door-icon--${door.icon}`} aria-hidden="true" />
              <strong>{index === 0 ? "Left Door" : "Right Door"}</strong>
              <small>{door.label}</small>
            </button>
          ))}
        </div>
        {state.feedback && <p className="door-toast">{state.feedback.message}</p>}
      </section>
    </div>
  );
}
