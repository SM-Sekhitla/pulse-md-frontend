import { createFileRoute, useParams } from "@/lib/router-compat";
import { LoginScreen } from "@/components/login-screen";

export const Route = createFileRoute("/practice/$slug/login")({
  component: PracticeLoginPage,
});

function PracticeLoginPage() {
  const { slug } = useParams<{ slug: string }>();
  return <LoginScreen key={slug} practiceSlug={slug} />;
}
