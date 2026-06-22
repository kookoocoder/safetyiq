"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type * as React from "react";

import { SITE_NAME, SITE_NAV_TAGLINE } from "@/app/lib/branding";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  /** Exact match (default) vs prefix match */
  exact?: boolean;
}

interface TopNavProps extends React.ComponentProps<"nav"> {
  items?: NavItem[];
  /** Right-side slot: notifications, avatar, etc. */
  actions?: React.ReactNode;
}

const defaultNavItems: NavItem[] = [
  { href: "/plant", label: "PLANT OVERVIEW" },
  { href: "/monitor", label: "LIVE MONITOR" },
  { href: "/plant/scenario", label: "INCIDENT PILOT" },
  { href: "/settings", label: "PLANT SETUP", exact: false },
];

/**
 * TopNav — primary application navigation bar.
 *
 * Layout: [Brand + tagline] [nav links] ··· [actions]
 * Active link: underline + subtle elevated background
 * Inactive link: muted text, hover elevated
 */
function TopNav({
  items = defaultNavItems,
  actions,
  className,
  ...props
}: TopNavProps) {
  const pathname = usePathname();

  return (
    <nav
      data-slot="top-nav"
      className={cn(
        "flex h-14 w-full shrink-0 items-center justify-between border-b border-border bg-card px-4 shadow-sm sm:px-6",
        className,
      )}
      {...props}
    >
      {/* Left: Brand + nav links */}
      <div className="flex h-full min-w-0 items-center gap-0">
        <Link
          href="/plant"
          className="mr-5 flex min-w-0 flex-col justify-center leading-none sm:mr-8"
        >
          <span className="font-sans text-[15px] font-semibold tracking-tight text-foreground">
            {SITE_NAME}
          </span>
          <span className="mt-0.5 hidden truncate font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground sm:block">
            {SITE_NAV_TAGLINE}
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden h-full items-center md:flex">
          {items.map((item) => {
            const isActive =
              item.exact !== false
                ? pathname === item.href
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-full items-center px-3 font-mono text-xs uppercase tracking-[0.12em] transition-colors duration-75 lg:px-4",
                  isActive
                    ? "border-b-2 border-foreground bg-muted/60 text-foreground"
                    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Right: actions slot */}
      {actions && <div className="flex items-center gap-1">{actions}</div>}
    </nav>
  );
}

/**
 * NavIconButton — ghost icon button for the top nav right side.
 * Renders a Material Symbol icon.
 */
interface NavIconButtonProps extends React.ComponentProps<"button"> {
  icon: string;
  /** Optional notification dot */
  badge?: boolean;
}

function NavIconButton({
  icon,
  badge = false,
  className,
  ...props
}: NavIconButtonProps) {
  return (
    <button
      data-slot="nav-icon-button"
      className={cn(
        "relative flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        className,
      )}
      {...props}
    >
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
      {badge && (
        <span className="absolute right-1 top-1 size-1.5 rounded-full bg-op-warning" />
      )}
    </button>
  );
}

/**
 * NavAvatar — small user avatar for the top nav.
 */
interface NavAvatarProps extends React.ComponentProps<"div"> {
  src?: string;
  fallback?: string;
}

function NavAvatar({ src, fallback, className, ...props }: NavAvatarProps) {
  return (
    <div
      data-slot="nav-avatar"
      className={cn(
        "size-6 shrink-0 overflow-hidden rounded-md border border-border bg-muted",
        className,
      )}
      {...props}
    >
      {src ? (
        <Image
          src={src}
          alt={fallback ?? "User"}
          width={24}
          height={24}
          unoptimized
          className="h-full w-full object-cover grayscale opacity-80"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center">
          <span className="material-symbols-outlined text-[14px] text-op-text-sec">
            person
          </span>
        </span>
      )}
    </div>
  );
}

export { TopNav, NavIconButton, NavAvatar, defaultNavItems };
export type { NavItem };
