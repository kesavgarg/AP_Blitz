import { initials } from "@/lib/utils";

export function Avatar({
  user,
  size = 36,
}: {
  user: { firstName: string; lastName: string; imageUrl?: string | null };
  size?: number;
}) {
  const dim = `${size}px`;
  if (user.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.imageUrl}
        alt={`${user.firstName} ${user.lastName}`}
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ width: dim, height: dim }}
      />
    );
  }
  return (
    <div
      className="grid shrink-0 place-items-center rounded-full bg-ink text-[10px] font-semibold text-volt"
      style={{ width: dim, height: dim }}
    >
      {initials(user)}
    </div>
  );
}
