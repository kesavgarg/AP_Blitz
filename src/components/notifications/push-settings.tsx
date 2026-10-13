"use client";

import { useState } from "react";
import { removePushSubscriptionAction, savePushSubscriptionAction } from "@/actions/student";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

export function PushSettings({
  configured,
  publicKey,
  subscribed,
}: {
  configured: boolean;
  publicKey: string;
  subscribed: boolean;
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const supported = typeof window === "undefined" ? true : "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;

  async function enable() {
    setMessage("");
    if (!configured || !publicKey) {
      setMessage("Push is not configured on the server yet. Add VAPID keys, then try again.");
      return;
    }
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setMessage("This browser does not support web push.");
      return;
    }
    if (Notification.permission === "denied") {
      setMessage("Notifications are blocked. Enable them in your browser settings for this site, then come back. AP Blitz will not ask again until you do.");
      return;
    }
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage(permission === "denied"
          ? "Permission was denied. You can turn notifications back on in the browser site settings."
          : "Permission was dismissed. Tap Enable when you want to try again.");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing || await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) {
        setMessage("The browser did not return a usable subscription.");
        return;
      }
      const saved = await savePushSubscriptionAction({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      });
      setMessage(saved && "error" in saved && saved.error ? saved.error : "Phone notifications are on for this device.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not enable notifications.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setMessage("");
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const existing = await registration.pushManager.getSubscription();
        await existing?.unsubscribe();
      }
      await removePushSubscriptionAction();
      setMessage("Notifications are off for this account on this device.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not turn notifications off.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-black/40 p-5 text-paper">
      <h2 className="font-display text-2xl">Phone notifications</h2>
      <p className="mt-2 text-sm text-paper/70">
        AP Blitz can send web push when this site is installed or open in a supported browser.
        On iPhone, add AP Blitz to your Home Screen and open the installed app. Safari tabs on iOS do not receive web push.
      </p>
      {!configured ? (
        <p className="mt-3 rounded-2xl bg-coral/15 px-3 py-2 text-sm text-coral">
          Server push is not fully configured. Set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT. Until then, in-app notifications still work and nothing is sent to a phone.
        </p>
      ) : null}
      {!supported ? <p className="mt-3 text-sm text-paper/70">This browser cannot subscribe to push.</p> : null}
      <p className="mt-3 text-sm">{subscribed ? "This account has a saved push subscription." : "No push subscription is saved yet."}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={enable} disabled={busy} className="rounded-full bg-volt px-4 py-2 text-sm font-semibold text-ink">
          {busy ? "Working…" : "Enable notifications"}
        </button>
        <button type="button" onClick={disable} disabled={busy} className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold">
          Disable notifications
        </button>
      </div>
      {message ? <p className="mt-3 text-sm text-paper/80">{message}</p> : null}
    </section>
  );
}
