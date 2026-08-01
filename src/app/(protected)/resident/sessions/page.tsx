import { ChangePasswordForm, SessionsList } from "@/modules/auth";

export default function SessionsPage() {
  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Account settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your password and signed-in devices.
        </p>
      </div>
      <h2 className="text-lg font-semibold">Your signed-in devices</h2>
      <SessionsList />
      <ChangePasswordForm />
    </section>
  );
}
