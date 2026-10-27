"use client";

import { useState } from "react";

export function GuideVideo({ fileId }: { fileId: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="mt-6 rounded-3xl border border-white/20 bg-[#17171c] p-5 text-sm text-[#f6f1e8]">
        This video did not load. Refresh the page. If it stays blank, Kesav still needs to upload it from Settings.
      </div>
    );
  }

  return (
    <video
      src={`/api/files/${fileId}`}
      controls
      playsInline
      preload="none"
      onError={() => setFailed(true)}
      className="mt-6 aspect-video max-h-[70vh] w-full rounded-3xl border border-white/20 bg-[#17171c] object-contain"
    />
  );
}
