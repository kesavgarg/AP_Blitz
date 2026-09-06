import { requireFounder } from "@/lib/auth";
import { getOrgSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { saveOrgSettings, testEmailSettings, addShowcaseClip, deleteShowcaseClip } from "@/actions/admin";
import { SubmitButton } from "@/components/ui/submit-button";

export default async function SettingsPage() {
  await requireFounder();
  const s = await getOrgSettings();
  const clips = await prisma.showcaseClip.findMany({ orderBy: { sortOrder: "asc" } });
  const emailReady = Boolean(s.smtpHost && s.smtpUser && s.smtpPass);
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-4xl">Organization settings</h1>
      <p className="mt-2 text-paper/60">
        Swap the founder video, contact info, branding, and the email account that sends
        application decisions.
      </p>
      <form action={saveOrgSettings} className="mt-6 space-y-3 rounded-3xl border border-white/10 bg-navy p-5">
        <Field name="orgName" label="Org name" defaultValue={s.orgName} />
        <Field name="brandTagline" label="Tagline" defaultValue={s.brandTagline} />
        <Field name="founderName" label="Founder name" defaultValue={s.founderName} />
        <Field name="founderTitle" label="Founder title" defaultValue={s.founderTitle} />
        <label className="block text-sm">
          Founder bio
          <textarea name="founderBio" defaultValue={s.founderBio} className="mt-1 w-full rounded-xl bg-ink px-3 py-2" />
        </label>
        <Field name="contactEmail" label="Contact email" defaultValue={s.contactEmail} />
        <Field name="contactPhone" label="Contact phone" defaultValue={s.contactPhone} />
        <Field name="founderVideoUrl" label="Founder video URL (YouTube, Vimeo, or mp4)" defaultValue={s.founderVideoUrl} />
        <label className="block text-sm">
          Video type
          <select name="founderVideoType" defaultValue={s.founderVideoType} className="mt-1 w-full rounded-xl bg-ink px-3 py-2">
            <option value="youtube">YouTube</option>
            <option value="vimeo">Vimeo / iframe</option>
            <option value="file">Direct file</option>
          </select>
        </label>
        <Field name="defaultMeetingLink" label="Default meeting link" defaultValue={s.defaultMeetingLink} />

        <h2 className="pt-4 font-display text-2xl">Email delivery</h2>
        <p className="text-sm text-paper/60">
          Applications, acceptances, and rejections email the student&apos;s personal address.
          For Gmail: smtp.gmail.com, port 587, your Gmail, and a Google{" "}
          <strong>App Password</strong> (not your normal password).
        </p>
        <p className={`text-sm ${emailReady ? "text-emerald-400" : "text-coral"}`}>
          {emailReady
            ? "SMTP is saved. Outgoing mail should reach inboxes."
            : "SMTP is not set yet — accept/reject still works, but emails will not leave the server until you save this."}
        </p>
        <Field name="smtpHost" label="SMTP host" defaultValue={s.smtpHost || "smtp.gmail.com"} />
        <Field name="smtpPort" label="SMTP port" defaultValue={s.smtpPort || "587"} />
        <Field name="smtpUser" label="SMTP username / Gmail" defaultValue={s.smtpUser} />
        <label className="block text-sm">
          SMTP password / Gmail app password
          <input
            name="smtpPass"
            type="password"
            placeholder={s.smtpPass ? "Saved — leave blank to keep" : "App password"}
            className="mt-1 w-full rounded-xl bg-ink px-3 py-2"
          />
        </label>
        <button className="rounded-full bg-volt px-4 py-2 font-semibold text-ink">Save settings</button>
      </form>

      <form action={addShowcaseClip} className="mt-4 space-y-3 rounded-3xl border border-white/10 bg-navy p-5">
        <h2 className="font-display text-2xl">Homepage examples</h2>
        <p className="text-sm text-paper/60">
          Paste Instagram reel links (or YouTube shorts) so visitors can see what AP Blitz actually posts.
        </p>
        <Field name="title" label="Title" defaultValue="" />
        <Field name="url" label="Instagram reel / YouTube URL" defaultValue="" />
        <SubmitButton className="rounded-full border border-white/20 px-4 py-2 text-sm">Add example</SubmitButton>
        <div className="space-y-2 pt-2">
          {clips.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl bg-ink px-3 py-2 text-sm">
              <span className="truncate">
                {c.title} · {c.url}
              </span>
              <form action={deleteShowcaseClip}>
                <input type="hidden" name="id" value={c.id} />
                <SubmitButton className="text-xs text-coral">Remove</SubmitButton>
              </form>
            </div>
          ))}
        </div>
      </form>

      <form action={testEmailSettings} className="mt-4 space-y-3 rounded-3xl border border-white/10 bg-navy p-5">
        <h2 className="font-display text-xl">Send a test email</h2>
        <input
          name="testTo"
          type="email"
          defaultValue={s.contactEmail}
          className="w-full rounded-xl bg-ink px-3 py-2"
        />
        <button className="rounded-full border border-white/20 px-4 py-2 text-sm">Send test</button>
      </form>
    </div>
  );
}

function Field({ name, label, defaultValue }: { name: string; label: string; defaultValue: string }) {
  return (
    <label className="block text-sm">
      {label}
      <input name={name} defaultValue={defaultValue} className="mt-1 w-full rounded-xl bg-ink px-3 py-2" />
    </label>
  );
}
