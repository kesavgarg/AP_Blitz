import { ApplyForm } from "@/components/public/apply-form";
import { ROLES, type RoleSlug } from "@/lib/roles";

export const metadata = { title: "Apply" };

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  const match = ROLES.find((r) => r.slug === role);

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-volt">Application</p>
      <h1 className="mt-3 font-display text-5xl">Apply to AP Blitz</h1>
      <p className="mt-3 text-paper/70">
        {match
          ? `You're applying with ${match.name} as your first-choice role. You can still change it.`
          : "Tell us who you are, which role you want, and that you actually want to work."}{" "}
        Kesav reviews every application. You cannot log in until he accepts you.
      </p>
      <div className="mt-10">
        <ApplyForm defaultRole={match?.slug as RoleSlug | undefined} />
      </div>
    </div>
  );
}
