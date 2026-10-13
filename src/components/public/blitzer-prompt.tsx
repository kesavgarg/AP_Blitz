"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

const KEY = "apblitz-blitzer-prompt";

function isLibraryDestination(raw: string) {
  const path = raw.split("?")[0];
  return path === "/videos" || path.startsWith("/videos/");
}

export function BlitzerPrompt({
  ask,
  children,
}: {
  ask: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [href, setHref] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => {
      previous?.focus();
    };
  }, [open]);

  function onClickCapture(event: React.MouseEvent<HTMLDivElement>) {
    if (!ask || window.sessionStorage.getItem(KEY) === "1") return;
    const link = (event.target as HTMLElement).closest("a");
    const raw = link?.getAttribute("href");
    if (!raw || !isLibraryDestination(raw)) return;
    event.preventDefault();
    event.stopPropagation();
    setHref(raw);
    setOpen(true);
  }

  function keepBrowsing() {
    window.sessionStorage.setItem(KEY, "1");
    setOpen(false);
    if (href) router.push(href);
  }

  return (
    <div onClickCapture={onClickCapture}>
      {children}
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/70 p-4 sm:place-items-center">
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className="popup-in w-full max-w-md rounded-[1.8rem] border border-white/10 bg-[#111] p-6 text-paper shadow-2xl outline-none"
          >
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-volt">AP Blitz</p>
            <h2 id={titleId} className="mt-3 font-display text-4xl leading-[0.95]">
              Become a Blitzer
            </h2>
            <p className="mt-3 text-sm leading-6 text-paper/75">
              Make a free account to save videos, pick your AP classes, and request topics. This is not a team application.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Link href="/register" className="rounded-full bg-volt px-4 py-3 text-center font-semibold text-ink">
                Become a Blitzer
              </Link>
              <button type="button" onClick={keepBrowsing} className="rounded-full border border-white/15 px-4 py-3 text-sm font-semibold">
                Not now
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
