import "server-only";
import webpush from "web-push";
import { prisma } from "@/lib/prisma";

export function vapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY?.trim() || "";
}

export function pushConfigured() {
  return Boolean(vapidPublicKey() && process.env.VAPID_PRIVATE_KEY?.trim() && process.env.VAPID_SUBJECT?.trim());
}

function configure() {
  if (!pushConfigured()) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!.trim(),
    vapidPublicKey(),
    process.env.VAPID_PRIVATE_KEY!.trim(),
  );
  return true;
}

export async function deliverPush(
  userId: string,
  payload: { title: string; body: string; href?: string | null },
) {
  if (!configure()) return { sent: 0, reason: "not_configured" as const };
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  let sent = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          href: payload.href || "/",
        }),
      );
      sent += 1;
    } catch (err) {
      const status = typeof err === "object" && err && "statusCode" in err ? Number(err.statusCode) : 0;
      if (status === 404 || status === 410) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => undefined);
      } else {
        console.error("[push]", status || err);
      }
    }
  }
  return { sent, reason: sent ? ("sent" as const) : ("no_subscription" as const) };
}
