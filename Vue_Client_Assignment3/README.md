# UNO - Assignment 3 client

Vue 3 + TypeScript client for playing one round of UNO against 1-3 other people through the GraphQL server in `../Server_Assignment3`. It uses the Composition API throughout, like Assignment 2.

## Run

Start the server first (see `../Server_Assignment3/README.md`), then:

```powershell
Set-Location 'Vue_Client_Assignment3'
npm install
npm run dev
```

Open the local URL printed by Vite in one browser window per player (for example a normal and a private window, or several tabs).

## Play

1. Setup screen: enter your name. Create a game for 2-4 players, or join one of the games waiting for players. The list updates live.
2. Waiting room: shows who has joined. The round starts automatically for everyone when the game is full.
3. Table (playing screen): highlighted cards can be played; wild cards open a colour chooser. Draw when needed. Say UNO before playing down to one card. When an opponent has one card, "Catch missed UNO!" accuses them; it succeeds only if they did not say UNO and nobody has acted since. When someone wins, the table shows the winner and a button back to setup.

The game lives in the page's memory, as in Assignment 2. Refreshing the page or choosing "New game" returns to setup; the server keeps the game for the other players.

## Structure

The client has the same structure as the Assignment 2 client in `../Vue_Client_Assignment2`. The difference is where the opponents come from: GraphQL instead of bots in web workers.

- `src/stores/GameStore.ts`: Pinia store with the open games, the current game, derived state (your hand, legal cards, whose turn it is) and every action. It subscribes to the game and keeps the newest snapshot the server sends.
- `src/router/index.ts`: setup at `/`, game at `/game`. A route guard returns to setup when there is no game.
- `src/views`: one view per route. `SetupView.vue` (identify yourself, create or join a game) and `GameView.vue` connect the store to the components.
- `src/components`: `WaitingRoom.vue`, `GameTable.vue` and `UnoCard.vue` only receive props and emit events. The table and cards are adapted from Assignment 2.
- `src/game/unoClient.ts`: Apollo Client with HTTP for queries and mutations and a WebSocket for subscriptions.
- `src/game/types.ts`: the game state, open games and setup types.

The server decides which cards are playable and sends each player only their own hand, so the client contains no rule logic.

## Checks

```powershell
npm run build
```

This type-checks with vue-tsc and builds for production.
