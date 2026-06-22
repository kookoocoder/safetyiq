"use client";

import type { CompoundRiskEvent } from "@/app/lib/compound-risk-types";
import { RiskBadge } from "@/components/plant/risk-badge";
import { Button } from "@/components/ui/button";
import { MonoLabel } from "@/components/ui/mono-label";
import { cn } from "@/lib/utils";

interface CompoundAlertModalProps {
  open: boolean;
  event: CompoundRiskEvent | null;
  onAcknowledge: () => void;
}

export function CompoundAlertModal({
  open,
  event,
  onAcknowledge,
}: CompoundAlertModalProps) {
  if (!open || !event) return null;

  const isAnalyzing = !event.llmExplanation;

  return (
    <div
      data-slot="compound-alert-modal"
      className="fixed inset-0 z-[100] flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" />

      <div className="relative z-10 mx-4 w-full max-w-2xl overflow-hidden rounded-md border border-red-300 bg-card shadow-2xl">
        <div className="h-1 w-full animate-pulse bg-gradient-to-r from-orange-500 to-red-500" />

        <div className="flex flex-col gap-5 p-6">
          <div className="flex items-start justify-between border-b border-border pb-4">
            <div>
              <h2 className="flex items-center gap-3 font-mono text-xl font-bold text-red-700">
                <span
                  className="material-symbols-outlined text-2xl animate-pulse"
                  style={{ fontVariationSettings: '"FILL" 1' }}
                >
                  crisis_alert
                </span>
                COMPOUND RISK ALERT
              </h2>
              <MonoLabel className="mt-1 text-op-text-sec">
                {event.zoneName} · {event.id}
              </MonoLabel>
            </div>
            <RiskBadge level={event.newLevel} />
          </div>

          <div className="space-y-2">
            <MonoLabel size="2xs">CONTRIBUTING SIGNALS</MonoLabel>
            <ul className="space-y-1 rounded-sm border border-op-border bg-op-base/40 p-3">
              {event.contributingSignals.map((signal) => (
                <li
                  key={`${signal.type}-${signal.label}`}
                  className="flex items-start gap-2 font-mono text-[11px] text-op-text-sec"
                >
                  <span
                    className={cn(
                      "mt-0.5 size-1.5 shrink-0 rounded-full",
                      signal.severity === "CRITICAL"
                        ? "bg-red-500"
                        : signal.severity === "HIGH"
                          ? "bg-orange-500"
                          : "bg-yellow-500",
                    )}
                  />
                  {signal.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <MonoLabel size="2xs">ANALYSIS</MonoLabel>
            <p className="rounded-sm border border-op-border bg-op-elevated p-3 text-sm leading-relaxed text-foreground">
              {isAnalyzing ? "Analyzing compound risk…" : event.llmExplanation}
            </p>
          </div>

          {event.immediateActions.length > 0 && (
            <div className="space-y-2">
              <MonoLabel size="2xs">IMMEDIATE ACTIONS</MonoLabel>
              <ol className="list-decimal space-y-1 pl-5 text-sm text-op-text-sec">
                {event.immediateActions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ol>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-op-border pt-4">
            <MonoLabel
              variant={event.evacuationRequired ? "critical" : "default"}
            >
              EVACUATION REQUIRED: {event.evacuationRequired ? "YES" : "NO"}
            </MonoLabel>
            <Button variant="destructive" onClick={onAcknowledge}>
              Acknowledge
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
