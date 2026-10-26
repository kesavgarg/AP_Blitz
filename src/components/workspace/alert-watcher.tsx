"use client";

import { useEffect, useRef } from "react";

const FAVICON = "/logo-ap-blitz.png";

function playPing() {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.08);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  } catch {
    // autoplay blocked until a click
  }
}

function drawBadgedFavicon(count: number) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, size, size);
    if (count > 0) {
      const label = count > 99 ? "99+" : String(count);
      ctx.beginPath();
      ctx.fillStyle = "#ef4444";
      const r = label.length > 2 ? 16 : 14;
      ctx.arc(size - r + 2, r - 2, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${label.length > 2 ? 18 : 22}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, size - r + 2, r - 1);
    }
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = canvas.toDataURL("image/png");
  };
  img.src = FAVICON;
}

export function AlertWatcher({ baseTitle }: { baseTitle: string }) {
  const last = useRef<number | null>(null);
  const unlocked = useRef(false);

  useEffect(() => {
    const unlock = () => {
      unlocked.current = true;
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function tick() {
      try {
        const res = await fetch("/api/alerts", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { unread: number };
        const unread = Number(data.unread) || 0;
        if (last.current !== unread) {
          document.title = unread > 0 ? `(${unread}) ${baseTitle}` : baseTitle;
          drawBadgedFavicon(unread);
        }
        if (last.current !== null && unread > last.current && unlocked.current) {
          playPing();
        }
        last.current = unread;
      } catch {
        // ignore polling errors
      }
    }
    tick();
    const id = window.setInterval(tick, 25000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [baseTitle]);

  return null;
}
