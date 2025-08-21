# Break Brawler

**Mission**: Ship a joyful Drum'n'Bass arcade that lets anyone play classic breaks within 3 seconds, with depth for heads (microtiming, ghost notes, stylish drops).

## Working Mode

Spec & test–driven. No feature merges without a passing acceptance feature. AI agent is the primary implementer; humans review.

## v0 Target

Playable Arcade + FTUE + Daily Break (amen/think packs), keyboard + pointer, shareable 20s clip.

## KPIs

- TTF Sound < 3s
- 70% complete first run
- D1 return > 35%
- ≥20% share/challenge rate

## How to Use This Repo

1. Start with `specs/product/ExperienceSpec.md` to understand what to build
2. For any change, propose an ADR if it alters architecture (`specs/dev/ADR-Template.md`)
3. Implement tests first using the `.feature` files as source of truth. Add more scenarios as needed
4. Only then write code in `app/`. Link commits to scenarios

## Quick Start

```bash
# Install dependencies
npm install

# Run tests
npm test

# Start dev server
npm run dev
```

## Repository Structure

```
break-brawler/
├─ specs/          # Product, tech, and dev specifications
├─ tests/          # Gherkin acceptance tests
├─ app/            # Implementation code
├─ planning/       # Work queue (QUEUE.md)
└─ roadmap/        # Milestones and RFCs
```