# Workflow

## Operating Rules for Claude Code

1. **Start from tests**: For any task, add/adjust scenarios in `/tests/**.feature` first
2. **Link tests to spec**: Each scenario cites spec section IDs (e.g., AudioTiming#DropWindow)
3. **One unit of value per PR**: Small, vertical slices. Include a short rationale
4. **No new deps without ADR**: Propose in `specs/dev/ADR-Template.md`
5. **Keep determinism**: Audio clock and scheduler expose a test mode

## Task Format (copy/paste prompt)

```
Goal: Implement <Feature/Scenario name> from tests
Specs: /specs/product/ExperienceSpec.md §§ <ids>, /specs/tech/AudioTiming.md §§ <ids>
Acceptance: /tests/<path>/<file>.feature scenarios <names>
Constraints: Deterministic scheduler; no new dependencies; update telemetry events
Deliverables: Code, updated tests, short notes referencing spec ids
```