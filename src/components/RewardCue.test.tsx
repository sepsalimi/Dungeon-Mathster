// Verifies reward pickup visuals are rendered from structured feedback.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RewardCue } from "./RewardCue";

describe("RewardCue", () => {
  it("renders a coin burst for gold rewards", () => {
    const html = renderToStaticMarkup(
      <RewardCue feedback={{ kind: "buy", message: "+18 gold", nonce: 1, rewards: [{ kind: "gold", amount: 18 }] }} />,
    );

    expect(html).toContain("coin-burst");
    expect(html.match(/<span><\/span>/g)?.length).toBe(9);
    expect(html).toContain("+18g");
  });

  it("renders a chest and flying item for item rewards", () => {
    const html = renderToStaticMarkup(
      <RewardCue
        feedback={{
          kind: "buy",
          message: "Sword purchased.",
          nonce: 2,
          rewards: [{ kind: "item", itemId: "sword" }],
        }}
      />,
    );

    expect(html).toContain("reward-chest");
    expect(html).toContain("reward-item-flight");
    expect(html).toContain("item-icon--sword");
  });
});
