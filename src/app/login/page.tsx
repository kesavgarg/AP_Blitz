import { BrandMark } from "@/components/brand";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Team login" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
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
        <div className="mt-8">
          <LoginForm next={next} />
        </div>
      </div>
    </div>
  );
}
