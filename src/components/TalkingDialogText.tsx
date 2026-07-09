// Renders a boss dialog line one character at a time and reports each spoken beat.
import { useEffect, useState } from "react";

const LETTER_STEP_MS = 58;

interface TalkingDialogTextProps {
  text: string;
  onSpeakTick: (index: number, character: string) => void;
  onTalkingChange: (isTalking: boolean) => void;
}

export function TalkingDialogText({ text, onSpeakTick, onTalkingChange }: TalkingDialogTextProps) {
  const [visibleCharacters, setVisibleCharacters] = useState(0);

  useEffect(() => {
    setVisibleCharacters(0);
    onTalkingChange(text.length > 0);
  }, [onTalkingChange, text]);

  useEffect(() => {
    if (visibleCharacters >= text.length) {
      onTalkingChange(false);
      return;
    }

    const timer = window.setTimeout(() => {
      const next = Math.min(visibleCharacters + 1, text.length);
      const nextCharacter = text[next - 1] ?? "";
      if (/[A-Za-z0-9]/.test(nextCharacter)) onSpeakTick(next, nextCharacter);
      setVisibleCharacters(next);
      if (next >= text.length) onTalkingChange(false);
    }, LETTER_STEP_MS);

    return () => window.clearTimeout(timer);
  }, [onSpeakTick, onTalkingChange, text, visibleCharacters]);

  return (
    <p className="talking-dialog-text" aria-label={text} aria-live="polite">
      <span aria-hidden="true">{text.slice(0, visibleCharacters)}</span>
      {visibleCharacters < text.length && <span className="dialog-cursor" aria-hidden="true" />}
    </p>
  );
}
