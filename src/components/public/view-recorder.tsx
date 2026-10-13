"use client";

import { useEffect } from "react";
import { recordViewAction } from "@/actions/library";

export function ViewRecorder({ videoId }: { videoId: string }) {
  useEffect(() => {
    recordViewAction(videoId).catch(() => undefined);
  }, [videoId]);
  return null;
}
