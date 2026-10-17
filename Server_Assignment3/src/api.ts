import type { Card, Color } from '../../OOModel_Assignmet1/src/model/card'
import type { Shuffler } from '../../OOModel_Assignmet1/src/utils/random_utils'
import {
  ServerModel,
  type Game,
  type GameStore,
  type PendingGame,
} from './servermodel'

export interface Broadcaster {
  // Notifies the participants of a game
  send_game(game: Game): Promise<void>
  // Notifies everyone looking for a game to join
  send_pending_games(games: PendingGame[]): Promise<void>
}

export type API = {
  pending_games(): Promise<PendingGame[]>
  game(id: string): Promise<Game>
  create_game(creator: string, numberOfPlayers: number): Promise<Game>
  join_game(id: string, player: string): Promise<Game>
  play_card(
    id: string,
    player: string,
    cardIndex: number,
    color?: Color,
  ): Promise<Game>
  draw_card(id: string, player: string): Promise<Game>
  say_uno(id: string, player: string): Promise<Game>
  catch_uno(id: string, player: string, accused: string): Promise<boolean>
}

export const create_api = (
  broadcaster: Broadcaster,
  store: GameStore,
  shuffler?: Shuffler<Card>,
): API => {
  const server = new ServerModel(store, shuffler)

  async function broadcast_pending_games() {
    await broadcaster.send_pending_games(await server.pending_games())
  }

  // Every change to a game is sent to all of its participants
  async function changed(game: Game) {
    await broadcaster.send_game(game)
    return game
  }

  return {
    pending_games: () => server.pending_games(),
    game: (id) => server.game(id),

    async create_game(creator, numberOfPlayers) {
      const game = await server.create_game(creator, numberOfPlayers)
      await broadcast_pending_games()
      return game
    },

    async join_game(id, player) {
      const game = await changed(await server.join_game(id, player))
      await broadcast_pending_games()
      return game
    },

    async play_card(id, player, cardIndex, color) {
      return changed(await server.play_card(id, player, cardIndex, color))
    },

    async draw_card(id, player) {
      return changed(await server.draw_card(id, player))
    },

    async say_uno(id, player) {
      return changed(await server.say_uno(id, player))
    },

    async catch_uno(id, player, accused) {
      const { game, caught } = await server.catch_uno(id, player, accused)
      if (caught) await changed(game)
      return caught
    },
  }
}
