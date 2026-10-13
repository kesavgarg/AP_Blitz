import Link from "next/link";
import { SubjectArt } from "@/components/public/subject-art";

export function SubjectCard({
  href,
  name,
  color,
  ink,
  icon,
  count,
  badge,
}: {
  href: string;
  name: string;
  color: string;
  ink: string;
  icon: string;
  count: number;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex min-h-60 flex-col justify-between overflow-hidden rounded-[1.75rem] p-6 shadow-[0_24px_50px_-28px_rgba(0,0,0,0.85)] transition duration-200 hover:-translate-y-1"
      style={{ backgroundColor: color, color: ink }}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-70">
          {count} {count === 1 ? "video" : "videos"}
        </p>
        {badge ? (
          <span className="rounded-full bg-black/15 px-2 py-1 text-[11px] font-bold">{badge}</span>
        ) : null}
      </div>
      <SubjectArt icon={icon} />
      <h3 className="relative font-display text-[1.7rem] leading-[0.95]">{name}</h3>
    </Link>
  );
}
