"use client";

import type { CompoundRiskEvent } from "@/app/lib/compound-risk-types";
import { RiskBadge } from "@/components/plant/risk-badge";
import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelLabel,
} from "@/components/ui/panel";
import { cn } from "@/lib/utils";

interface RiskEventFeedProps {
  events: CompoundRiskEvent[];
  className?: string;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function RiskEventFeed({ events, className }: RiskEventFeedProps) {
  return (
    <Panel className={cn("h-full", className)}>
      <PanelHeader>
        <PanelLabel>Risk Event Feed</PanelLabel>
        <span className="font-mono text-[9px] text-op-text-muted">
          {events.length} events
        </span>
      </PanelHeader>
      <PanelContent className="p-0">
        {events.length === 0 ? (
          <p className="p-3 font-mono text-xs text-op-text-muted">
            No compound risk events — all zones nominal
          </p>
        ) : (
          <ul className="divide-y divide-op-border">
            {events.map((event) => (
              <li key={event.id} className="space-y-2 px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <RiskBadge level={event.newLevel} />
                    <span className="font-mono text-xs text-foreground">
                      {event.zoneName}
                    </span>
                  </div>
                  <span className="font-mono text-[9px] text-op-text-muted">
                    {formatTime(event.timestamp)}
                  </span>
                </div>
                <p className="font-mono text-[10px] text-op-text-sec">
                  {event.firedRules.join(" · ")}
                </p>
                <p className="text-xs leading-relaxed text-op-text-sec">
                  {event.llmExplanation ?? "Analyzing compound risk…"}
                </p>
                {event.contributingSignals.length > 0 && (
                  <ul className="space-y-0.5">
                    {event.contributingSignals.map((signal) => (
                      <li
                        key={`${signal.type}-${signal.label}`}
                        className="font-mono text-[9px] text-op-text-muted"
                      >
                        · {signal.label}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </PanelContent>
    </Panel>
  );
}
