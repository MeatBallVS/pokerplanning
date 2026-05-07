import { RegisterForm } from "@/features/auth/register";
import { AuthShell } from "@/pages/auth/ui/AuthShell";

const RegisterPage = () => {
  return (
    <AuthShell mode="register">
      <RegisterForm />
    </AuthShell>
  );
};

export default RegisterPage;
