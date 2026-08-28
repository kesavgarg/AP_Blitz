import "server-only";
import { cookies } from "next/headers";

const FLASH = "apblitz_flash";

export type FlashPayload = {
  kind: "accepted";
  email: string;
  tempPassword: string;
  role: string;
  name: string;
  emailSent: boolean;
  emailError?: string;
};

export async function setFlash(payload: FlashPayload) {
  const store = await cookies();
  store.set(FLASH, JSON.stringify(payload), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 5 * 60,
  });
}

export async function takeFlash(): Promise<FlashPayload | null> {
  const store = await cookies();
  const raw = store.get(FLASH)?.value;
  if (!raw) return null;
  store.delete(FLASH);
  try {
    return JSON.parse(raw) as FlashPayload;
  } catch {
    return null;
  }
}

export function generateTempPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  for (const b of bytes) suffix += alphabet[b % alphabet.length];
  return `Blitz-${suffix}`;
}
