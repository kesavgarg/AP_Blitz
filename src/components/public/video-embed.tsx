import { instagramEmbedFromUrl, youtubeIdFromUrl } from "@/lib/utils";

export function ClipEmbed({ url, title }: { url: string; title?: string }) {
  const ig = instagramEmbedFromUrl(url);
  if (ig) {
    return (
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-black">
        <iframe
          className="h-[28rem] w-full"
          src={ig}
          title={title ?? "AP Blitz reel"}
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  return <VideoEmbed url={url} type="youtube" />;
}

export function VideoEmbed({
  url,
  type,
}: {
  url: string;
  type: string;
}) {
  if (!url) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-3xl border border-dashed border-white/15 bg-black/50 p-8 text-center backdrop-blur-md">
        <div>
          <p className="font-display text-2xl">Founder video coming soon</p>
          <p className="mt-2 text-sm text-muted">
            Kesav will drop a walkthrough of what AP Blitz is, how the teams work,
            and what joining actually looks like. Admins can paste a YouTube link
            in Settings.
          </p>
        </div>
      </div>
    );
  }

  if (type === "file" || url.endsWith(".mp4") || url.endsWith(".webm")) {
    return (
      <video
        className="aspect-video w-full rounded-3xl border border-white/10 bg-black"
        controls
        src={url}
      />
    );
  }

  const yt = youtubeIdFromUrl(url);
  if (yt) {
    return (
      <div className="aspect-video overflow-hidden rounded-3xl border border-white/10">
        <iframe
          className="h-full w-full"
          src={`https://www.youtube.com/embed/${yt}`}
          title="What is AP Blitz?"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="aspect-video overflow-hidden rounded-3xl border border-white/10">
      <iframe className="h-full w-full" src={url} title="What is AP Blitz?" allowFullScreen />
    </div>
  );
}
