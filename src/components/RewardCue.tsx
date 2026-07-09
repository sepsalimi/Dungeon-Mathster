// Shows visual reward pickups without depending on the text toast.
import { itemDefinitions } from "../game/progression";
import type { FeedbackState } from "../game/types";

interface RewardCueProps {
  feedback: FeedbackState | null;
}

export function RewardCue({ feedback }: RewardCueProps) {
  if (!feedback?.rewards?.length) return null;
  const rewards = feedback.rewards;
  const nonce = feedback.nonce;

  return (
    <div className="reward-cues">
      {rewards.map((reward, index) => {
        if (reward.kind === "gold") {
          return (
            <div key={`gold-${nonce}-${index}`} className="reward-cue reward-cue--gold" aria-label={`${reward.amount} gold gained`}>
              <div className="coin-burst" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
              <strong>+{reward.amount}g</strong>
            </div>
          );
        }

        const item = itemDefinitions[reward.itemId];

        return (
          <div key={`item-${nonce}-${index}`} className="reward-cue reward-cue--item" aria-label={`${item.name} gained`}>
            <div className="reward-chest" aria-hidden="true">
              <span />
            </div>
            <div className="reward-item-flight">
              <span className={`item-icon item-icon--${item.icon}`} aria-hidden="true" />
            </div>
            <strong>{item.name}</strong>
          </div>
        );
      })}
    </div>
  );
}
