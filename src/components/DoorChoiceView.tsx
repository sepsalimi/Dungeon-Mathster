import type { DoorChoice, GameState, SoundLevel } from "../game/types";
import { Hud } from "./Hud";
import { RewardCue } from "./RewardCue";

interface DoorChoiceViewProps {
  state: GameState;
  soundLevel: SoundLevel;
  onPause: () => void;
  onCycleSoundLevel: () => void;
  onChooseDoor: (door: DoorChoice) => void;
}

export function DoorChoiceView({ state, soundLevel, onPause, onCycleSoundLevel, onChooseDoor }: DoorChoiceViewProps) {
  const hasSingleDoor = state.doors.length === 1;

  return (
    <div className="game-screen">
      <Hud state={state} soundLevel={soundLevel} onPause={onPause} onCycleSoundLevel={onCycleSoundLevel} />
      <RewardCue feedback={state.feedback} />
      <section className="door-room" aria-label="Choose a dungeon door">
        <div className="door-copy">
          <span>Floor {state.floor} - Room {state.roomsCleared} cleared</span>
          <h1>{hasSingleDoor ? "The Boss Gate" : "Choose a Door"}</h1>
        </div>
        <div className={hasSingleDoor ? "doors doors--single" : "doors"}>
          {state.doors.map((door, index) => (
            <button key={`${door.id}-${index}`} type="button" className={`door door--${door.tone}`} onClick={() => onChooseDoor(door)}>
              <span className={`door-icon door-icon--${door.icon}`} aria-hidden="true" />
              <strong>{hasSingleDoor ? "Enter" : index === 0 ? "Left Door" : "Right Door"}</strong>
              <small>{door.label}</small>
            </button>
          ))}
        </div>
        {state.feedback && <p className="door-toast">{state.feedback.message}</p>}
      </section>
    </div>
  );
}
