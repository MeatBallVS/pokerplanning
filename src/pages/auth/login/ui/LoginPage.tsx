import { LoginForm } from "@/features/auth/login";
import { AuthShell } from "@/pages/auth/ui/AuthShell";

const LoginPage = () => {
  return (
    <AuthShell mode="login">
      <LoginForm />
    </AuthShell>
  );
};

export default LoginPage;
