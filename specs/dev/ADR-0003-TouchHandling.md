# ADR-0003: Touch Handling for iPad

Date: 2025-08-21
Status: Accepted
Context: iPad touch gestures need special handling for swipe/hold/flick detection

Decision:
- Use native touch events (not libraries initially)
- CSS touch-action: none on pads
- Track velocity for swipe detection
- Multi-touch support for advanced play

Implementation:
```css
.pad {
  touch-action: none; /* Disable browser gestures */
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
```

```javascript
// Gesture detection
class TouchController {
  constructor() {
    this.touches = new Map();
    this.velocities = new Map();
  }
  
  handleTouchStart(e) {
    e.preventDefault(); // Stop iOS bounce
    const touch = e.changedTouches[0];
    this.touches.set(touch.identifier, {
      startTime: Date.now(),
      startX: touch.clientX,
      startY: touch.clientY
    });
  }
}
```

Consequences:
- Full control over gestures
- Must implement velocity tracking
- No library dependency

References:
- specs/product/ExperienceSpec.md#2.3
- Research: touch-action: none critical for games