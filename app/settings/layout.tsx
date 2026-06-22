import type { ReactNode } from "react";

import { SettingsSidebar } from "@/components/shell";

const settingsGroups = [
  {
    heading: "System Settings",
    items: [
      {
        href: "/settings/camera-management",
        label: "Camera Management",
        icon: "videocam",
      },
      {
        href: "/settings/zones",
        label: "Zones & Sensors",
        icon: "map",
      },
    ],
  },
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-op-base">
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <SettingsSidebar groups={settingsGroups} />
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-op-base">
          {children}
        </main>
      </div>
    </div>
  );
}
