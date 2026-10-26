"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { oneTimePathAllowed } from "@/lib/one-time-paths";

export function OneTimeGate({ active, children }: { active: boolean; children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const blocked = active && path.startsWith("/workspace") && !oneTimePathAllowed(path);

  useEffect(() => {
    if (blocked) router.replace("/workspace/about");
  }, [blocked, router]);

  if (blocked) {
    return (
      <div className="rounded-3xl border border-white/15 bg-[#17171c] p-6 text-[#f6f1e8]">
        <p className="font-display text-2xl">Opening your steps</p>
        <p className="mt-2 text-sm text-white/70">This page is outside the one-video path.</p>
      </div>
    );
  }
  return children;
}
