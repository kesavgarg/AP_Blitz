import Link from "next/link";
import { BrandMark } from "@/components/brand";

export function PublicFooter({
  email,
  phone,
}: {
  email: string;
  phone: string;
}) {
  return (
    <footer className="border-t border-white/10 bg-black/40 backdrop-blur-md">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <BrandMark />
          <p className="mt-3 max-w-sm text-sm text-muted">
            Student-run AP education. We make the videos, scripts, graphics, and
            posts so studying for APs feels like it was built for us.
          </p>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-semibold">Join</p>
          <div className="flex flex-col gap-2 text-muted">
            <Link href="/join" className="hover:text-volt">
              Roles
            </Link>
            <Link href="/apply" className="hover:text-volt">
              Apply
            </Link>
            <Link href="/login" className="hover:text-volt">
              Team login
            </Link>
          </div>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-semibold">Questions?</p>
          <p className="text-muted">
            Email{" "}
            <a className="text-volt" href={`mailto:${email}`}>
              {email}
            </a>
          </p>
          <p className="mt-2 text-muted">
            Text{" "}
            <a className="text-volt" href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
              {phone}
            </a>
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} AP Blitz. Built by students, for students.
      </div>
    </footer>
  );
}
