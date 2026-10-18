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

The game and your name are part of the address (`/game/:id/:player`), so refreshing the page loads the game again from the server. "New game" returns to setup; the server keeps the game for the other players.

## Structure

The client has the same structure as the Assignment 2 client in `../Vue_Client_Assignment2`, and stores its data the same way as the reference projects. The difference is where the opponents come from: GraphQL instead of bots in web workers.

- `src/stores`: small Pinia stores with simple setters, one per piece of data: `PendingGamesStore` (games waiting for players), `OngoingGameStore` (the game this player is in), `PlayerHandsStore` (names and card counts), `CurrentPlayerStore` (whose turn it is), `DiscardPileStore` (top card and current colour) and `CardsStore` (your hand and the cards you may play).
- `src/game/useUnoGame.ts`: used by the game screen. It subscribes to the game, sends your actions and copies the newest snapshot from the server into the stores.
- `src/router/index.ts`: setup at `/`, game at `/game/:id/:player`.
- `src/views`: one view per route. `SetupView.vue` lists the open games and creates or joins a game; `GameView.vue` runs the game with `useUnoGame`.
- `src/components`: `WaitingRoom.vue` and `GameTable.vue` read the stores and emit the player's choices; `UnoCard.vue` shows one card. The table and cards are adapted from Assignment 2.
- `src/game/unoClient.ts`: Apollo Client with HTTP for queries and mutations and a WebSocket for subscriptions.
- `src/game/types.ts`: the game state and open games types.

The server decides which cards are playable and sends each player only their own hand, so the client contains no rule logic.

## Checks

```powershell
npm run build
```

This type-checks with vue-tsc and builds for production.
