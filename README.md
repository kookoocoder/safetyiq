# SafetyIQ

**Compound risk detection for industrial environments — before the accident, not after.**

SafetyIQ fuses three live signal streams — **CCTV object detection**, **SCADA sensor telemetry**, and **permit-to-work (PTW) status** — into a real-time compound risk engine. When multiple risk factors co-occur in the same plant zone, SafetyIQ scores the hazard, surfaces an alert, and generates LLM-backed explanations with recommended actions via LM Studio.

Licensed under **GPL-2.0**. Full technical detail lives in [`docs/DOCUMENTATION.md`](docs/DOCUMENTATION.md).

### Quick start

```bash
pnpm install
cp .example.env .env.local   # set LMSTUDIO_WATCH_MODEL=lfm-ucf
pnpm dev
```

Load **`lfm-ucf`** in LM Studio (port 1234), then open `http://localhost:3000`.

| Route | Purpose |
|-------|---------|
| `/plant` | 3D plant map, sensors, permits, risk feed |
| `/plant/scenario` | Demo scenario triggers (A / B / C) |
| `/monitor` | Live CCTV + zone risk sidebar |
| `/settings/threat-log` | CCTV + compound audit trail |
| `/settings/zones` | Zone configuration |

### Demo arc

1. Open `/plant` and `/plant/scenario`
2. Trigger **Scenario A** — gas ramps, hot work permit, CRITICAL modal (~30s)
3. Open **Threat Log** — compound events appear alongside CCTV threats

### What it does

- **Compound risk rules** — eight cross-signal rules (sensor + permit + visual) that no siloed system would catch alone
- **Local vision** — YOLO / RF-DETR ONNX inference on WebGPU (CPU fallback)
- **Mock SCADA + PTW** — SSE sensor feed and permit registry for demos; swap for real OPC-UA / enterprise PTW later
- **LLM explanations** — hazard knowledge base + LM Studio reasoning, with deterministic template fallback
- **3D plant twin** — interactive Three.js overview with risk-colored zones and hazard effects

### Scripts

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start development server |
| `pnpm build` / `pnpm start` | Production build and serve |
| `pnpm lint` / `pnpm format` | Biome check / format |
| `pnpm test` | Risk-engine unit tests |

### Requirements

- Node.js (recent) and **pnpm**
- GPU drivers with **WebGPU** support recommended
- **LM Studio** at `ws://127.0.0.1:1234` for watch / risk explanations
