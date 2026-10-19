"use client";

import { useActionState, useState } from "react";
import { submitApplication, type ApplyState } from "@/actions/applications";
import { APPLY_LANES, type ApplyLaneId } from "@/lib/roles";

const inputClass =
  "mt-1.5 w-full rounded-2xl border border-white/10 bg-ink px-4 py-3 text-paper outline-none ring-volt/0 transition focus:border-volt/40 focus:ring-4 focus:ring-volt/10";

async function shrinkPhoto(file: File) {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.8));
  bitmap.close();
  if (!blob) return file;
  return new File([blob], "photo.jpg", { type: "image/jpeg" });
}

async function submitWithSmallPhoto(prev: ApplyState, formData: FormData): Promise<ApplyState> {
  try {
    const photo = formData.get("photo");
    if (photo instanceof File && photo.size > 0) {
      formData.set("photo", await shrinkPhoto(photo));
    }
    return await submitApplication(prev, formData);
  } catch (err) {
    console.error("[apply:form]", err);
    return { error: "The application did not send. Use a JPG or PNG photo and try again." };
  }
}

export function ApplyForm({ defaultLane }: { defaultLane?: ApplyLaneId }) {
  const [state, action, pending] = useActionState(submitWithSmallPhoto, undefined as ApplyState);
  const [lane, setLane] = useState<ApplyLaneId>(defaultLane ?? "one-video");
  const chosen = APPLY_LANES.find((item) => item.id === lane);

  return (
    <form action={action} className="space-y-10">
      {state?.error ? (
        <div className="rounded-2xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral">
          {state.error}
        </div>
      ) : null}

      <section className="rounded-3xl border border-white/10 bg-black/45 p-6 backdrop-blur-md">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-volt">Personal</p>
        <h2 className="mt-2 font-display text-2xl">Who are you?</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="First name *" name="firstName" error={state?.fieldErrors?.firstName} />
          <Field label="Last name *" name="lastName" error={state?.fieldErrors?.lastName} />
          <label className="block text-sm">
            Grade level *
            <select name="gradeLevel" required className={inputClass} defaultValue="">
              <option value="" disabled>Select grade</option>
              <option value="GRADE_9">9th Grade</option>
              <option value="GRADE_10">10th Grade</option>
              <option value="GRADE_11">11th Grade</option>
              <option value="GRADE_12">12th Grade</option>
            </select>
          </label>
          <Field label="High school *" name="highSchool" error={state?.fieldErrors?.highSchool} />
          <Field label="City / County *" name="cityCounty" error={state?.fieldErrors?.cityCounty} />
          <Field label="Personal email *" name="email" type="email" error={state?.fieldErrors?.email} />
          <Field label="Phone number *" name="phone" type="tel" error={state?.fieldErrors?.phone} />
          <p className="-mt-2 text-xs text-muted md:col-span-2">
            Use an inbox you actually check. Accept and decline emails go here.
          </p>
          <label className="block text-sm md:col-span-2">
            Photo of yourself *
            <p className="mt-1 text-xs text-muted">Required. Kesav sees this with your application.</p>
            <input name="photo" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic" required className={`${inputClass} file:mr-3 file:rounded-full file:border-0 file:bg-volt file:px-3 file:py-1 file:text-sm file:font-semibold file:text-ink`} />
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-black/45 p-6 backdrop-blur-md">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan">Academic</p>
        <h2 className="mt-2 font-display text-2xl">What APs are you in?</h2>
        <label className="mt-6 block text-sm">
          What are your major AP classes at school? *
          <p className="mt-1 text-xs text-muted">We recommend listing all of your AP classes.</p>
          <textarea name="apClasses" required rows={5} className={inputClass} />
          {state?.fieldErrors?.apClasses ? <p className="mt-1 text-xs text-coral">{state.fieldErrors.apClasses[0]}</p> : null}
        </label>
      </section>

      <section className="rounded-3xl border border-white/10 bg-black/45 p-6 backdrop-blur-md">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet">Role</p>
        <h2 className="mt-2 font-display text-2xl">What are you signing up to do?</h2>
        <div className="mt-6 grid gap-3">
          {APPLY_LANES.map((item) => (
            <label key={item.id} className={`rounded-2xl border p-4 ${lane === item.id ? "border-volt bg-volt/10" : "border-white/10"}`}>
              <span className="flex items-start gap-3">
                <input
                  type="radio"
                  name="lane"
                  value={item.id}
                  checked={lane === item.id}
                  onChange={() => setLane(item.id)}
                  required
                />
                <span>
                  <span className="block font-semibold">{item.name}</span>
                  <span className="mt-1 block text-sm text-paper/70">{item.description}</span>
                </span>
              </span>
            </label>
          ))}
        </div>
        {chosen?.choosesVideos ? (
          <fieldset className="mt-5 rounded-2xl border border-white/10 p-4">
            <legend className="text-sm font-semibold">What kind of videos? *</legend>
            <div className="mt-3 grid gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="videoLane" value="EDUCATIONAL" required />
                Educational videos
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="videoLane" value="PROMOTIONAL" />
                Only promotional videos
              </label>
            </div>
          </fieldset>
        ) : (
          <input type="hidden" name="videoLane" value="" />
        )}
      </section>

      <section className="rounded-3xl border border-white/10 bg-black/45 p-6 backdrop-blur-md">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral">Experience</p>
        <h2 className="mt-2 font-display text-2xl">Have you done this before?</h2>
        <p className="mt-2 text-sm text-muted">
          Prior experience helps, but it is not required. If you&apos;re new, tell us why you want to learn it here.
        </p>
        <textarea name="experience" rows={5} className={`${inputClass} mt-4`} />
      </section>

      <section className="rounded-3xl border border-white/10 bg-black/45 p-6 backdrop-blur-md">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-volt">Before you apply</p>
        <h2 className="mt-2 font-display text-2xl">Read this.</h2>
        <div className="mt-6 space-y-5">
          <YesNo
            name="keepSiteOpen"
            question="You need to keep the AP Blitz website open. That is how you get notifications. Do you understand?"
          />
          <YesNo
            name="canBeRemoved"
            question="You can get kicked if you disappear, miss the work, or stop showing up. Do you understand?"
          />
          <YesNo
            name="weeklyDeadline"
            question="You will be given a deadline to make a video, and you need to make at least one thing every week. Do you understand?"
          />
        </div>
        <label className="mt-8 block text-sm">
          Imagine that you realize you will not be able to meet a deadline for an assignment. What should you do? *
          <p className="mt-1 text-xs text-muted">
            Hint: disappearing is the wrong answer. Talk to a team lead or admin as soon as you know.
          </p>
          <textarea name="deadlineScenario" required rows={5} className={inputClass} />
          {state?.fieldErrors?.deadlineScenario ? (
            <p className="mt-1 text-xs text-coral">{state.fieldErrors.deadlineScenario[0]}</p>
          ) : null}
        </label>
      </section>

      <section className="rounded-3xl border border-white/10 bg-black/45 p-6 backdrop-blur-md">
        <h2 className="font-display text-2xl">Anything else?</h2>
        <textarea name="additionalInfo" rows={4} className={`${inputClass} mt-4`} />
        <p className="mt-4 text-sm text-muted">Questions? Email kesavgarg@gmail.com or text +1 (404) 213-9019.</p>
      </section>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-volt py-4 font-semibold text-ink disabled:opacity-60 md:w-auto md:px-10"
      >
        {pending ? "Sending…" : "Submit application"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  error,
}: {
  label: string;
  name: string;
  type?: string;
  error?: string[];
}) {
  return (
    <label className="block text-sm">
      {label}
      <input name={name} type={type} required className={inputClass} />
      {error ? <p className="mt-1 text-xs text-coral">{error[0]}</p> : null}
    </label>
  );
}

function YesNo({ name, question }: { name: string; question: string }) {
  return (
    <fieldset className="rounded-2xl border border-white/10 bg-ink/40 p-4">
      <legend className="text-sm">{question} *</legend>
      <div className="mt-3 flex gap-6 text-sm">
        <label className="flex items-center gap-2">
          <input type="radio" name={name} value="YES" required /> Yes
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name={name} value="NO" /> No
        </label>
      </div>
    </fieldset>
  );
}
