import { GraphQLError } from 'graphql'
import type { PubSub } from 'graphql-subscriptions'
import type { Color } from '../../OOModel_Assignmet1/src/model/card'
import type { API } from './api'
import { player_view, type Game, type PendingGame } from './servermodel'

export const PENDING_GAMES = 'PENDING_GAMES'
export const game_topic = (id: string) => `GAME_${id}`

type GameArgs = { id: string; player: string }

// Rule violations and unknown games reach the client as readable GraphQL errors
async function respond<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action()
  } catch (error) {
    throw new GraphQLError(
      error instanceof Error ? error.message : String(error),
      { extensions: { code: 'BAD_REQUEST' } },
    )
  }
}

export const create_resolvers = (pubsub: PubSub, api: API) => ({
  Query: {
    pending_games: () => respond(() => api.pending_games()),
    game: (_: unknown, { id, player }: GameArgs) =>
      respond(async () => player_view(await api.game(id), player)),
  },

  Mutation: {
    create_game: (
      _: unknown,
      { creator, numberOfPlayers }: { creator: string; numberOfPlayers: number },
    ) =>
      respond(async () =>
        player_view(await api.create_game(creator, numberOfPlayers), creator),
      ),
    join_game: (_: unknown, { id, player }: GameArgs) =>
      respond(async () => player_view(await api.join_game(id, player), player)),
    play_card: (
      _: unknown,
      {
        id,
        player,
        cardIndex,
        color,
      }: GameArgs & { cardIndex: number; color?: Color | null },
    ) =>
      respond(async () =>
        player_view(
          await api.play_card(id, player, cardIndex, color ?? undefined),
          player,
        ),
      ),
    draw_card: (_: unknown, { id, player }: GameArgs) =>
      respond(async () => player_view(await api.draw_card(id, player), player)),
    say_uno: (_: unknown, { id, player }: GameArgs) =>
      respond(async () => player_view(await api.say_uno(id, player), player)),
    catch_uno: (
      _: unknown,
      { id, player, accused }: GameArgs & { accused: string },
    ) => respond(() => api.catch_uno(id, player, accused)),
  },

  Subscription: {
    pending_games_updated: {
      subscribe: () => pubsub.asyncIterableIterator(PENDING_GAMES),
      resolve: (payload: { games: PendingGame[] }) => payload.games,
    },
    game_updated: {
      // Only participants can follow a game, and each one only sees their own hand
      subscribe: (_: unknown, { id, player }: GameArgs) =>
        respond(async () => {
          player_view(await api.game(id), player)
          return pubsub.asyncIterableIterator(game_topic(id))
        }),
      resolve: (payload: { game: Game }, { player }: GameArgs) =>
        player_view(payload.game, player),
    },
  },
})
