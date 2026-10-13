import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const row = token ? await prisma.emailVerification.findUnique({ where: { token } }) : null;
  const valid = Boolean(row && !row.usedAt && row.expiresAt > new Date());
  if (valid && row) {
    await prisma.$transaction([
      prisma.user.update({ where: { id: row.userId }, data: { emailVerifiedAt: new Date() } }),
      prisma.emailVerification.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
    ]);
  }
  const result = valid
    ? { ok: true as const }
    : { ok: false as const, error: "This verification link is invalid or expired." };
  return (
    <div className="mx-auto max-w-lg px-4 pb-20">
      <h1 className="font-display text-4xl">{result.ok ? "Email confirmed" : "Could not confirm"}</h1>
      <p className="mt-3 text-paper/70">{result.ok ? "Thanks. Your Blitzer account is confirmed." : result.error}</p>
      <Link href="/login" className="mt-6 inline-flex rounded-full bg-volt px-5 py-3 font-semibold text-ink">Log in</Link>
    </div>
  );
}
