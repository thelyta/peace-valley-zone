import { Suspense } from "react";
import { PasswordForm } from "@/modules/auth/components";
export default function ActivateAccountPage() {
  return (
    <Suspense>
      <PasswordForm mode="activate" />
    </Suspense>
  );
}
