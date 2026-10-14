import Link from "next/link";

export const metadata = { title: "Application received" };

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-volt">Application received</p>
      <h1 className="mt-4 font-display text-5xl">We got it.</h1>
      <p className="mt-4 text-paper/75">
        Your application {id ? <strong>{id}</strong> : ""} is now in Kesav&apos;s admin inbox
        (Admin → Applications). He can accept or decline it from there. A confirmation email
        goes to the personal address you entered — and the accept/decline email will too.
      </p>
      <p className="mt-6 text-sm text-muted">
        Questions? Email kesavgarg@gmail.com or text +1 (404) 213-9019.
      </p>
      <Link href="/" className="mt-10 inline-flex rounded-full bg-volt px-6 py-3 font-semibold text-ink">
        Back home
      </Link>
    </div>
  );
}
