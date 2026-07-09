// Verifies tutorial overlay markup keeps the step-specific styling hooks used
// by the larger guidance banner and pointer system.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TutorialOverlay } from "./TutorialOverlay";

describe("TutorialOverlay", () => {
  it("renders step-specific classes for visual pointers", () => {
    const html = renderToStaticMarkup(<TutorialOverlay step="gold" onSkip={() => undefined} />);

    expect(html).toContain("tutorial-banner--top");
    expect(html).toContain("tutorial-banner--gold");
    expect(html).toContain("Gold drops after a kill");
  });
});
