"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const ALLOWED = ["/workspace/trends", "/workspace/kesav", "/workspace/commitment"];

export function OneTimeGate({ active, children }: { active: boolean; children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const blocked = active && path.startsWith("/workspace") && !ALLOWED.some((item) => path === item || path.startsWith(`${item}/`));

  useEffect(() => {
    if (blocked) router.replace("/workspace/trends");
  }, [blocked, router]);

  if (blocked) return null;
  return children;
}
