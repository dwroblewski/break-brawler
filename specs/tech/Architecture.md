# Architecture

## High-level Design

### Input Layer
Keyboard, Pointer/Touch → InputController → actions (PadPress, RollStart, DropTrigger, etc.)
Includes GestureEmulator so keyboards can produce rolls/stutters
iPad optimized: touch-action: none, velocity tracking, multi-touch support

### Clock & Scheduler
- BeatClock (BPM, phase)
- AudioScheduler (quantization windows, lookahead, jitter budget)
- Deterministic for tests

### Audio Engine
- Hybrid: Tone.js Transport + raw Web Audio for samples
- AudioContext with latencyHint: "interactive"
- Pre-buffered samples for instant playback
- Sampler (slices, envelopes)
- FXBus (tape, brake, filter) - avoid ConvolverNode on mobile
- Sidechain (shapes: Light/Classic/Heavy)

### Game Core
- Combo
- Hype
- Scoring (Timing/Flow/Taste)
- Assist controller

### UI Layer
- Play Screen
- End-of-Run
- Daily Break
- Purely subscribes to state/events

### Telemetry
Event stream (privacy-light) for KPIs

## Data Flows
- Action → Game Core (validates timing window) → Scheduler → Audio → Telemetry
- End-of-run: State snapshot → Clip exporter → Save/Share

## Non-goals (v0)
- Multiplayer live sync
- Content editor  
- Gamified economy beyond cosmetics