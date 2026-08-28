import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  size = "sm",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "lg" ? 180 : size === "md" ? 112 : 72;
  return (
    <Link href="/" className={cn("inline-flex shrink-0 items-center", className)} aria-label="AP Blitz home">
      <Image
        src="/logo-ap-blitz.png"
        alt="AP Blitz"
        width={dim}
        height={dim}
        className={cn(
          "object-contain",
          size === "lg" && "h-[180px] w-[180px]",
          size === "md" && "h-28 w-28",
          size === "sm" && "h-[72px] w-[72px]",
        )}
        priority
      />
    </Link>
  );
}
