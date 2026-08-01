import { Suspense } from "react";
import { DeviceVerificationForm } from "@/modules/auth/components";
export default function VerifyDevicePage() {
  return (
    <Suspense>
      <DeviceVerificationForm />
    </Suspense>
  );
}
