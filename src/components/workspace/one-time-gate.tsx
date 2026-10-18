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

  if (blocked) return null;
  return children;
}
