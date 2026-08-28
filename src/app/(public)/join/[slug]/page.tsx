import Link from "next/link";
import { notFound } from "next/navigation";
import { getRoleBySlug } from "@/lib/roles";

export default async function RolePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const role = getRoleBySlug(slug);
  if (!role) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-14">
      <Link href="/join" className="text-sm text-muted hover:text-volt">
        ← All roles
      </Link>
      <div className="mt-6 overflow-hidden rounded-[2rem] border border-white/10">
        <div className="p-8 md:p-12" style={{ background: `linear-gradient(135deg, ${role.accent}22, #121a2f)` }}>
          <p className="text-4xl">{role.emoji}</p>
          <h1 className="mt-4 font-display text-5xl">{role.name}</h1>
          <p className="mt-3 max-w-2xl text-lg text-paper/80">{role.tagline}</p>
          <p className="mt-4 max-w-2xl text-muted">{role.description}</p>
          <Link
            href={`/apply?role=${role.slug}`}
            className="mt-8 inline-flex rounded-full bg-volt px-6 py-3 font-semibold text-ink"
          >
            Apply for this position
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Block title="Weekly contribution" body={role.weekly} />
        <Block title="What collaboration looks like" body={role.collaboration} />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <List title="Responsibilities" items={role.responsibilities} />
        <List title="Useful skills" items={role.skills} />
        <List title="What you'll learn" items={role.learn} />
        <List title="Expectations" items={role.expectations} />
      </div>

      <div className="mt-4 rounded-3xl border border-white/10 bg-black/45 p-6 backdrop-blur-md">
        <h2 className="font-display text-2xl">Example assignments</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {role.examples.map((ex) => (
            <div key={ex} className="rounded-2xl bg-ink/50 p-4 text-sm text-paper/80">
              {ex}
            </div>
          ))}
        </div>
        <Link
          href={`/apply?role=${role.slug}`}
          className="mt-6 inline-flex rounded-full bg-volt px-6 py-3 font-semibold text-ink"
        >
          Apply for this position
        </Link>
      </div>
    </div>
  );
}

function Block({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/45 p-6 backdrop-blur-md">
      <h2 className="font-display text-2xl">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-muted">{body}</p>
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/45 p-6 backdrop-blur-md">
      <h2 className="font-display text-2xl">{title}</h2>
      <ul className="mt-4 space-y-2 text-sm text-paper/80">
        {items.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}
