"use client";

import type { SensorReading } from "@/app/lib/sensor-types";
import { cn } from "@/lib/utils";

interface SensorSparklineProps {
  history: SensorReading[];
  warningAt: number;
  criticalAt: number;
  className?: string;
}

export function SensorSparkline({
  history,
  warningAt,
  criticalAt,
  className,
}: SensorSparklineProps) {
  const width = 120;
  const height = 28;
  const padding = 2;

  if (history.length < 2) {
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={cn("w-full opacity-40", className)}
        aria-hidden
      >
        <title>Waiting for sensor history</title>
        <line
          x1={padding}
          y1={height / 2}
          x2={width - padding}
          y2={height / 2}
          stroke="var(--gauge-track)"
          strokeWidth="1"
        />
      </svg>
    );
  }

  const values = history.map((h) => h.value);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, criticalAt * 1.05);
  const range = max - min || 1;

  const points = values
    .map((v, i) => {
      const x = padding + (i / (values.length - 1)) * (width - padding * 2);
      const y = height - padding - ((v - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const last = values[values.length - 1] ?? 0;
  const stroke =
    last >= criticalAt ? "#dc2626" : last >= warningAt ? "#ca8a04" : "#16a34a";

  const warnY =
    height - padding - ((warningAt - min) / range) * (height - padding * 2);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("w-full", className)}
      aria-hidden
    >
      <title>Sensor trend over the last 60 seconds</title>
      <line
        x1={padding}
        y1={warnY}
        x2={width - padding}
        y2={warnY}
        stroke="#ca8a04"
        strokeWidth="0.5"
        strokeDasharray="2 2"
        opacity={0.4}
      />
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
}
