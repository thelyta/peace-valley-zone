"use client";

import { useQueryClient } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  DoorOpen,
  Home,
  LogOut,
  Megaphone,
  Settings,
  Shield,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/app.store";
import { cn } from "@/lib/utils";
import { useLogout } from "@/modules/auth/mutations/use-logout";
import { adminNavItems, primaryNavItems, residentNavItems } from "@/modules/auth/utils/navigation";
import { getDefaultRouteForZone } from "@/modules/auth/utils/permission";
import type { Session } from "@/types/session";
import {
  Button,
  Icon,
  OfflineBanner,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui";

const primaryIcons: Record<string, LucideIcon> = {
  "/resident": Home,
  "/security": Shield,
  "/admin": Building2,
};

const sectionIcons: Record<string, LucideIcon> = {
  "/resident": Home,
  "/resident/announcements": Megaphone,
  "/resident/household": Users,
  "/resident/sessions": Settings,
  "/admin": Building2,
  "/admin/residents": Users,
  "/admin/households": Home,
  "/admin/member-requests": UserPlus,
  "/admin/visitation": DoorOpen,
  "/admin/announcements": Megaphone,
  "/admin/settings": Settings,
};

function isActive(pathname: string, href: string) {
  if (href === "/admin" || href === "/resident" || href === "/security") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  href,
  label,
  icon,
  active,
  variant,
}: {
  href: string;
  label: string;
  icon?: LucideIcon;
  active: boolean;
  variant: "sidebar" | "bottom" | "section";
}) {
  if (variant === "bottom") {
    return (
      <Link
        href={href}
        className={cn(
          "flex min-h-14 min-w-[4.5rem] flex-1 flex-col items-center justify-center gap-1 px-2 text-xs font-medium",
          active ? "text-primary" : "text-muted-foreground",
        )}
        aria-current={active ? "page" : undefined}
      >
        {icon ? <Icon icon={icon} size={24} /> : null}
        <span>{label}</span>
      </Link>
    );
  }

  if (variant === "section") {
    return (
      <Link
        href={href}
        className={cn(
          "inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-md px-3 text-sm font-medium",
          active
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground",
        )}
        aria-current={active ? "page" : undefined}
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
      )}
      aria-current={active ? "page" : undefined}
    >
      {icon ? <Icon icon={icon} size={20} /> : null}
      <span>{label}</span>
    </Link>
  );
}

