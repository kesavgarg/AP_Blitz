export type SubjectIcon =
  | "geo"
  | "world"
  | "psych"
  | "book"
  | "capitol"
  | "chart"
  | "pen"
  | "sigma"
  | "leaf"
  | "flask"
  | "atom"
  | "bolt"
  | "code"
  | "chat";

export type SubjectDef = {
  slug: string;
  name: string;
  color: string;
  ink: string;
  short: string;
  icon: SubjectIcon;
};

/**
 * Single source of truth for AP subject names and colors.
 * Change a color here — seed and app startup copy it onto every subject card,
 * filter, and dashboard chip.
 */
export const SUBJECTS: SubjectDef[] = [
  { slug: "ap-human-geography", name: "AP Human Geography", color: "#F0A202", ink: "#1A1203", short: "HuG", icon: "geo" },
  { slug: "ap-world-history", name: "AP World History: Modern", color: "#6272A8", ink: "#F7F4EE", short: "World", icon: "world" },
  { slug: "ap-psychology", name: "AP Psychology", color: "#E07A6F", ink: "#1A1203", short: "Psych", icon: "psych" },
  { slug: "ap-us-history", name: "AP US History", color: "#B94A3E", ink: "#FFF6F2", short: "APUSH", icon: "book" },
  { slug: "ap-european-history", name: "AP European History", color: "#7A5B3A", ink: "#FFF6EA", short: "Euro", icon: "book" },
  { slug: "ap-government", name: "AP Government", color: "#2F6F6A", ink: "#F3FFFD", short: "Gov", icon: "capitol" },
  { slug: "ap-macroeconomics", name: "AP Macroeconomics", color: "#1F7A4D", ink: "#F3FFF8", short: "Macro", icon: "chart" },
  { slug: "ap-microeconomics", name: "AP Microeconomics", color: "#3D8B6E", ink: "#F3FFF8", short: "Micro", icon: "chart" },
  { slug: "ap-english-language", name: "AP English Language", color: "#C46B2C", ink: "#1A1203", short: "Lang", icon: "pen" },
  { slug: "ap-english-literature", name: "AP English Literature", color: "#8C4A6B", ink: "#FFF5F8", short: "Lit", icon: "book" },
  { slug: "ap-calculus-ab", name: "AP Calculus AB", color: "#3A6EA5", ink: "#F3F8FF", short: "Calc AB", icon: "sigma" },
  { slug: "ap-calculus-bc", name: "AP Calculus BC", color: "#24507A", ink: "#F3F8FF", short: "Calc BC", icon: "sigma" },
  { slug: "ap-statistics", name: "AP Statistics", color: "#5B4B8A", ink: "#F6F3FF", short: "Stats", icon: "chart" },
  { slug: "ap-precalculus", name: "AP Precalculus", color: "#6E5AA8", ink: "#F6F3FF", short: "Precalc", icon: "sigma" },
  { slug: "ap-biology", name: "AP Biology", color: "#2E8B57", ink: "#F3FFF8", short: "Bio", icon: "leaf" },
  { slug: "ap-chemistry", name: "AP Chemistry", color: "#0E8A8A", ink: "#F3FFFE", short: "Chem", icon: "flask" },
  { slug: "ap-physics-1", name: "AP Physics 1", color: "#3D5A80", ink: "#F4F7FB", short: "Phys 1", icon: "atom" },
  { slug: "ap-physics-2", name: "AP Physics 2", color: "#4C6A92", ink: "#F4F7FB", short: "Phys 2", icon: "atom" },
  { slug: "ap-physics-c-mechanics", name: "AP Physics C: Mechanics", color: "#1D3557", ink: "#F4F7FB", short: "Mech", icon: "atom" },
  { slug: "ap-physics-c-em", name: "AP Physics C: E&M", color: "#E0A100", ink: "#1A1203", short: "E&M", icon: "bolt" },
  { slug: "ap-environmental-science", name: "AP Environmental Science", color: "#4F7D3A", ink: "#F4FFF3", short: "APES", icon: "leaf" },
  { slug: "ap-computer-science-a", name: "AP Computer Science A", color: "#22223B", ink: "#F4F4F8", short: "CSA", icon: "code" },
  { slug: "ap-computer-science-principles", name: "AP Computer Science Principles", color: "#3A3A6A", ink: "#F4F4F8", short: "CSP", icon: "code" },
  { slug: "ap-spanish", name: "AP Spanish", color: "#C73E54", ink: "#FFF5F6", short: "Spanish", icon: "chat" },
  { slug: "ap-french", name: "AP French", color: "#6B4C7A", ink: "#F8F4FF", short: "French", icon: "chat" },
  { slug: "ap-seminar", name: "AP Seminar", color: "#D9783A", ink: "#1A1203", short: "Seminar", icon: "chat" },
  { slug: "ap-research", name: "AP Research", color: "#8A5A2A", ink: "#FFF8F1", short: "Research", icon: "book" },
];

const ALIASES: Record<string, string> = {
  "ap world history": "ap-world-history",
  "ap world history modern": "ap-world-history",
  "ap world history: modern": "ap-world-history",
  "ap physics c: e&m": "ap-physics-c-em",
  "ap physics c em": "ap-physics-c-em",
  "ap physics c: mechanics": "ap-physics-c-mechanics",
};

export function slugifySubject(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

export function subjectBySlug(slug: string) {
  return SUBJECTS.find((s) => s.slug === slug) ?? null;
}

/** Exact name, slug, or a known alias. Returns null instead of guessing. */
export function subjectFromLabel(label: string | null | undefined) {
  if (!label) return null;
  const key = label.trim().toLowerCase();
  const alias = ALIASES[key];
  if (alias) return subjectBySlug(alias);
  return (
    SUBJECTS.find((s) => s.slug === key || s.name.toLowerCase() === key) ?? null
  );
}

export const AP_SUBJECTS = SUBJECTS.map((s) => s.name);
