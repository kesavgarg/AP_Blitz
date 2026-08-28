"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/actions/auth";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string; icon: string };

export function WorkspaceNav({
  items,
  name,
  roleLabel,
}: {
  items: NavItem[];
  name: string;
  roleLabel: string;
}) {
  const path = usePathname();
  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-black/5 bg-white md:flex md:flex-col">
        <div className="flex h-20 items-center gap-2 border-b border-black/5 px-3">
          <Link href="/workspace" className="flex items-center">
            <Image src="/logo-ap-blitz.png" alt="AP Blitz" width={56} height={56} className="h-14 w-14 rounded-xl object-cover" />
          </Link>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map((item) => {
            const active = path === item.href || path.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-sm",
                  active ? "bg-ink text-paper" : "text-ink/70 hover:bg-black/5",
                )}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <form action={logoutAction} className="border-t border-black/5 p-4">
          <p className="text-sm font-medium text-ink">{name}</p>
          <p className="text-xs text-ink/50">{roleLabel}</p>
          <button className="mt-3 text-xs text-ink/60 hover:text-ink">Sign out</button>
        </form>
      </aside>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex overflow-x-auto border-t border-black/10 bg-white px-2 py-2 md:hidden">
        {items.slice(0, 5).map((item) => {
          const active = path === item.href || path.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-[4.5rem] flex-1 flex-col items-center rounded-xl px-2 py-1 text-[10px]",
                active ? "text-ink" : "text-ink/50",
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
