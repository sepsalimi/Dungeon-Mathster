// Verifies tutorial copy names the active puzzle target during combat onboarding.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TutorialOverlay } from "./TutorialOverlay";

describe("TutorialOverlay", () => {
  it("shows the current target during combat tutorial steps", () => {
    const html = renderToStaticMarkup(<TutorialOverlay step="swipe" target={18} onSkip={() => undefined} />);

    expect(html).toContain("Make 18");
    expect(html).toContain("Swipe along the glowing trail");
  });
});
