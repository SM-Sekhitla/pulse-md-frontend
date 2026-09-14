import { createFileRoute } from "@/lib/router-compat";
import { LoginScreen } from "@/components/login-screen";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  return <LoginScreen />;
}
