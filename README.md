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
- Enemies attack on a timer that starts at 8s on floor 1 and tightens each floor.
- Gold rewards, door choices, shop upgrades, boss dialog.
- A 5-floor run: beat The Bedmas King on floor 5 to win.

## Balance

Enemy curves, shop prices, and bargains are tuned with a Monte Carlo simulator
(`src/game/simulate.ts`) that replays full runs through the real combat and shop
code for three skill profiles (solve speed plus accuracy). `src/game/balance.test.ts`
asserts the targets: slow solvers clear floor 1 over 85% of the time but cannot
finish the run, floor 1 monsters take about 5 correct answers, and the 5-floor
victory stays contested for everyone else. Run `pnpm test` to print the current
win-rate and clear-rate table.
