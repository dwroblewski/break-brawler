# ADR-0001: Input Layer

Date: 2025-08-21
Status: Accepted
Context: Need device-agnostic input handling for keyboard, pointer, and touch
Decision: All devices emit high-level actions via InputController; GestureEmulator maps keyboard combos to swipe/hold/flick
Consequences: Added indirection; must document timing thresholds
References: specs/product/ExperienceSpec.md#2.3, specs/tech/Architecture.md#InputLayer