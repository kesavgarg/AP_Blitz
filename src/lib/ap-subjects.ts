export const AP_SUBJECTS = [
  "AP US History",
  "AP World History",
  "AP European History",
  "AP Government",
  "AP Macroeconomics",
  "AP Microeconomics",
  "AP Psychology",
  "AP Human Geography",
  "AP English Language",
  "AP English Literature",
  "AP Calculus AB",
  "AP Calculus BC",
  "AP Statistics",
  "AP Precalculus",
  "AP Biology",
  "AP Chemistry",
  "AP Physics 1",
  "AP Physics 2",
  "AP Physics C: Mechanics",
  "AP Physics C: E&M",
  "AP Environmental Science",
  "AP Computer Science A",
  "AP Computer Science Principles",
  "AP Spanish",
  "AP French",
  "AP Seminar",
  "AP Research",
] as const;

export function slugifySubject(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}