export function AppShell({ session, children }: { session: Session; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const client = useQueryClient();
  const activeZoneId = useAppStore((state) => state.activeZoneId);
  const setZone = useAppStore((state) => state.setActiveZoneId);
  const logout = useLogout();
  const zone = session.zones.find((item) => item.zoneId === activeZoneId) ?? session.zones[0];
  const zoneId = zone?.zoneId;
  const primary = zoneId ? primaryNavItems(session, zoneId) : [];
  const secondary = zoneId
    ? pathname.startsWith("/admin")
      ? adminNavItems(session, zoneId)
      : pathname.startsWith("/resident")
        ? residentNavItems(session, zoneId)
        : []
    : [];
  const isSecurity = pathname.startsWith("/security");
  const sectionLabel = pathname.startsWith("/admin")
    ? "Manage"
    : pathname.startsWith("/resident")
      ? "Home"
      : null;

  function switchZone(nextZoneId: string) {
    setZone(nextZoneId);
    client.removeQueries({
      predicate: (query) => query.queryKey[0] === "zones" && query.queryKey[1] !== nextZoneId,
    });
    router.replace(getDefaultRouteForZone(session, nextZoneId));
  }

  const zoneSelect =
    session.zones.length > 1 ? (
      <Select value={zone?.zoneId ?? ""} onValueChange={switchZone}>
        <SelectTrigger aria-label="Current zone" className="w-full">
          <SelectValue placeholder="Choose zone" />
        </SelectTrigger>
        <SelectContent>
          {session.zones.map((item) => (
            <SelectItem key={item.zoneId} value={item.zoneId}>
              {item.zone.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    ) : null;

  return (
    <div className="min-h-dvh bg-background">
      <OfflineBanner />
      <div className="md:flex md:min-h-dvh">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card md:flex">
          <div className="border-b border-border px-4 py-5">
            <p className="font-serif text-xl font-semibold tracking-tight text-primary">
              Peace Valley Zone
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {[
                zone?.zone.name && zone.zone.name.trim().toLowerCase() !== "peace valley zone"
                  ? zone.zone.name
                  : null,
                session.user.fullName,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Primary">
            {primary
              .filter((link) => link.href !== "/admin" && link.href !== "/resident")
              .map((link) => (
                <NavLink
                  key={`${link.href}-${link.label}`}
                  href={link.href}
                  label={link.label}
                  icon={primaryIcons[link.href]}
                  active={isActive(pathname, link.href)}
                  variant="sidebar"
                />
              ))}
            {secondary.length > 0 && sectionLabel ? (
              <>
                <div className="mb-1 px-3">
                  <p className="text-xs font-medium text-muted-foreground">{sectionLabel}</p>
                </div>
                {secondary.map((link) => (
                  <NavLink
                    key={`${link.href}-${link.label}`}
                    href={link.href}
                    label={link.label}
                    icon={sectionIcons[link.href]}
                    active={isActive(pathname, link.href)}
                    variant="sidebar"
                  />
                ))}
              </>
            ) : null}
          </nav>
          <div className="space-y-2 border-t border-border p-3">
            {zoneSelect}
            <Button
              variant="outline"
              className="w-full"
              onClick={() =>
                logout.mutate(undefined, { onSettled: () => router.replace("/login") })
              }
            >
              <Icon icon={LogOut} size={20} />
              Sign out
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border bg-card md:hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-serif text-lg font-semibold tracking-tight text-primary">
                  Peace Valley Zone
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {[
                    zone?.zone.name && zone.zone.name.trim().toLowerCase() !== "peace valley zone"
                      ? zone.zone.name
                      : null,
                    session.user.fullName,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {session.zones.length > 1 ? (
                  <Select value={zone?.zoneId ?? ""} onValueChange={switchZone}>
                    <SelectTrigger aria-label="Current zone" className="w-36">
                      <SelectValue placeholder="Zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {session.zones.map((item) => (
                        <SelectItem key={item.zoneId} value={item.zoneId}>
                          {item.zone.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Sign out"
                  onClick={() =>
                    logout.mutate(undefined, { onSettled: () => router.replace("/login") })
                  }
                >
                  <Icon icon={LogOut} size={20} />
                </Button>
              </div>
            </div>
            {secondary.length > 0 && !isSecurity ? (
              <nav
                className="flex gap-1 overflow-x-auto border-t border-border px-2 py-1"
                aria-label={sectionLabel ?? "Secondary"}
              >
                {secondary.map((link) => (
                  <NavLink
                    key={`${link.href}-${link.label}`}
                    href={link.href}
                    label={link.label}
                    active={isActive(pathname, link.href)}
                    variant="section"
                  />
                ))}
              </nav>
            ) : null}
          </header>

          <main
            className={cn(
              "mx-auto w-full flex-1 px-4 py-6",
              "max-w-6xl",
              "pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-8",
            )}
          >
            {children}
          </main>
        </div>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Primary"
      >
        <div className="flex">
          {primary.map((link) => (
            <NavLink
              key={`${link.href}-${link.label}`}
              href={link.href}
              label={link.label}
              icon={primaryIcons[link.href]}
              active={
                link.href === "/admin"
                  ? pathname.startsWith("/admin")
                  : link.href === "/resident"
                    ? pathname.startsWith("/resident")
                    : pathname.startsWith("/security")
              }
              variant="bottom"
            />
          ))}
        </div>
      </nav>
    </div>
  );
}
