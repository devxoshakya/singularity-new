"use client";

import { animate } from "framer-motion";
import { useEffect, useState } from "react";

type AnimatedTextOptions = {
  duration?: number;
  ease?: "linear" | "easeIn" | "easeOut" | "easeInOut";
};

export function useAnimatedText(
  text: string,
  delimiter: string = "",
  options?: AnimatedTextOptions,
) {
  const [cursor, setCursor] = useState(0);
  const [startingCursor, setStartingCursor] = useState(0);
  const [prevText, setPrevText] = useState(text);

  if (prevText !== text) {
    setPrevText(text);
    setStartingCursor(text.startsWith(prevText) ? cursor : 0);
  }

  useEffect(() => {
    const parts = text.split(delimiter);
    const duration = options?.duration ?? 5;
    const ease = options?.ease ?? "easeOut";
    
    const controls = animate(startingCursor, parts.length, {
      duration,
      ease,
      onUpdate(latest) {
        setCursor(Math.floor(latest));
      },
    });

    return () => controls.stop();
  }, [startingCursor, text, delimiter, options?.duration, options?.ease]);

  return text.split(delimiter).slice(0, cursor).join(delimiter);
}