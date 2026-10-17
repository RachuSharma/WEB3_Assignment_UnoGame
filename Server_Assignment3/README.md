# UNO - Assignment 3 server

Apollo GraphQL server that lets 2-4 people play one round of UNO against each other. The rules come from the unchanged Assignment 1 model in `../OOModel_Assignmet1`; the server only coordinates players and notifications.

## Run

Use a Node version matching package.json (Node 22.18+ within v22, or Node 24.12+).

```powershell
Set-Location 'Server_Assignment3'
npm install
npm start
```

The server listens on http://localhost:4000/graphql. Queries and mutations use HTTP; subscriptions use a WebSocket on the same URL. Start the server before the client in `../Vue_Client_Assignment3`.

## Requirements covered (must have)

- Users identify themselves with a name, create a game for 2-4 players, and join a waiting game from the lobby.
- The round starts when the game is full and is played by the Assignment 1 `Round`, so the official rules apply: legal plays, Draw Two, Wild Draw Four, Skip, Reverse, saying and catching UNO.
- Every change (join, start, play, draw, UNO, successful catch) is published to every participant through the `game_updated` subscription. The lobby is kept up to date through `pending_games_updated`.
- GraphQL is the only protocol between client and server.

Optional requirements (database, registration/login, a full game with score, saving and resuming) are not implemented. Games live in memory while the server runs.

## Structure

- `src/uno.sdl`: GraphQL schema.
- `src/gameserver.ts`: Express, Apollo Server, WebSocket server and the PubSub broadcaster.
- `src/resolvers.ts`: maps GraphQL operations to the API and turns rule violations into GraphQL errors.
- `src/api.ts`: performs an action, then broadcasts the changed game.
- `src/servermodel.ts`: games, joining, starting the round, player actions, and `player_view`, which hides other players' hands.
- `src/memorystore.ts`: in-memory game store. Each update reads and writes in one step, so simultaneous requests cannot overwrite each other.
- `tests/server.test.ts`: Jest tests for joining, validation, hidden hands, UNO catching and complete seeded rounds with 2-4 players.

## Checks

```powershell
npm run type-check
npm test
```

`npm test` uses the Jest installation and configuration in the repository root, so run `npm install` in the root first.
