export const WORK_STAGES = [
  { key: "TODO", label: "To Do" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "NEEDS_REVIEW", label: "Needs Review" },
  { key: "COMPLETED", label: "Completed" },
] as const;

export type WorkStageKey = (typeof WORK_STAGES)[number]["key"];

export function stageFromStatus(status: string): WorkStageKey {
  if (status === "PUBLISHED") return "COMPLETED";
  if (
    [
      "SCRIPT_SUBMITTED",
      "VIDEO_SUBMITTED",
      "EDIT_SUBMITTED",
      "EDIT_NEEDS_REVISION",
      "SCRIPT_NEEDS_REVISION",
      "FINAL_REVIEW",
      "READY_TO_PUBLISH",
    ].includes(status)
  ) {
    return "NEEDS_REVIEW";
  }
  if (
    [
      "SCRIPT_IN_PROGRESS",
      "SCRIPT_APPROVED",
      "VIDEO_IN_PROGRESS",
      "EDITING",
      "GRAPHICS",
      "SEO",
    ].includes(status)
  ) {
    return "IN_PROGRESS";
  }
  return "TODO";
}

export function isWorkStage(value: string): value is WorkStageKey {
  return WORK_STAGES.some((s) => s.key === value);
}
