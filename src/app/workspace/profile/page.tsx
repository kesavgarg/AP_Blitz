import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { ProfileForm } from "@/components/workspace/profile-form";
import { ChangePasswordForm } from "@/components/workspace/change-password-form";

export default async function ProfilePage() {
  const user = await requireUser();
  const full = await prisma.user.findUnique({ where: { id: user.id } });
  if (!full) return null;
  return (
    <div className="max-w-xl">
      <h1 className="font-display text-4xl">Profile</h1>
      <ProfileForm
        user={{
          firstName: full.firstName,
          lastName: full.lastName,
          phone: full.phone,
          bio: full.bio,
          email: full.email,
          imageUrl: full.imageUrl,
        }}
      />
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
