"use client";

import { useActionState, useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { submitApplication, type ApplyState } from "@/actions/applications";
import { APPLY_LANES, type ApplyLaneId } from "@/lib/roles";

const inputClass =
  "mt-1.5 w-full rounded-2xl border border-white/10 bg-ink px-4 py-3 text-paper outline-none ring-volt/0 transition focus:border-volt/40 focus:ring-4 focus:ring-volt/10";

function isNextRedirect(err: unknown) {
  return (
    typeof err === "object" &&
    err !== null &&
    "digest" in err &&
    typeof err.digest === "string" &&
    err.digest.startsWith("NEXT_REDIRECT")
  );
}

function isPhonePhoto(file: File) {
  if (file.type === "image/gif") return false;
  if (file.type.startsWith("image/")) return true;
  if (/\.(jpe?g|png|webp|hei[cf])$/i.test(file.name)) return true;
  // iPhone's photo picker often leaves the file type blank.
  return file.type === "" && file.size > 0;
}

async function loadPhoto(file: File) {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (bitmap) {
    return {
      source: bitmap as CanvasImageSource,
      width: bitmap.width,
      height: bitmap.height,
      close: () => bitmap.close(),
    };
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("decode"));
      img.src = url;
    });
    return {
      source: img as CanvasImageSource,
      width: img.naturalWidth,
      height: img.naturalHeight,
      close: () => URL.revokeObjectURL(url),
    };
  } catch {
    URL.revokeObjectURL(url);
    return null;
  }
}

async function jpegFile(source: CanvasImageSource, width: number, height: number) {
  const scale = Math.min(1, 1200 / Math.max(width, height, 1));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  for (const quality of [0.72, 0.55, 0.4]) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (blob && blob.size > 0) return new File([blob], "photo.jpg", { type: "image/jpeg" });
  }
  return null;
}

async function preparePhoto(file: File): Promise<{ file: File } | { error: string }> {
  const heic = file.type === "image/heic" || file.type === "image/heif" || /\.hei[cf]$/i.test(file.name);
  const unreadable = "This browser couldn't read that photo. Save it as a JPG, or take a screenshot of it, and upload that.";
  if (!isPhonePhoto(file) && file.size <= 3_500_000) return { file };
  // Any big photo gets shrunk to a small JPG here, so its size never blocks the form.
  const loaded = await loadPhoto(file);
  if (!loaded) {
    if (heic || file.size > 3_500_000 || !file.type) return { error: unreadable };
    return { file };
  }
  try {
    const next = await jpegFile(loaded.source, loaded.width, loaded.height);
    if (!next) return { error: unreadable };
    return { file: next };
  } finally {
    loaded.close();
  }
}

async function submitWithSmallPhoto(prev: ApplyState, formData: FormData): Promise<ApplyState> {
  try {
    const photo = formData.get("photo");
    if (photo instanceof File && photo.size > 0) {
      const prepared = await preparePhoto(photo);
      if ("error" in prepared) return { error: prepared.error, fieldErrors: { photo: [prepared.error] } };
      formData.set("photo", prepared.file);
    }
    return await submitApplication(prev, formData);
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    console.error("[apply:form]", err);
    return { error: "The application did not send. Use a JPG or PNG photo and try again." };
  }
}

type Errors = Record<string, string>;

const FIELD_LABELS: Record<string, string> = {
  firstName: "First name",
  lastName: "Last name",
  gradeLevel: "Grade level",
  highSchool: "High school",
  cityCounty: "City / County",
  email: "Personal email",
  phone: "Phone number",
  photo: "Photo of yourself",
  apClasses: "AP classes",
  lane: "Role",
  videoLane: "Kind of videos",
  keepSiteOpen: "Keep the website open",
  canBeRemoved: "You can get kicked",
  weeklyDeadline: "Weekly deadline",
  deadlineScenario: "Missed deadline answer",
};

const FIELD_ORDER = Object.keys(FIELD_LABELS);

