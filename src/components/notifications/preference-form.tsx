import { saveNotificationPreferencesAction } from "@/actions/student";

const FIELDS = [
  ["newVideos", "New AP videos"],
  ["subjectVideos", "New videos for my AP classes"],
  ["announcements", "Announcements"],
  ["requestUpdates", "Updates on video requests"],
  ["teamMessages", "Team messages"],
  ["deadlines", "Deadlines"],
  ["meetings", "Meeting reminders"],
] as const;

export function PreferenceForm({
  values,
  audience,
}: {
  values: Record<(typeof FIELDS)[number][0], boolean>;
  audience: "student" | "team";
}) {
  const visible = FIELDS.filter(([key]) => {
    if (audience === "student") return !["teamMessages", "deadlines", "meetings"].includes(key);
    return key !== "subjectVideos";
  });
  return (
    <form action={saveNotificationPreferencesAction} className="rounded-3xl border border-white/10 bg-black/30 p-5 text-paper">
      <input type="hidden" name="scope" value={audience} />
      <h2 className="font-display text-2xl">What to send</h2>
      <div className="mt-4 space-y-2">
        {visible.map(([key, label]) => (
          <label key={key} className="flex items-center gap-3 text-sm">
            <input type="checkbox" name={key} defaultChecked={values[key]} />
            {label}
          </label>
        ))}
      </div>
      <button className="mt-4 rounded-full bg-volt px-4 py-2 text-sm font-semibold text-ink">Save preferences</button>
    </form>
  );
}
