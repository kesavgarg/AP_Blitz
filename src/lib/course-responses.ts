export type WrittenKind = "FRQ" | "SAQ" | "DBQ" | "LEQ";

export type WrittenPrompt = {
  kind: WrittenKind;
  label: string;
  hint: string;
};

const HISTORY = new Set(["ap-world-history", "ap-us-history", "ap-european-history"]);

/** Written questions this course has to include on every unit. */
export function writtenPrompts(subjectSlug: string): WrittenPrompt[] {
  if (HISTORY.has(subjectSlug)) {
    return [
      { kind: "SAQ", label: "SAQ", hint: "Short-answer questions for this unit." },
      { kind: "DBQ", label: "DBQ", hint: "Document-based question for this unit." },
      { kind: "LEQ", label: "LEQ", hint: "Long essay question for this unit." },
    ];
  }
  if (subjectSlug === "ap-english-language") {
    return [
      {
        kind: "FRQ",
        label: "Essays",
        hint: "Synthesis, rhetorical analysis, and argument prompts for this unit.",
      },
    ];
  }
  if (subjectSlug === "ap-english-literature") {
    return [
      {
        kind: "FRQ",
        label: "Essays",
        hint: "Poetry, prose, and literary argument prompts for this unit.",
      },
    ];
  }
  return [
    {
      kind: "FRQ",
      label: "FRQ",
      hint: "Free-response questions for this unit. Match the type this AP exam actually uses.",
    },
  ];
}
