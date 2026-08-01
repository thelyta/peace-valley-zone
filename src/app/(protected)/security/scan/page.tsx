"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/app.store";
import { Skeleton } from "@/ui";

const Scanner = dynamic(() => import("@/modules/gate").then((module) => module.Scanner), {
  ssr: false,
  loading: () => <Skeleton className="h-64 w-full" />,
});

export default function ScanPage() {
  const router = useRouter();
  const setPendingVisitorCode = useAppStore((state) => state.setPendingVisitorCode);

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Scan visitor pass</h1>
        <p className="mt-1 text-muted-foreground">
          Scan the QR code, then confirm admission on the gate desk. Codes are never placed in the
          URL.
        </p>
      </header>
      <Scanner
        onCode={(code) => {
          setPendingVisitorCode(code);
          router.replace("/security");
        }}
      />
      <Link
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
        href="/security"
      >
        Enter code manually
      </Link>
    </section>
  );
}
