import { Suspense } from "react";
import { PasswordForm } from "@/modules/auth/components";
export default function ResetPasswordPage() {
  return (
    <Suspense>
      <PasswordForm mode="reset" />
    </Suspense>
  );
}
