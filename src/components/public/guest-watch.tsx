"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { guestDeclined, readGuestVideo, rememberGuestVideo } from "@/lib/guest-watch";

export function RegisterToWatchMore({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-volt/40 bg-volt/10 px-4 py-3 text-sm ${className}`}>
      <p>You have to register to watch more videos.</p>
      <Link href="/register" className="mt-3 inline-flex rounded-full bg-volt px-4 py-2 font-semibold text-ink">
        Become a Blitzer
      </Link>
    </div>
  );
}

/** Records the one free video after they choose Not now. */
export function GuestWatchClaim({ videoId }: { videoId: string }) {
  const [used, setUsed] = useState(false);

  useEffect(() => {
    if (!guestDeclined()) return;
    const existing = readGuestVideo();
    if (!existing) rememberGuestVideo(videoId);
    setUsed(true);
  }, [videoId]);

  if (!used) return null;
  return <RegisterToWatchMore className="mt-4" />;
}
