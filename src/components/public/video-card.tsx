import Link from "next/link";
import { youtubeThumb } from "@/lib/videos";
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
    subject: { name: string; color: string; ink: string };
  };
}) {
  const thumb = video.thumbnailUrl || youtubeThumb(video.url);
  return (
    <Link
      href={`/videos/watch/${video.id}`}
      className="group overflow-hidden rounded-[1.6rem] border border-white/10 bg-black/50 transition hover:-translate-y-0.5 hover:border-white/25"
    >
      <div className="relative aspect-video" style={{ backgroundColor: video.subject.color }}>
        {thumb ? (
          // External platform thumbnails. Next/Image would need a remote allowlist per host.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center px-4 text-center text-sm font-semibold" style={{ color: video.subject.ink }}>
            {video.platform === "instagram" ? "Open on Instagram" : video.subject.name}
          </div>
        )}
        <span
          className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold"
          style={{ backgroundColor: video.subject.color, color: video.subject.ink }}
        >
          {video.subject.name}
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
