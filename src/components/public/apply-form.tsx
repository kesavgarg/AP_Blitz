"use client";

import { useActionState } from "react";
import { submitApplication, type ApplyState } from "@/actions/applications";
import { ROLES, type RoleSlug } from "@/lib/roles";

const inputClass =
  "mt-1.5 w-full rounded-2xl border border-white/10 bg-ink px-4 py-3 text-paper outline-none ring-volt/0 transition focus:border-volt/40 focus:ring-4 focus:ring-volt/10";

export function ApplyForm({ defaultRole }: { defaultRole?: RoleSlug }) {
  const roleKey = ROLES.find((r) => r.slug === defaultRole)?.key;
  const [state, action, pending] = useActionState(submitApplication, undefined as ApplyState);

  return (
    <form action={action} className="space-y-10">
      {state?.error ? (
        <div className="rounded-2xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral">
          {state.error}
        </div>
      ) : null}

      <section className="rounded-3xl border border-white/10 bg-black/45 p-6 backdrop-blur-md">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-volt">
          Personal
        </p>
        <h2 className="mt-2 font-display text-2xl">Who are you?</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="First name *" name="firstName" error={state?.fieldErrors?.firstName} />
          <Field label="Last name *" name="lastName" error={state?.fieldErrors?.lastName} />
          <label className="block text-sm">
            Grade level *
            <select name="gradeLevel" required className={inputClass} defaultValue="">
              <option value="" disabled>
                Select grade
              </option>
              <option value="GRADE_9">9th Grade</option>
              <option value="GRADE_10">10th Grade</option>
              <option value="GRADE_11">11th Grade</option>
              <option value="GRADE_12">12th Grade</option>
            </select>
          </label>
          <Field label="High school *" name="highSchool" error={state?.fieldErrors?.highSchool} />
          <Field label="City / County *" name="cityCounty" error={state?.fieldErrors?.cityCounty} />
          <Field
            label="Personal email *"
            name="email"
            type="email"
            error={state?.fieldErrors?.email}
          />
          <p className="-mt-2 text-xs text-muted md:col-span-2">
            Use an inbox you actually check. Accept and decline emails go here — not to a school
            filter if you can avoid it.
          </p>
          <Field label="Phone number *" name="phone" type="tel" error={state?.fieldErrors?.phone} />
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-black/45 p-6 backdrop-blur-md">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan">Academic</p>
        <h2 className="mt-2 font-display text-2xl">What APs are you in?</h2>
        <label className="mt-6 block text-sm">
          What are your major AP classes at school? *
          <p className="mt-1 text-xs text-muted">We recommend listing all of your AP classes.</p>
          <textarea name="apClasses" required rows={5} className={inputClass} />
        </label>
      </section>

      <section className="rounded-3xl border border-white/10 bg-black/45 p-6 backdrop-blur-md">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet">Roles</p>
        <h2 className="mt-2 font-display text-2xl">Where do you want to land?</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <RoleSelect
            name="firstChoice"
            label="First choice *"
            defaultValue={roleKey}
          />
          <RoleSelect name="secondChoice" label="Second choice *" />
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-black/45 p-6 backdrop-blur-md">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral">Experience</p>
        <h2 className="mt-2 font-display text-2xl">Have you done this before?</h2>
        <p className="mt-2 text-sm text-muted">
          Prior experience helps, but it is not required. If you&apos;re new, tell us
          why you want to learn it here.
        </p>
        <textarea name="experience" rows={5} className={`${inputClass} mt-4`} />
      </section>

      <section className="rounded-3xl border border-white/10 bg-black/45 p-6 backdrop-blur-md">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-volt">
          Before you apply
        </p>
        <h2 className="mt-2 font-display text-2xl">This is a real team.</h2>
        <p className="mt-2 text-sm text-muted">
          AP Blitz is not a group chat you join and vanish from. Answer honestly.
        </p>
        <div className="mt-6 space-y-5">
          <YesNo
            name="expectContribute"
            question="Do you understand that joining AP Blitz means you are joining a team and are expected to actively contribute to the organization rather than simply joining the group chat?"
          />
          <YesNo
            name="expectRespond"
            question="Do you understand that you are expected to respond to messages in a reasonable amount of time on the group chat?"
          />
          <YesNo
            name="expectRemoval"
            question="Do you understand that repeatedly ignoring messages, missing responsibilities, or being inactive may result in removal from AP Blitz?"
          />
          <YesNo
            name="expectConduct"
            question="Do you understand that AP Blitz is an educational organization and communication should not be used for excessive goofing off, spam, or disruptive behavior?"
          />
          <YesNo
            name="expectDeadlines"
            question="Do you understand that assignments given to you may have deadlines and that you are expected to meet those deadlines?"
          />
        </div>
        <label className="mt-8 block text-sm">
          Imagine that you realize you will not be able to meet a deadline for an assignment. What should you do? *
          <p className="mt-1 text-xs text-muted">
            Hint: disappearing is the wrong answer. Talk to a team lead or admin as soon as you know.
          </p>
          <textarea name="deadlineScenario" required rows={5} className={inputClass} />
        </label>
      </section>

      <section className="rounded-3xl border border-white/10 bg-black/45 p-6 backdrop-blur-md">
        <h2 className="font-display text-2xl">Anything else?</h2>
        <textarea name="additionalInfo" rows={4} className={`${inputClass} mt-4`} />
        <p className="mt-4 text-sm text-muted">
          Questions? Email kesavgarg@gmail.com or text +1 (404) 212-9019.
        </p>
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

function RoleSelect({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: string;
}) {
  return (
    <label className="block text-sm">
      {label}
      <select name={name} required className={inputClass} defaultValue={defaultValue ?? ""}>
        <option value="" disabled>
          Choose a role
        </option>
        {ROLES.map((r) => (
          <option key={r.key} value={r.key}>
            {r.name}
          </option>
        ))}
      </select>
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
          <input type="radio" name={name} value="NO" required /> No
        </label>
      </div>
    </fieldset>
  );
}
