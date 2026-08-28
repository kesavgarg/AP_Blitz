import { BrandMark } from "@/components/brand";
import { SetupForm } from "@/components/auth/setup-form";

export const metadata = { title: "Set up your account" };

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <div className="mesh flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-black/55 p-8 backdrop-blur-md">
        <BrandMark size="md" />
        <h1 className="mt-4 font-display text-4xl">You&apos;re in.</h1>
        <p className="mt-2 text-sm text-muted">
          Choose a password and you&apos;ll drop into the AP Blitz workspace.
        </p>
        <div className="mt-8">
          {token ? (
            <SetupForm token={token} />
          ) : (
            <p className="text-sm text-coral">This setup link is missing a token.</p>
          )}
        </div>
      </div>
    </div>
  );
}
