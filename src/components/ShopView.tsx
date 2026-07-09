import { getUpgradeCost, shopUpgrades } from "../game/shop";
import type { GameState, ShopUpgradeId, SoundLevel } from "../game/types";
import { Hud } from "./Hud";
import { PlayerVitals } from "./PlayerVitals";
import { RewardCue } from "./RewardCue";

interface ShopViewProps {
  state: GameState;
  soundLevel: SoundLevel;
  onPause: () => void;
  onCycleSoundLevel: () => void;
  onBuyUpgrade: (id: ShopUpgradeId) => void;
  onContinue: () => void;
}

export function ShopView({ state, soundLevel, onPause, onCycleSoundLevel, onBuyUpgrade, onContinue }: ShopViewProps) {
  const tutorialBuyHealth = state.tutorial === "shop";
  const tutorialHealthBought = state.tutorial === "healthBought";
  const tutorialShop = tutorialBuyHealth || tutorialHealthBought;

  return (
    <div className="game-screen">
      <Hud state={state} soundLevel={soundLevel} onPause={onPause} onCycleSoundLevel={onCycleSoundLevel} />
      <RewardCue feedback={state.feedback} />
      <section
        className={tutorialShop ? "shop-room shop-room--tutorial" : "shop-room"}
        aria-label="Dungeon shop"
      >
        <div className="merchant">
          <div className="merchant-sprite"><span /></div>
          <div><span className="eyebrow">Torch Shop</span><h1>Spend Gold</h1></div>
        </div>
        <PlayerVitals player={state.player} highlight={tutorialShop} />
        <div className="upgrade-list">
          {shopUpgrades.map((upgrade) => {
            const cost = getUpgradeCost(state.player, upgrade);
            const affordable = state.player.gold >= cost;
            const highlighted = tutorialBuyHealth && upgrade.id === "heal";
            const disabled = !affordable || (tutorialBuyHealth && !highlighted) || tutorialHealthBought;
            return (
              <button
                key={upgrade.id}
                type="button"
                className={["upgrade-row", highlighted ? "upgrade-row--tutorial" : ""].filter(Boolean).join(" ")}
                onClick={() => onBuyUpgrade(upgrade.id)}
                disabled={disabled}
              >
                <span><strong>{upgrade.name}</strong><small>{upgrade.description}</small></span>
                <em>{cost}g</em>
              </button>
            );
          })}
        </div>
        {state.feedback && <p className="shop-toast">{state.feedback.message}</p>}
        <button
          className={["primary-action", tutorialHealthBought ? "primary-action--tutorial" : ""].filter(Boolean).join(" ")}
          type="button"
          onClick={onContinue}
          disabled={tutorialBuyHealth}
        >
          Venture Onward
        </button>
      </section>
    </div>
  );
}
