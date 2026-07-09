// Verifies tutorial overlay markup keeps the step-specific styling hooks used
// by the larger guidance banner and pointer system.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TutorialOverlay } from "./TutorialOverlay";

describe("TutorialOverlay", () => {
  it("shows the current target during combat tutorial steps", () => {
    const html = renderToStaticMarkup(<TutorialOverlay step="swipe" target={18} onSkip={() => undefined} />);

    expect(html).toContain("Make 18");
    expect(html).toContain("Swipe along the glowing trail");
  });

  it("renders step-specific classes for visual pointers", () => {
    const html = renderToStaticMarkup(<TutorialOverlay step="gold" onSkip={() => undefined} />);

    expect(html).toContain("tutorial-banner--top");
    expect(html).toContain("tutorial-banner--gold");
    expect(html).toContain("Gold drops after a kill");
  });

  it("renders the health purchase confirmation step", () => {
    const html = renderToStaticMarkup(<TutorialOverlay step="healthBought" onSkip={() => undefined} />);

    expect(html).toContain("tutorial-banner--healthBought");
    expect(html).toContain("Health increased and gold was spent");
  });
});
