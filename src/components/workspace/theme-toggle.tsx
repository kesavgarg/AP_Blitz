"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const saved = window.localStorage.getItem("apblitz-workspace-theme");
    const nextDark = saved !== "light";
    setDark(nextDark);
    const root = document.getElementById("workspace-root");
    if (!root) return;
    root.classList.toggle("ws-dark", nextDark);
    root.classList.toggle("ws-light", !nextDark);
  }, []);

  function toggle() {
    const nextDark = !dark;
    setDark(nextDark);
    window.localStorage.setItem("apblitz-workspace-theme", nextDark ? "dark" : "light");
    const root = document.getElementById("workspace-root");
    if (!root) return;
    root.classList.toggle("ws-dark", nextDark);
    root.classList.toggle("ws-light", !nextDark);
  }

  return (
    <button type="button" onClick={toggle} className="rounded-full border border-white/15 px-3 py-1 text-xs">
      {dark ? "Light mode" : "Dark mode"}
    </button>
  );
}
