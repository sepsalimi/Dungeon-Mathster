// Floor entry screen: scrolling floor title, ready prompt, and fade into combat.
import { useState } from "react";

interface FloorIntroViewProps {
  floor: number;
  showScroll: boolean;
  onReady: () => void;
}

type IntroStage = "intro" | "fade";

export function FloorIntroView({ floor, showScroll, onReady }: FloorIntroViewProps) {
  const [stage, setStage] = useState<IntroStage>("intro");

  const handleReady = () => {
    setStage("fade");
    window.setTimeout(onReady, 700);
  };

  return (
    <section className={`floor-intro floor-intro--${stage}`} aria-label={`Floor ${floor} intro`}>
      <div className="floor-intro__backdrop" />
      <div className="floor-intro__content">
        <div className={showScroll ? "floor-intro__crawl" : "floor-intro__crawl floor-intro__crawl--static"}>
          <p className="floor-intro__crawl-eyebrow">Descending into</p>
          <h1>Floor {floor}</h1>
          {showScroll && (
            <p className="floor-intro__crawl-copy">
              {floor === 1
                ? "The first chamber waits below. Solve the grid, strike true, and survive the counterattacks."
                : `The dungeon deepens. Floor ${floor} brings sharper math and harder hits.`}
            </p>
          )}
        </div>
        <div className="floor-intro__prompt">
          <h1>Are you ready?</h1>
          <button className="primary-action" type="button" onClick={handleReady}>
            Ready
          </button>
        </div>
      </div>
    </section>
  );
}
