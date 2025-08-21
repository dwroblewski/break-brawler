# ADR-0002: Audio Strategy for iPad/Chrome

Date: 2025-08-21
Status: Accepted
Context: Research shows iOS has good Web Audio performance, but needs specific optimizations

Decision: 
- Use Tone.js for Transport/Scheduling (already in package.json)
- Use raw Web Audio API for critical sample playback
- AudioContext with latencyHint: "interactive"
- Pre-buffer all drum samples on load
- Require user tap to initialize (iOS policy)

Implementation:
```javascript
// Hybrid approach
const audioCtx = new (window.AudioContext || window.webkitAudioContext)({
  latencyHint: "interactive",
  sampleRate: 44100
});

// Tone.js for timing
const transport = Tone.Transport;

// Raw buffers for instant playback
const sampleBuffers = new Map();
```

Consequences:
- Better latency than pure Tone.js
- More code complexity
- Must handle user activation

References: 
- specs/tech/AudioTiming.md
- Research: iOS no 300ms delay, latencyHint critical