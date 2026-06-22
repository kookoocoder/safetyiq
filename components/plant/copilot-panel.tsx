"use client";

import { useCallback, useState } from "react";

import type { RiskLevel } from "@/app/lib/plant-zone-types";
import { RiskBadge } from "@/components/plant/risk-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelLabel,
} from "@/components/ui/panel";
import { cn } from "@/lib/utils";

interface BriefingTopRisk {
  zoneId: string;
  zoneName: string;
  level: RiskLevel;
  reason: string;
}

interface SafetyBriefing {
  headline: string;
  situation: string;
  topRisks: BriefingTopRisk[];
  recommendedActions: string[];
  watchItems: string[];
}

interface BriefingResponse {
  ok: boolean;
  briefing?: SafetyBriefing;
  source?: "llm" | "template";
  error?: string;
}

interface AskResponse {
  ok: boolean;
  answer?: string;
  source?: "llm" | "template";
  error?: string;
}

interface CopilotPanelProps {
  className?: string;
}

export function CopilotPanel({ className }: CopilotPanelProps) {
  const [briefing, setBriefing] = useState<SafetyBriefing | null>(null);
  const [briefingSource, setBriefingSource] = useState<
    "llm" | "template" | null
  >(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [briefingError, setBriefingError] = useState<string | null>(null);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [askSource, setAskSource] = useState<"llm" | "template" | null>(null);
  const [askLoading, setAskLoading] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);

  const generateBriefing = useCallback(async () => {
    setBriefingLoading(true);
    setBriefingError(null);
    try {
      const res = await fetch("/api/copilot/briefing", { method: "POST" });
      const data = (await res.json()) as BriefingResponse;
      if (!res.ok || !data.ok || !data.briefing) {
        throw new Error(data.error ?? "Briefing request failed");
      }
      setBriefing(data.briefing);
      setBriefingSource(data.source ?? null);
    } catch (err) {
      setBriefingError(
        err instanceof Error ? err.message : "Briefing request failed",
      );
    } finally {
      setBriefingLoading(false);
    }
  }, []);

  const askPlant = useCallback(async () => {
    const q = question.trim();
    if (!q || askLoading) return;
    setAskLoading(true);
    setAskError(null);
    setAnswer(null);
    try {
      const res = await fetch("/api/copilot/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = (await res.json()) as AskResponse;
      if (!res.ok || !data.ok || !data.answer) {
        throw new Error(data.error ?? "Ask request failed");
      }
      setAnswer(data.answer);
      setAskSource(data.source ?? null);
    } catch (err) {
      setAskError(err instanceof Error ? err.message : "Ask request failed");
    } finally {
      setAskLoading(false);
    }
  }, [question, askLoading]);

  return (
    <Panel className={cn("h-auto", className)}>
      <PanelHeader>
        <PanelLabel>Plant Copilot</PanelLabel>
        {briefingSource && (
          <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            {briefingSource === "llm" ? "local AI" : "template"}
          </span>
        )}
      </PanelHeader>
      <PanelContent className="space-y-5">
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Live plant safety briefing from local AI
            </p>
            <Button
              type="button"
              size="sm"
              disabled={briefingLoading}
              onClick={() => void generateBriefing()}
            >
              {briefingLoading ? "Generating…" : "Generate Safety Briefing"}
            </Button>
          </div>

          {briefingError && (
            <p className="rounded-sm border border-destructive/30 bg-destructive/5 px-2.5 py-2 font-mono text-[10px] text-destructive">
              {briefingError}
            </p>
          )}

          {briefing && (
            <div className="space-y-4 rounded-sm border border-border bg-muted/20 p-3">
              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold leading-snug text-foreground">
                  {briefing.headline}
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {briefing.situation}
                </p>
              </div>

              {briefing.topRisks.length > 0 && (
                <div className="space-y-2">
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    Top risks
                  </p>
                  <ul className="space-y-2">
                    {briefing.topRisks.map((risk) => (
                      <li
                        key={`${risk.zoneId}-${risk.level}`}
                        className="flex items-start gap-2"
                      >
                        <RiskBadge level={risk.level} className="mt-0.5" />
                        <div className="min-w-0 space-y-0.5">
                          <p className="font-mono text-xs text-foreground">
                            {risk.zoneName}
                          </p>
                          <p className="text-[11px] leading-relaxed text-muted-foreground">
                            {risk.reason}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {briefing.recommendedActions.length > 0 && (
                <div className="space-y-2">
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    Recommended actions
                  </p>
                  <ol className="list-decimal space-y-1.5 pl-4">
                    {briefing.recommendedActions.map((action) => (
                      <li
                        key={action}
                        className="text-xs leading-relaxed text-foreground"
                      >
                        {action}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {briefing.watchItems.length > 0 && (
                <div className="space-y-2">
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    Watch items
                  </p>
                  <ul className="space-y-1">
                    {briefing.watchItems.map((item) => (
                      <li
                        key={item}
                        className="font-mono text-[11px] text-muted-foreground before:mr-1.5 before:content-['•']"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="space-y-3 border-t border-border pt-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Ask the plant
          </p>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void askPlant();
            }}
          >
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Which zone needs attention first?"
              disabled={askLoading}
              className="h-8"
              aria-label="Ask the plant"
            />
            <Button
              type="submit"
              size="sm"
              variant="outline"
              disabled={askLoading || !question.trim()}
            >
              {askLoading ? "…" : "Ask"}
            </Button>
          </form>

          {askError && (
            <p className="rounded-sm border border-destructive/30 bg-destructive/5 px-2.5 py-2 font-mono text-[10px] text-destructive">
              {askError}
            </p>
          )}

          {answer && (
            <div className="space-y-1 rounded-sm border border-border bg-card px-2.5 py-2">
              {askSource && (
                <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  {askSource === "llm" ? "local AI" : "template fallback"}
                </p>
              )}
              <p className="text-xs leading-relaxed text-foreground">
                {answer}
              </p>
            </div>
          )}
        </section>
      </PanelContent>
    </Panel>
  );
}
