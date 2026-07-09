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
- Enemies attack on a timer that starts at 7.5s on floor 1 and tightens each floor.
- Gold rewards, door choices, shop upgrades, boss dialog, and victory loop.

## Balance

Enemy curves, shop prices, and bargains are tuned with a Monte Carlo simulator
(`src/game/simulate.ts`) that replays full runs through the real combat and shop
code for three skill profiles (solve speed plus accuracy). `src/game/balance.test.ts`
asserts the targets: slow solvers clear floor 1 about 95% of the time, floor 1
monsters die in about 3 correct answers, and median run depth stays finite for
every profile. Run `pnpm test` to print the current clear-rate table.
