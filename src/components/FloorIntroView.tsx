// Floor entry screen: scrolling floor title, ready prompt, and fade into combat.
import { useEffect, useState } from "react";

interface FloorIntroViewProps {
  floor: number;
  showScroll: boolean;
  onReady: () => void;
}

type IntroStage = "scroll" | "prompt" | "fade";

export function FloorIntroView({ floor, showScroll, onReady }: FloorIntroViewProps) {
  const [stage, setStage] = useState<IntroStage>(showScroll ? "scroll" : "prompt");

  useEffect(() => {
    setStage(showScroll ? "scroll" : "prompt");
  }, [floor, showScroll]);

  useEffect(() => {
    if (stage !== "scroll") return;
    const timer = window.setTimeout(() => setStage("prompt"), 5_200);
    return () => window.clearTimeout(timer);
  }, [stage]);

  const handleReady = () => {
    setStage("fade");
    window.setTimeout(onReady, 700);
  };

  return (
    <section className={`floor-intro floor-intro--${stage}`} aria-label={`Floor ${floor} intro`}>
      <div className="floor-intro__backdrop" />
      {showScroll && (
        <div className="floor-intro__crawl-wrap" aria-hidden={stage !== "scroll"}>
          <div className="floor-intro__crawl">
            <p className="floor-intro__crawl-eyebrow">Descending into</p>
            <h1>Floor {floor}</h1>
            <p className="floor-intro__crawl-copy">
              {floor === 1
                ? "The first chamber waits below. Solve the grid, strike true, and survive the counterattacks."
                : `The dungeon deepens. Floor ${floor} brings sharper math and harder hits.`}
            </p>
          </div>
        </div>
      )}
      {stage !== "scroll" && (
        <div className="floor-intro__prompt">
          {!showScroll && <p className="floor-intro__crawl-eyebrow">Floor {floor}</p>}
          <h1>Are you ready?</h1>
          <button className="primary-action" type="button" onClick={handleReady}>
            Ready
          </button>
        </div>
      )}
    </section>
  );
}
