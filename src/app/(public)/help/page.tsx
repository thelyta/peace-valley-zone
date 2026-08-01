import Link from "next/link";
export default function HelpPage() {
  return (
    <main className="mx-auto max-w-lg p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Need help?</h1>
      <p className="mt-3 text-muted-foreground">
        Contact estate management if you cannot sign in or your account is inactive.
      </p>
      <Link className="mt-4 inline-block text-primary underline" href="/login">
        Back to sign in
      </Link>
    </main>
  );
}
