import { notFound } from "next/navigation";
import { PublicAssistant } from "@/components/public-assistant";
import { getPublicWorkspaceBySlug } from "@/lib/workspaces";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export default async function SharedAssistantPage({ params }: PageProps) {
  const { slug } = await params;
  if (!/^[a-zA-Z0-9-]{8,64}$/.test(slug)) notFound();

  const workspace = await getPublicWorkspaceBySlug(slug);
  if (!workspace) notFound();

  return (
    <PublicAssistant
      assistant={{
        slug: workspace.shareSlug,
        organizationName: workspace.name,
        assistantName: workspace.assistantName,
        welcomeMessage: workspace.welcomeMessage,
        accentColor: workspace.accentColor,
      }}
    />
  );
}
