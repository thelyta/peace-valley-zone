import Link from "next/link";
export default function OfflinePage() {
  return (
    <main className="mx-auto max-w-lg p-6">
      <h1 className="text-2xl font-semibold tracking-tight">You are offline</h1>
      <p className="mt-2 text-muted-foreground">
        Reconnect to check visitor passes or make changes. Do not admit visitors until the system
        confirms their pass.
      </p>
      <Link className="mt-4 inline-block text-primary underline" href="/help">
        Get help
      </Link>
    </main>
  );
}
