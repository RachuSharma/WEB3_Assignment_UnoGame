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

1. Lobby (setup screen): enter your name. Create a game for 2-4 players, or join one of the games waiting for players. The list updates live.
2. Waiting room: shows who has joined. The round starts automatically for everyone when the game is full.
3. Table (playing screen): highlighted cards can be played; wild cards open a colour chooser. Draw when needed. Say UNO before playing down to one card. When an opponent has one card, "Catch missed UNO!" accuses them; it succeeds only if they did not say UNO and nobody has acted since. When someone wins, the table shows the winner and a link back to the lobby.

## Structure

- `src/model/uno-client.ts`: Apollo Client with HTTP for queries and mutations and a WebSocket for subscriptions.
- `src/stores`: Pinia stores for the player's name, the open games and the current game.
- `src/router/index.ts`: lobby at `/`, game at `/game/:id/:player`.
- `src/views/LobbyView.vue`: identify yourself, create a game, join a game.
- `src/views/GameView.vue`: subscribes to the game, sends the player's actions and shows the waiting room or the table.
- `src/components/GameTable.vue` and `UnoCard.vue`: the table and cards, adapted from Assignment 2.

The server decides which cards are playable and sends each player only their own hand, so the client contains no rule logic.

## Checks

```powershell
npm run build
```

This type-checks with vue-tsc and builds for production.
