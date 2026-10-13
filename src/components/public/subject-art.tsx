import type { SubjectIcon } from "@/lib/subjects";

export function SubjectArt({ icon }: { icon: string }) {
  const common = "h-24 w-24";
  if (icon === "geo") {
    return (
      <svg viewBox="0 0 80 80" className={common} aria-hidden>
        <circle cx="40" cy="40" r="28" fill="none" stroke="currentColor" strokeWidth="2.4" />
        <path d="M18 46c8-2 12-10 16-10s6 8 14 6 10-12 16-8" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M28 28c4 6 2 12-2 16" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="40" cy="22" r="3" fill="currentColor" />
        <path d="M40 25v14M34 33h12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (icon === "world") {
    return (
      <svg viewBox="0 0 80 80" className={common} aria-hidden>
        <path d="M18 50h44M22 44h36M26 38h28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M20 56h40v6H20z" fill="currentColor" opacity="0.35" />
        <circle cx="52" cy="26" r="10" fill="none" stroke="currentColor" strokeWidth="2.2" />
        <path d="M52 18v16M44 26h16" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }
  if (icon === "psych") {
    return (
      <svg viewBox="0 0 80 80" className={common} aria-hidden>
        <path d="M28 58c-8-6-10-18-4-28 6-10 20-14 30-6 8 6 10 18 4 28-4 8-16 14-30 6z" fill="none" stroke="currentColor" strokeWidth="2.2" />
        <path d="M34 40c4-8 10-10 16-6" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="32" cy="36" r="1.8" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 80 80" className={common} aria-hidden>
      <rect x="22" y="18" width="36" height="44" rx="6" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path d="M30 32h20M30 42h16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function isSubjectIcon(value: string): value is SubjectIcon {
  return ["geo", "world", "psych", "book", "capitol", "chart", "pen", "sigma", "leaf", "flask", "atom", "bolt", "code", "chat"].includes(value);
}
