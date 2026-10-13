"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/brand";

export function PublicHeader({
  signedIn,
  accountHref,
}: {
  signedIn: boolean;
  accountHref: string;
}) {
  const path = usePathname();
  const home = path === "/";
  const accountLabel = signedIn ? (accountHref.startsWith("/student") ? "My dashboard" : "Workspace") : "Log In";

  return (
    <header className="relative z-30">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <BrandMark size={home ? "md" : "sm"} />
        <nav className="flex flex-wrap items-center justify-end gap-2" aria-label="Primary">
          <Link href="/videos" className="rounded-full bg-volt px-4 py-2 text-sm font-semibold text-ink">
            Watch Videos
          </Link>
          <Link href="/join" className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold">
            Apply
          </Link>
          <Link href={signedIn ? accountHref : "/login"} className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold">
            {accountLabel}
          </Link>
          <Link href="/about" className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold">
            About Us
          </Link>
        </nav>
      </div>
    </header>
  );
}
