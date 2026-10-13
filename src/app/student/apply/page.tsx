import Link from "next/link";

export default function StudentApplyPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-4xl">Apply to join the team</h1>
      <p className="mt-3 text-paper/75">
        This is the team application, separate from your Blitzer account. Submitting it does not make you a team member.
        Kesav still has to accept you. Your study account stays a study account until that happens.
      </p>
      <Link href="/apply" className="mt-6 inline-flex rounded-full bg-volt px-5 py-3 font-semibold text-ink">
        Open the application
      </Link>
    </div>
  );
}
