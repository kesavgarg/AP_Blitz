"use client";

import { useActionState } from "react";
import { submitFeedbackAction } from "@/actions/student";
import type { ActionState } from "@/actions/auth";

export function FeedbackForm({
  subjects,
  videos,
}: {
  subjects: { id: string; name: string }[];
  videos: { id: string; title: string }[];
}) {
  const [state, action, pending] = useActionState(submitFeedbackAction, undefined as ActionState);
  return (
    <form action={action} className="space-y-3 rounded-3xl border border-white/10 bg-black/30 p-5">
      {state?.error ? <p className="text-sm text-coral">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-emerald-300">{state.success}</p> : null}
      <label className="block text-sm">Feedback type
        <select name="kind" className="mt-1 w-full rounded-2xl bg-ink px-3 py-3">
          <option value="general">General</option>
          <option value="video">A video</option>
          <option value="suggestion">Suggestion</option>
          <option value="bug">Something broke</option>
        </select>
      </label>
      <label className="block text-sm">AP subject, if it matters
        <select name="subjectId" className="mt-1 w-full rounded-2xl bg-ink px-3 py-3">
          <option value="">None</option>
          {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
        </select>
      </label>
      <label className="block text-sm">Related video
        <select name="videoId" className="mt-1 w-full rounded-2xl bg-ink px-3 py-3">
          <option value="">None</option>
          {videos.map((video) => <option key={video.id} value={video.id}>{video.title}</option>)}
        </select>
      </label>
      <label className="block text-sm">Message
        <textarea name="message" required className="mt-1 min-h-32 w-full rounded-2xl bg-ink px-3 py-3" />
      </label>
      <button disabled={pending} className="rounded-full bg-volt px-5 py-2 font-semibold text-ink">
        {pending ? "Sending…" : "Send feedback"}
      </button>
    </form>
  );
}
