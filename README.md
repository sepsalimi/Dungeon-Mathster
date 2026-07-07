# Dungeon Mathster

A mobile-friendly first-person pixel dungeon crawler where combat is driven by swipe-only math grid puzzles.

## Local development

```bash
pnpm install
pnpm dev
```

## Checks

```bash
pnpm lint
pnpm test
pnpm build
```

## MVP scope

- Floor 1 addition-only combat.
- 3x3 normal monster rooms and 4x4 boss room.
- Swipe path validation with no diagonals and no reused tiles.
- Monster attacks every 5 seconds for 5 HP, reduced by armor.
- Gold rewards, door choices, shop upgrades, boss dialog, and victory loop.
