"use client";

import { useEffect } from "react";

function vibrate() {
  try {
    navigator.vibrate?.(14);
  } catch {
    // desktop / denied
  }
}

export function HapticRoot() {
  useEffect(() => {
    const onDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const node = (event.target as HTMLElement | null)?.closest?.(
        "a, button, summary, select, label, [role='button'], input[type='submit'], input[type='button'], input[type='checkbox'], input[type='radio'], input[type='file']",
      );
      if (!node) return;
      vibrate();
      node.classList.add("is-pressed");
      window.setTimeout(() => node.classList.remove("is-pressed"), 140);
    };
    document.addEventListener("pointerdown", onDown, { passive: true });
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);
  return null;
}
