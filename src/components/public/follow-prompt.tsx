"use client";

import { useEffect, useId, useState } from "react";
import { usePathname } from "next/navigation";

const YES = "apblitz-ig-follow";
const SEEN = "apblitz-ig-follow-seen";
const QUIET = ["/apply", "/register", "/login", "/forgot-password", "/reset-password", "/setup-account"];

export function FollowPrompt({ instagramUrl }: { instagramUrl?: string }) {
  const path = usePathname();
  const titleId = useId();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!instagramUrl) return;
    if (QUIET.some((item) => path === item || path.startsWith(`${item}/`))) return;
    if (window.localStorage.getItem(YES) === "yes") return;
    if (window.sessionStorage.getItem(SEEN) === "1") return;
    const wait = 8000 + Math.floor(Math.random() * 12000);
    const timer = window.setTimeout(() => {
      if (Math.random() > 0.55) return;
      window.sessionStorage.setItem(SEEN, "1");
      setOpen(true);
    }, wait);
    return () => window.clearTimeout(timer);
  }, [instagramUrl, path]);

  if (!open || !instagramUrl) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/70 p-4 sm:place-items-center">
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="popup-in w-full max-w-md rounded-[1.8rem] border border-white/10 bg-[#111] p-6 text-paper">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-volt">AP Blitz</p>
        <h2 id={titleId} className="mt-3 font-display text-4xl leading-[0.95]">Do you follow AP Blitz?</h2>
        <p className="mt-3 text-sm text-paper/75">On Instagram. That is where the new videos show up.</p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            className="rounded-full bg-volt px-4 py-3 font-semibold text-ink"
            onClick={() => {
              window.localStorage.setItem(YES, "yes");
              setOpen(false);
            }}
          >
            Yes
          </button>
          <a href={instagramUrl} className="rounded-full border border-white/15 px-4 py-3 text-center font-semibold">
            No, take me to Instagram
          </a>
        </div>
      </div>
    </div>
  );
}
