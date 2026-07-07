import { shopUpgrades } from "../game/content";
import type { GameState, ShopUpgradeId } from "../game/types";
import { Hud } from "./Hud";

interface ShopViewProps {
  state: GameState;
  onBuyUpgrade: (id: ShopUpgradeId) => void;
  onContinue: () => void;
  onRestart: () => void;
}

export function ShopView({ state, onBuyUpgrade, onContinue, onRestart }: ShopViewProps) {
  return (
    <div className="game-screen">
      <Hud state={state} onRestart={onRestart} />
      <section className="shop-room" aria-label="Dungeon shop">
        <div className="merchant">
          <div className="merchant-sprite">
            <span />
          </div>
          <div>
            <span className="eyebrow">Torch Shop</span>
            <h1>Spend Gold</h1>
          </div>
        </div>
        <div className="upgrade-list">
          {shopUpgrades.map((upgrade) => {
            const affordable = state.player.gold >= upgrade.cost;
            return (
              <button
                key={upgrade.id}
                type="button"
                className="upgrade-row"
                onClick={() => onBuyUpgrade(upgrade.id)}
                disabled={!affordable}
              >
                <span>
                  <strong>{upgrade.name}</strong>
                  <small>{upgrade.description}</small>
                </span>
                <em>{upgrade.cost}g</em>
              </button>
            );
          })}
        </div>
        {state.feedback && <p className="shop-toast">{state.feedback.message}</p>}
        <button className="primary-action" type="button" onClick={onContinue}>
          Venture Onward
        </button>
      </section>
    </div>
  );
}
