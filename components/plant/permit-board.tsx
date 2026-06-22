"use client";

import type { PermitRecord } from "@/app/lib/permit-types";
import { PermitStatusBadge } from "@/components/plant/permit-status-badge";
import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelLabel,
} from "@/components/ui/panel";
import { cn } from "@/lib/utils";

interface PermitBoardProps {
  permits: PermitRecord[];
  isLoading?: boolean;
  className?: string;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PermitBoard({
  permits,
  isLoading,
  className,
}: PermitBoardProps) {
  return (
    <Panel className={cn("h-full", className)}>
      <PanelHeader>
        <PanelLabel>Permit-to-Work Registry</PanelLabel>
        <span className="font-mono text-[9px] text-op-text-muted">
          {permits.length} active
        </span>
      </PanelHeader>
      <PanelContent className="p-0">
        {isLoading ? (
          <p className="p-3 font-mono text-xs text-op-text-muted">Loading…</p>
        ) : permits.length === 0 ? (
          <p className="p-3 font-mono text-xs text-op-text-muted">
            No active permits
          </p>
        ) : (
          <ul className="divide-y divide-op-border">
            {permits.map((permit) => (
              <li
                key={permit.id}
                className="flex items-center justify-between gap-3 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-xs text-foreground">
                    {permit.displayName}
                  </p>
                  <p className="font-mono text-[10px] text-op-text-muted">
                    {permit.zoneId.replace("zone-", "Zone ").toUpperCase()} ·{" "}
                    {permit.issuedBy} · until {formatTime(permit.validUntil)}
                  </p>
                </div>
                <PermitStatusBadge status={permit.status} />
              </li>
            ))}
          </ul>
        )}
      </PanelContent>
    </Panel>
  );
}
