import { requireUser } from "@/lib/auth";
import { ProfileForm } from "@/components/student/profile-form";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();
  return <ProfileForm firstName={user.firstName} lastName={user.lastName} />;
}