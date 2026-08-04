import type { ReactNode } from "react";

export function PublicShell({
  title,
  children,
  description,
}: {
  title: string;
  children: ReactNode;
  description?: string;
}) {
  return (
    <main className="relative flex min-h-dvh flex-col px-4 py-10 sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--public-band)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[42%] opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 28%, rgba(255,255,255,0.22) 0 1.5px, transparent 2.5px), radial-gradient(circle at 72% 58%, rgba(255,255,255,0.14) 0 1px, transparent 2px)",
          backgroundSize: "40px 40px, 28px 28px",
        }}
      />

      <div className="relative flex flex-1 flex-col justify-center">
        <section className="mx-auto w-full max-w-md">
          <header className="mb-6 text-center sm:mb-8">
            <p className="text-sm font-semibold tracking-[0.16em] text-primary-foreground/70 uppercase">
              Prime Estately
            </p>
            <p className="mt-2 font-serif text-[2rem] leading-tight font-semibold tracking-tight text-primary-foreground sm:text-4xl">
              Peace Valley Zone
            </p>
            <p className="mt-2 text-sm font-medium text-primary-foreground/85">
              Magodo Phase 2 · Estate access
            </p>
          </header>

          <div className="rounded-xl border border-border bg-card p-6 shadow-lg sm:p-8">
            <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              {title}
            </h1>
            {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
            <div className="mt-6">{children}</div>
          </div>
        </section>
      </div>

      <p className="relative mt-8 text-center text-sm text-muted-foreground">
        Powered by Prime Estately
      </p>
    </main>
  );
}