/** Checks the whole form at once so every missing answer is flagged together. */
function findProblems(data: FormData, choosesVideos: boolean): Errors {
  const text = (name: string) => String(data.get(name) ?? "").trim();
  const errors: Errors = {};
  if (!text("firstName")) errors.firstName = "Add your first name.";
  if (!text("lastName")) errors.lastName = "Add your last name.";
  if (!text("gradeLevel")) errors.gradeLevel = "Pick your grade.";
  if (!text("highSchool")) errors.highSchool = "Add your high school.";
  if (!text("cityCounty")) errors.cityCounty = "Add your city or county.";
  const email = text("email");
  if (!email) errors.email = "Add your email.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "That email doesn't look right.";
  const phone = text("phone");
  if (!phone) errors.phone = "Add your phone number.";
  else if (phone.length < 7) errors.phone = "That phone number looks too short.";
  const photo = data.get("photo");
  if (!(photo instanceof File) || photo.size < 1) errors.photo = "Upload a photo of yourself.";
  if (text("apClasses").length < 2) errors.apClasses = "List your AP classes.";
  if (!text("lane")) errors.lane = "Pick a role.";
  if (choosesVideos && !text("videoLane")) errors.videoLane = "Pick educational or promotional.";
  for (const name of ["keepSiteOpen", "canBeRemoved", "weeklyDeadline"]) {
    const answer = text(name);
    if (!answer) errors[name] = "Answer this one.";
    else if (answer !== "YES") errors[name] = "You need to answer Yes to apply.";
  }
  const scenario = text("deadlineScenario");
  if (!scenario) errors.deadlineScenario = "Answer this one.";
  else if (scenario.length < 12) errors.deadlineScenario = "Write a little more here.";
  return errors;
}

function focusField(name: string) {
  const el = document.querySelector<HTMLElement>(`[data-field="${name}"]`);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.querySelector<HTMLElement>("input:not([type=hidden]), select, textarea")?.focus({ preventScroll: true });
}

