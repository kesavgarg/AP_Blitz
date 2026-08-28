export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function fullName(user: { firstName: string; lastName: string }) {
  return `${user.firstName} ${user.lastName}`.trim();
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function youtubeIdFromUrl(url: string) {
  if (!url) return null;
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  return null;
}

export function initials(user: { firstName: string; lastName: string }) {
  return `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();
}

export const CONTENT_STATUS_LABELS: Record<string, string> = {
  IDEA: "Idea",
  IDEA_APPROVED: "Idea approved",
  SCRIPT_IN_PROGRESS: "Script in progress",
  SCRIPT_SUBMITTED: "Script submitted",
  SCRIPT_NEEDS_REVISION: "Script needs revision",
  SCRIPT_APPROVED: "Script approved",
  VIDEO_ASSIGNED: "Video assigned",
  VIDEO_IN_PROGRESS: "Recording",
  VIDEO_SUBMITTED: "Video submitted",
  WAITING_FOR_EDITOR: "Waiting for editor",
  EDITING: "Editing",
  EDIT_SUBMITTED: "Edit submitted",
  EDIT_NEEDS_REVISION: "Edit needs revision",
  GRAPHICS: "Graphics",
  SEO: "SEO",
  FINAL_REVIEW: "Final review",
  READY_TO_PUBLISH: "Ready to publish",
  PUBLISHED: "Published",
};

export const PIPELINE_STEPS = [
  { key: "IDEA", label: "Idea" },
  { key: "SCRIPT", label: "Script" },
  { key: "VIDEO", label: "Record" },
  { key: "EDIT", label: "Edit" },
  { key: "GRAPHICS", label: "Graphics" },
  { key: "SEO", label: "SEO" },
  { key: "REVIEW", label: "Review" },
  { key: "PUBLISHED", label: "Published" },
] as const;

export function pipelineIndex(status: string) {
  if (status === "IDEA") return 0;
  if (status === "IDEA_APPROVED" || status.startsWith("SCRIPT")) return 1;
  if (status.startsWith("VIDEO")) return 2;
  if (status === "WAITING_FOR_EDITOR" || status.startsWith("EDIT")) return 3;
  if (status === "GRAPHICS") return 4;
  if (status === "SEO") return 5;
  if (status === "FINAL_REVIEW" || status === "READY_TO_PUBLISH") return 6;
  if (status === "PUBLISHED") return 7;
  return 0;
}
