export const GUEST_VIDEO_COOKIE = "apblitz_guest_video";
const DECLINED_KEY = "apblitz-guest-declined";
const VIDEO_KEY = "apblitz-guest-video";

function isVideoId(value: string) {
  return /^[a-z0-9]{8,40}$/i.test(value);
}

export function watchIdFromPath(raw: string) {
  const path = raw.split("?")[0]?.split("#")[0] ?? "";
  const match = path.match(/\/videos\/watch\/([^/]+)$/);
  return match?.[1] && isVideoId(match[1]) ? match[1] : null;
}

export function guestVideoFromCookie(value: string | undefined) {
  if (!value || !isVideoId(value)) return null;
  return value;
}

export function guestDeclined() {
  return window.localStorage.getItem(DECLINED_KEY) === "1";
}

export function readGuestVideo() {
  const value = window.localStorage.getItem(VIDEO_KEY);
  return value && isVideoId(value) ? value : null;
}

export function markGuestDeclined() {
  window.localStorage.setItem(DECLINED_KEY, "1");
}

/** One video, kept in this browser. It does not reset the next day. */
export function rememberGuestVideo(id: string) {
  if (!isVideoId(id)) return;
  window.localStorage.setItem(VIDEO_KEY, id);
  document.cookie = `${GUEST_VIDEO_COOKIE}=${id}; Max-Age=31536000; Path=/; SameSite=Lax`;
}
