# Data Schemas

## Break Pack (YAML/JSON)

```yaml
name: Amen Family
bpm: 172
slices:
  - id: KICK   # labels match pad IDs
    start: 0.000
    end: 0.210
    velCurve: punchy
  - id: SNARE
    start: 0.420
    end: 0.600
    velCurve: snappy
  - id: HAT
    start: 0.300
    end: 0.360
  - id: GHOST
    start: 0.380
    end: 0.410
    ghostDefault: 0.4
feel:
  swing: 0.58
  template: Skippy Jungle
```

## FX Macro

```yaml
name: Tape Stop
params:
  depth: medium
  timeMs: 400
```