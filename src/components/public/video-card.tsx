import Link from "next/link";
import { PROMOTIONAL_LOGO, SUBJECT_LOGOS } from "@/lib/subjects";
import { SubjectArt } from "@/components/public/subject-art";
import { formatDate } from "@/lib/utils";

export function VideoCard({
  video,
}: {
  video: {
    id: string;
    title: string;
    description: string;
    url: string;
    thumbnailUrl: string | null;
    platform: string;
    unit: string | null;
    publishedAt: Date | null;
    promotional?: boolean;
    subject: { name: string; color: string; ink: string; slug?: string; icon?: string };
  };
}) {
  const logo = video.promotional
    ? PROMOTIONAL_LOGO
    : video.subject.slug
      ? SUBJECT_LOGOS[video.subject.slug]
      : undefined;
  return (
    <Link
      href={`/videos/watch/${video.id}`}
      className="group overflow-hidden rounded-[1.6rem] border border-white/10 bg-black/50 transition hover:-translate-y-0.5 hover:border-white/25"
    >
      <div className="relative aspect-video overflow-hidden" style={{ backgroundColor: video.promotional ? "#111111" : video.subject.color }}>
        {logo ? (
          // Same full-bleed mark on every video in a subject.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center" style={{ color: video.subject.ink }}>
            <SubjectArt icon={video.subject.icon || "book"} />
          </div>
        )}
        <span className="absolute left-3 top-3 z-10 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold text-white">
          {video.promotional ? "Promotional" : video.subject.name}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-display text-xl leading-tight group-hover:text-volt">{video.title}</h3>
        {video.unit ? <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-volt">{video.unit}</p> : null}
        {video.description ? <p className="mt-2 line-clamp-2 text-sm text-muted">{video.description}</p> : null}
        <p className="mt-3 text-xs text-paper/45">
          {video.publishedAt ? formatDate(video.publishedAt) : "Draft"} · {video.platform}
        </p>
      </div>
    </Link>
  );
}
