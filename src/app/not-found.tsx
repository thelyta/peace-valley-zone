import Link from "next/link";
export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-2 text-muted-foreground">The page you requested is unavailable.</p>
      <Link className="mt-4 inline-block text-primary underline" href="/login">
        Go to sign in
      </Link>
    </main>
  );
}
