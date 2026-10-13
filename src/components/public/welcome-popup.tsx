"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "apblitz-welcome-dismissed";
const QUIET = ["/apply", "/register", "/forgot-password", "/reset-password", "/login", "/setup-account"];

export function WelcomePopup({
  instagramUrl,
  signedIn,
}: {
  instagramUrl: string;
  signedIn: boolean;
}) {
  const path = usePathname();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const quiet = QUIET.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

  useEffect(() => {
    if (signedIn || quiet) {
      setOpen(false);
      setReady(true);
      return;
    }
    const dismissed = window.localStorage.getItem(STORAGE_KEY) === "1";
    setOpen(!dismissed);
    setReady(true);
  }, [path, quiet, signedIn]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [open]);

  function close() {
    window.localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  }

  function reopen() {
    window.localStorage.removeItem(STORAGE_KEY);
    setOpen(true);
  }

  if (!ready || quiet) return null;

  return (
    <>
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
              Want to get a 5 on your AP exams?
            </h2>
            <p className="mt-3 text-sm leading-6 text-paper/75">
              Make AP studying easier with free, student-friendly AP review videos.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Link
                href="/videos"
                onClick={close}
                className="rounded-full bg-volt px-4 py-3 text-center font-semibold text-ink"
              >
                Watch Videos
              </Link>
              {instagramUrl ? (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-white/15 px-4 py-3 text-center font-semibold"
                >
                  Follow Us on Instagram
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="rounded-full border border-white/10 px-4 py-3 text-center text-sm text-paper/50"
                >
                  Follow Us on Instagram
                  <span className="mt-1 block text-xs">The Instagram link has not been added in settings yet.</span>
                </button>
              )}
              <button type="button" onClick={close} className="rounded-full px-4 py-3 text-sm text-paper/70">
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      ) : signedIn ? null : (
        <button
          type="button"
          onClick={reopen}
          className="fixed bottom-4 left-4 z-40 rounded-full border border-white/15 bg-black/80 px-4 py-2 text-sm font-semibold text-paper backdrop-blur"
        >
          Want a 5?
        </button>
      )}
    </>
  );
}
