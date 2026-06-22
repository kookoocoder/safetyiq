"use client";

import type React from "react";
import { defaultNavItems, NavAvatar, NavIconButton, TopNav } from "./shell";

export function AppShell({
  children,
}: {
  readonly children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="flex h-dvh max-h-dvh min-h-0 w-full flex-col overflow-hidden bg-background">
      <TopNav
        items={defaultNavItems}
        actions={
          <div className="flex items-center gap-1">
            <NavIconButton icon="notifications" />
            <div className="ml-1">
              <NavAvatar />
            </div>
          </div>
        }
      />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
