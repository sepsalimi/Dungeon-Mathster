# Dungeon Mathster

A mobile-friendly, first-person pixel dungeon crawler where combat is driven by swipe-only math grid puzzles. It is a single, 100% client-side browser app (React 19 + TypeScript + Vite). There is no backend, database, auth, or environment variables.

## Cursor Cloud specific instructions

### Services

Only one service exists: the Vite dev server (the whole game runs in the browser).

- Package manager is pnpm (see `pnpm-lock.yaml`). Node 22 and pnpm are already available.
- Standard commands live in `package.json` scripts:
  - `pnpm dev` runs the game (`vite --host 0.0.0.0`, serves on port 5173). `vite.config.ts` sets `server.allowedHosts: true`, so proxied hosts work.
  - `pnpm lint` is a TypeScript typecheck only (`tsc -b --noEmit`); there is no ESLint.
  - `pnpm test` runs Vitest (`vitest run`).
  - `pnpm build` runs `tsc -b && vite build`.

### Non-obvious notes

- `pnpm install` prints a warning that esbuild build scripts were ignored. This is harmless: `dev`, `build`, and `test` all work without running `pnpm approve-builds`, because esbuild ships its native binary as a platform-specific optional dependency.
- Manual testing gotcha: in combat, you answer a "MAKE n" target by swiping (click-drag) a path of tiles that alternates number -> "+" -> number. Tiles in the path must be orthogonally adjacent (up/down/left/right); diagonal or non-adjacent selections register as a MISS. Keep this in mind when driving the grid via automation.
