import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { updateProfile } from "@/actions/logs";
import { ChangePasswordForm } from "@/components/workspace/change-password-form";

export default async function ProfilePage() {
  const user = await requireUser();
  const full = await prisma.user.findUnique({ where: { id: user.id } });
  return (
    <div className="max-w-xl">
      <h1 className="font-display text-4xl">Profile</h1>
      <form action={updateProfile} className="mt-6 space-y-3 rounded-3xl bg-white p-5 shadow-sm">
        <label className="block text-sm">
          First name
          <input name="firstName" defaultValue={full?.firstName} className="mt-1 w-full rounded-xl border px-3 py-2" />
        </label>
        <label className="block text-sm">
          Last name
          <input name="lastName" defaultValue={full?.lastName} className="mt-1 w-full rounded-xl border px-3 py-2" />
        </label>
        <label className="block text-sm">
          Phone
          <input name="phone" defaultValue={full?.phone ?? ""} className="mt-1 w-full rounded-xl border px-3 py-2" />
        </label>
        <p className="text-sm text-ink/50">{full?.email}</p>
        <button className="rounded-full bg-ink px-4 py-2 text-paper">Save</button>
      </form>
      <div className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="font-display text-2xl">Password</h2>
        {user.mustChangePassword ? (
          <p className="mt-1 text-sm text-ink/60">
            You&apos;re still on the temporary password from your acceptance email. Set a new one.
          </p>
        ) : null}
        <ChangePasswordForm />
      </div>
    </div>
  );
}
