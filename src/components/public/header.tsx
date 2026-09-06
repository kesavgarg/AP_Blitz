"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandMark } from "@/components/brand";

export function PublicHeader({
  signedIn,
}: {
  signedIn: boolean;
}) {
  const [open, setOpen] = useState(false);
  const links = [
    { href: "/#about", label: "About" },
    { href: "/#examples", label: "Examples" },
    { href: "/#video", label: "The video" },
    { href: "/join", label: "Roles" },
    { href: "/apply", label: "Apply" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/55 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4">
        <BrandMark />
        <nav className="hidden items-center gap-7 text-sm text-paper/80 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-volt">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          {signedIn ? (
            <Link
              href="/workspace"
              className="rounded-full bg-volt px-4 py-2 text-sm font-semibold text-ink"
            >
              Open workspace
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold hover:border-volt/50 hover:text-volt"
              >
                Team login
              </Link>
              <Link
                href="/join"
                className="rounded-full bg-volt px-4 py-2 text-sm font-semibold text-ink"
              >
                Join the team
              </Link>
            </>
          )}
        </div>
        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          <span className="flex flex-col gap-1.5">
            <span className="block h-0.5 w-5 bg-paper" />
            <span className="block h-0.5 w-5 bg-paper" />
          </span>
        </button>
      </div>
      {open ? (
        <div className="border-t border-white/10 px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3 text-sm">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            <Link
              href={signedIn ? "/workspace" : "/login"}
              className="rounded-full border border-white/20 px-4 py-2 text-center font-semibold"
              onClick={() => setOpen(false)}
            >
              {signedIn ? "Workspace" : "Team login"}
            </Link>
            <Link
              href="/apply"
              className="rounded-full bg-volt px-4 py-2 text-center font-semibold text-ink"
              onClick={() => setOpen(false)}
            >
              Apply
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
