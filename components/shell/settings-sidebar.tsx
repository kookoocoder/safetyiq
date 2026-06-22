"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type * as React from "react";

import { cn } from "@/lib/utils";

interface SidebarItem {
  href: string;
  label: string;
  icon: string;
}

interface SidebarGroup {
  heading?: string;
  items: SidebarItem[];
}

interface SettingsSidebarProps extends React.ComponentProps<"aside"> {
  groups: SidebarGroup[];
  width?: "sm" | "default";
}

/**
 * SettingsSidebar — left sidebar for settings pages.
 *
 * Supports grouped nav sections with headings.
 * Active item: bg-op-elevated + silver text + left border accent
 * Inactive item: foreground text, hover bg-op-elevated
 */
function SettingsSidebar({
  groups,
  width = "default",
  className,
  ...props
}: SettingsSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      data-slot="settings-sidebar"
      className={cn(
        "flex shrink-0 flex-col overflow-y-auto border-r border-border bg-card",
        width === "sm" ? "w-60" : "w-[17rem]",
        className,
      )}
      {...props}
    >
      {groups.map((group, gi) => (
        <div
          key={`${group.heading ?? "group"}:${group.items.map((item) => item.href).join("|")}`}
          className={cn("px-4 py-4", gi > 0 && "border-t border-border")}
        >
          {group.heading && (
            <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              {group.heading}
            </h2>
          )}
          <nav className="space-y-px">
            {group.items.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors duration-75",
                    isActive
                      ? "border-l-2 border-foreground bg-muted pl-2.5 font-medium text-foreground"
                      : "border-l-2 border-transparent text-foreground hover:bg-muted/60",
                  )}
                >
                  <span
                    className={cn(
                      "material-symbols-outlined text-[18px] transition-colors",
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                    style={
                      isActive
                        ? { fontVariationSettings: '"FILL" 1' }
                        : undefined
                    }
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      ))}
    </aside>
  );
}

export { SettingsSidebar };
export type { SidebarGroup, SidebarItem };
