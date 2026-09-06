import { BrandMark } from "@/components/brand";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Team login" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; email?: string }>;
}) {
  const { next, email } = await searchParams;
  return (
    <div className="mesh flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-black/55 p-8 backdrop-blur-md">
        <BrandMark size="md" />
        <h1 className="mt-4 font-display text-4xl">Team login</h1>
        <p className="mt-2 text-sm text-muted">
          Applying does not give you a login. Kesav has to accept you first. After he accepts,
          use the temporary password from your email (or the one he sent you) — then you land in
          the workspace.
        </p>
        <p className="mt-3 text-xs text-muted">
          Opened this from Gmail? If the page looks blank or sign-in does not stick, copy the
          address into Safari or Chrome and try again.
        </p>
        <div className="mt-8">
          <LoginForm next={next} email={email} />
        </div>
      </div>
    </div>
  );
}