export function ApplyForm({ defaultLane }: { defaultLane?: ApplyLaneId }) {
  const [errors, setErrors] = useState<Errors>({});
  const [state, action, pending] = useActionState(async (prev: ApplyState, data: FormData) => {
    const result = await submitWithSmallPhoto(prev, data);
    // Errors the server sends back get the same highlighting as the ones caught here.
    const fromServer: Errors = {};
    for (const [name, messages] of Object.entries(result?.fieldErrors ?? {})) {
      if (messages?.[0]) fromServer[name] = messages[0];
    }
    setErrors(fromServer);
    return result;
  }, undefined as ApplyState);
  const [, startTransition] = useTransition();
  const [lane, setLane] = useState<ApplyLaneId>(
    APPLY_LANES.some((item) => item.id === defaultLane) ? (defaultLane as ApplyLaneId) : "one-video",
  );
  const [checked, setChecked] = useState(false);
  const chosen = APPLY_LANES.find((item) => item.id === lane);
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state?.error) return;
    const first = FIELD_ORDER.find((name) => state.fieldErrors?.[name]?.length);
    if (first) focusField(first);
    else alertRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [state]);

  const missing = FIELD_ORDER.filter((name) => errors[name]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    // Sending it ourselves stops React from clearing the form when there's an error.
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const problems = findProblems(data, Boolean(chosen?.choosesVideos));
    setChecked(true);
    setErrors(problems);
    const first = FIELD_ORDER.find((name) => problems[name]);
    if (first) {
      focusField(first);
      return;
    }
    startTransition(() => action(data));
  }

  function clearError(event: FormEvent<HTMLFormElement>) {
    const name = (event.target as HTMLInputElement).name;
    if (!name || !errors[name]) return;
    setErrors((current) => {
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  return (
    <form onSubmit={onSubmit} onChange={clearError} noValidate className="space-y-10">

      <section className="rounded-3xl border border-white/10 bg-black/45 p-6 backdrop-blur-md">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-volt">Personal</p>
        <h2 className="mt-2 font-display text-2xl">Who are you?</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="First name *" name="firstName" autoComplete="given-name" error={errors.firstName} />
          <Field label="Last name *" name="lastName" autoComplete="family-name" error={errors.lastName} />
          <label className="block text-sm" data-field="gradeLevel">
            Grade level *
            <select name="gradeLevel" required aria-invalid={Boolean(errors.gradeLevel)} className={inputCls(errors.gradeLevel)} defaultValue="">
              <option value="" disabled>Select grade</option>
              <option value="GRADE_9">9th Grade</option>
              <option value="GRADE_10">10th Grade</option>
              <option value="GRADE_11">11th Grade</option>
              <option value="GRADE_12">12th Grade</option>
            </select>
            <ErrorText message={errors.gradeLevel} />
          </label>
          <Field label="High school *" name="highSchool" error={errors.highSchool} />
          <Field label="City / County *" name="cityCounty" error={errors.cityCounty} />
          <Field label="Personal email *" name="email" type="email" autoComplete="email" error={errors.email} />
          <Field label="Phone number *" name="phone" type="tel" autoComplete="tel" error={errors.phone} />
          <p className="-mt-2 text-xs text-muted md:col-span-2">
            Use an inbox you actually check. Accept and decline emails go here.
          </p>
          <label className="block text-sm md:col-span-2" data-field="photo">
            Photo of yourself *
            <p className="mt-1 text-xs text-muted">Required. Kesav sees this with your application.</p>
            <input name="photo" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic" required aria-invalid={Boolean(errors.photo)} className={`${inputCls(errors.photo)} file:mr-3 file:rounded-full file:border-0 file:bg-volt file:px-3 file:py-1 file:text-sm file:font-semibold file:text-ink`} />
            <ErrorText message={errors.photo} />
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-black/45 p-6 backdrop-blur-md">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan">Academic</p>
        <h2 className="mt-2 font-display text-2xl">What APs are you in?</h2>
        <label className="mt-6 block text-sm" data-field="apClasses">
          What are your major AP classes at school? *
          <p className="mt-1 text-xs text-muted">We recommend listing all of your AP classes.</p>
          <textarea name="apClasses" required rows={5} aria-invalid={Boolean(errors.apClasses)} className={inputCls(errors.apClasses)} />
          <ErrorText message={errors.apClasses} />
        </label>
      </section>

      <section className="rounded-3xl border border-white/10 bg-black/45 p-6 backdrop-blur-md">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet">Role</p>
        <h2 className="mt-2 font-display text-2xl">What are you signing up to do?</h2>
        <div className="mt-6 grid gap-3" data-field="lane">
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
          <ErrorText message={errors.lane} />
        </div>
        {chosen?.choosesVideos ? (
          <fieldset
            data-field="videoLane"
            className={`mt-5 rounded-2xl border p-4 ${errors.videoLane ? "border-coral/70 bg-coral/5" : "border-white/10"}`}
          >
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
            <ErrorText message={errors.videoLane} />
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
            error={errors.keepSiteOpen}
          />
          <YesNo
            name="canBeRemoved"
            question="You can get kicked if you disappear, miss the work, or stop showing up. Do you understand?"
            error={errors.canBeRemoved}
          />
          <YesNo
            name="weeklyDeadline"
            question="You will be given a deadline to make a video, and you need to make at least one thing every week. Do you understand?"
            error={errors.weeklyDeadline}
          />
        </div>
        <label className="mt-8 block text-sm" data-field="deadlineScenario">
          Imagine that you realize you will not be able to meet a deadline for an assignment. What should you do? *
          <p className="mt-1 text-xs text-muted">
            Hint: disappearing is the wrong answer. Talk to a team lead or admin as soon as you know.
          </p>
          <textarea name="deadlineScenario" required rows={5} aria-invalid={Boolean(errors.deadlineScenario)} className={inputCls(errors.deadlineScenario)} />
          <ErrorText message={errors.deadlineScenario} />
        </label>
      </section>

      <section className="rounded-3xl border border-white/10 bg-black/45 p-6 backdrop-blur-md">
        <h2 className="font-display text-2xl">Anything else?</h2>
        <textarea name="additionalInfo" rows={4} className={`${inputClass} mt-4`} />
        <p className="mt-4 text-sm text-muted">Questions? Email kesavgarg@gmail.com or text +1 (404) 213-9019.</p>
      </section>

      {missing.length > 0 ? (
        <div role="alert" className="rounded-2xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral">
          <p className="font-semibold">
            {missing.length === 1 ? "One thing left before you can submit:" : `${missing.length} things left before you can submit:`}
          </p>
          <p className="mt-1 text-paper/70">Everything else you filled in is saved on this page.</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {missing.map((name) => (
              <li key={name}>
                <button
                  type="button"
                  onClick={() => focusField(name)}
                  className="rounded-full border border-coral/50 px-3 py-1 text-xs font-semibold text-coral hover:bg-coral/15"
                >
                  {FIELD_LABELS[name]}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : state?.error && checked ? (
        <div ref={alertRef} role="alert" className="rounded-2xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral">
          {state.error} Your answers are still here.
        </div>
      ) : null}
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

function inputCls(error?: string) {
  return error ? `${inputClass} border-coral/70 bg-coral/5 focus:border-coral focus:ring-coral/15` : inputClass;
}

function ErrorText({ message }: { message?: string }) {
  return message ? <p className="mt-1.5 text-xs font-medium text-coral">{message}</p> : null;
}

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  error?: string;
}) {
  return (
    <label className="block text-sm" data-field={name}>
      {label}
      <input name={name} type={type} autoComplete={autoComplete} required aria-invalid={Boolean(error)} className={inputCls(error)} />
      <ErrorText message={error} />
    </label>
  );
}

function YesNo({ name, question, error }: { name: string; question: string; error?: string }) {
  return (
    <fieldset
      data-field={name}
      className={`rounded-2xl border p-4 ${error ? "border-coral/70 bg-coral/5" : "border-white/10 bg-ink/40"}`}
    >
      <legend className="text-sm">{question} *</legend>
      <div className="mt-3 flex gap-6 text-sm">
        <label className="flex items-center gap-2">
          <input type="radio" name={name} value="YES" required /> Yes
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name={name} value="NO" /> No
        </label>
      </div>
      <ErrorText message={error} />
    </fieldset>
  );
}
