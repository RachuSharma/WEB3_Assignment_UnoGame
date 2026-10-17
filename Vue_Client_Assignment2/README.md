# UNO - Assignment 2

Browser-only Vue 3 + TypeScript UNO. One human plays a round against 1-3 worker bots. Uses the unchanged sibling Assignment 1 model.

## Run

Use a Node version matching package.json (Node 22.18+ within v22, or Node 24.12+).

From the repository root in PowerShell:

```powershell
npm install
Set-Location 'Vue_Client_Assignment2'
npm install
npm run dev
```

Open the local URL printed by Vite. No API server, account, or database is needed. Keep both assignment directories next to each other: the client imports the model through relative paths.

## Play

Enter a name and choose 1-3 bots. Click a highlighted card to play; wild cards open a colour chooser. Draw when needed. The existing model keeps your turn if the drawn card is playable. Arm Say UNO before playing from two cards, or say it late before another action/catch. Catch missed UNO appears beside an eligible bot. A successful catch adds four cards as implemented in Assignment 1. New round returns to setup and stops existing workers. The result screen displays the round winner and points.

One round is implemented. Optional full-match scoring and persistence are outside this implementation.

## Checks

From this directory, after installing dependencies in both the root and client:

```powershell
npm run build
npm test -- --runInBand
```

Jest runs the original model tests and bot integration checks, including 300 seeded rounds across 2-4 players and UNO behaviour. Check interface interactions and worker communication manually in the browser.

## Structure

- src/game/useUnoGame.ts: reactive coordination, model actions, worker lifecycle; writes what is displayed into the stores.
- src/stores: small Pinia stores, one per piece of data (cards, player hands, current player, discard pile, ongoing game), as in the reference projects.
- src/router/index.ts: routes for setup (/), game (/game) and result (/result).
- src/views: one view per route; GameView runs the round with useUnoGame.
- src/components: table, reusable card, and results; they read the stores and emit the player's choices.
- src/game/types.ts: typed messages and game setup.
- src/game/botStrategy.ts: decisions among legal moves; no duplicate UNO rule engine.
- src/workers/bot.worker.ts: postMessage/onmessage worker entry point.
- ../OOModel_Assignmet1: original UNO model and tests.
- Assignment2.md: explanations and exam revision notes.

The client follows the teacher's MVVM and Components material: single source of truth, derived reactive state, props down, events up, consistent Composition API. It uses the same structure as the Assignment 3 client and the reference projects: small Pinia stores for state, Vue Router for screens, views for routes and components for presentation.

## Testing approach

Jest is the only test runner. The root configuration discovers both assignments' tests. Run npm test -- --runInBand from the root or this directory. Integration checks exercise bot decisions and the model; they do not replace manual browser checks of the Vue interface and Web Workers.
