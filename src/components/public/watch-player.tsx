"use client";

import { useState } from "react";
import { instagramEmbedFromUrl, youtubeIdFromUrl } from "@/lib/utils";
import { formatTimestamp } from "@/lib/videos";
import { recordProgressAction } from "@/actions/library";

export function WatchPlayer({
  videoId,
  title,
  url,
  platform,
  chapters,
  canSaveProgress,
}: {
  videoId: string;
  title: string;
  url: string;
  platform: string;
  chapters: { id: string; label: string; seconds: number }[];
  canSaveProgress: boolean;
}) {
  const [start, setStart] = useState(0);
  const youtubeId = youtubeIdFromUrl(url);
  const instagram = instagramEmbedFromUrl(url);

  async function jump(seconds: number) {
    setStart(seconds);
    if (canSaveProgress) await recordProgressAction(videoId, seconds);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
      <div>
        {youtubeId ? (
          <div className="aspect-video overflow-hidden rounded-[1.6rem] border border-white/10 bg-black">
            <iframe
              key={start}
              className="h-full w-full"
              src={`https://www.youtube.com/embed/${youtubeId}?start=${start}&rel=0`}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : instagram ? (
          <div className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-black">
            <iframe
              className="h-[32rem] w-full"
              src={instagram}
              title={title}
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
            />
            <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-paper/70">
                If the frame stays blank, Instagram is blocking the embed. Open the reel there instead.
              </p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-volt px-4 py-2 text-center text-sm font-semibold text-ink"
              >
                Open on Instagram
              </a>
            </div>
          </div>
        ) : (
          <div className="rounded-[1.6rem] border border-dashed border-white/15 bg-black/40 p-8">
            <p className="font-display text-2xl">This platform does not embed here.</p>
            <a href={url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex rounded-full bg-volt px-4 py-2 font-semibold text-ink">
              Open video
            </a>
          </div>
        )}
      </div>
      <aside className="rounded-[1.6rem] border border-white/10 bg-black/40 p-4">
        <h2 className="font-display text-2xl">Timestamps</h2>
        {platform !== "youtube" ? (
          <p className="mt-2 text-sm text-paper/60">
            Jumping to a timestamp works for YouTube. {platform === "instagram" ? "Instagram does not support seeking from AP Blitz." : "This link does not support seeking."}
          </p>
        ) : null}
        {chapters.length ? (
          <ol className="mt-4 space-y-2">
            {chapters.map((chapter) => (
              <li key={chapter.id}>
                {youtubeId ? (
                  <button
                    type="button"
                    onClick={() => jump(chapter.seconds)}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white/5 px-3 py-3 text-left hover:bg-white/10"
                  >
                    <span>{chapter.label}</span>
                    <span className="font-mono text-sm text-volt">{formatTimestamp(chapter.seconds)}</span>
                  </button>
                ) : (
                  <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/5 px-3 py-3">
                    <span>{chapter.label}</span>
                    <span className="font-mono text-sm text-volt">{formatTimestamp(chapter.seconds)}</span>
                  </div>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-sm text-muted">No timestamps yet.</p>
        )}
      </aside>
    </div>
  );
}
