import { redirect } from "next/navigation";
import { WorkspaceDashboard } from "@/components/dashboard/workspace-dashboard";
import { auth } from "@/lib/auth";
import { getDashboardPayload } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const [dashboard] = await Promise.all([getDashboardPayload(session.user.id)]);
  const user = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
  };

  return <WorkspaceDashboard initialData={dashboard} user={user} />;
}
