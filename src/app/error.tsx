"use client";
import { Button } from "@/ui";
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-lg p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-2 text-muted-foreground">
        Please try again. If this continues, contact estate management.
      </p>
      <Button className="mt-5" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
