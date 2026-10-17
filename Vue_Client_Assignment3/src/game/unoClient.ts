import {
  ApolloClient,
  gql,
  HttpLink,
  InMemoryCache,
  split,
  type DocumentNode,
} from '@apollo/client/core'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { getMainDefinition } from '@apollo/client/utilities'
import { createClient } from 'graphql-ws'
import {
  cardFromMemento,
  type Color,
} from '../../../OOModel_Assignmet1/src/model/card'
import type { GameState, PendingGame } from './types'

type CardDTO = { type: string; color: string | null; number: number | null }
type GameStateDTO = Omit<GameState, 'hand' | 'discardTop'> & {
  hand: CardDTO[]
  discardTop: CardDTO | null
}

const httpLink = new HttpLink({ uri: 'http://localhost:4000/graphql' })
const wsLink = new GraphQLWsLink(
  createClient({ url: 'ws://localhost:4000/graphql' }),
)

// Subscriptions travel over the WebSocket, queries and mutations over HTTP
const link = split(
  ({ query }) => {
    const definition = getMainDefinition(query)
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    )
  },
  wsLink,
  httpLink,
)

// The server sends complete snapshots, so nothing needs to be cached
const apolloClient = new ApolloClient({ link, cache: new InMemoryCache() })

async function query(query: DocumentNode, variables?: object) {
  const result = await apolloClient.query({
    query,
    variables,
    fetchPolicy: 'no-cache',
  })
  return result.data
}

async function mutate(mutation: DocumentNode, variables?: object) {
  const result = await apolloClient.mutate({
    mutation,
    variables,
    fetchPolicy: 'no-cache',
  })
  return result.data
}

const GAME_STATE = gql`
  fragment CardFields on Card {
    type
    color
    number
  }
  fragment GameStateFields on GameState {
    id
    version
    pending
    numberOfPlayers
    players {
      name
      cardCount
    }
    hand {
      ...CardFields
    }
    playable
    discardTop {
      ...CardFields
    }
    currentColor
    direction
    playerInTurn
    drawPileSize
    winner
    events
  }
`

const PENDING_GAME = gql`
  fragment PendingGameFields on PendingGame {
    id
    creator
    numberOfPlayers
    players
  }
`

// GraphQL sends null for fields a card does not have; the model expects them to be absent
function toGameState({ hand, discardTop, ...rest }: GameStateDTO): GameState {
  return {
    ...rest,
    hand: hand.map((card) => cardFromMemento(card)),
    discardTop: discardTop ? cardFromMemento(discardTop) : null,
  }
}

// Queries
export async function pending_games(): Promise<PendingGame[]> {
  const data = await query(gql`
    query PendingGames {
      pending_games {
        ...PendingGameFields
      }
    }
    ${PENDING_GAME}
  `)
  return data.pending_games
}

export async function game(id: string, player: string): Promise<GameState> {
  const data = await query(
    gql`
      query Game($id: ID!, $player: String!) {
        game(id: $id, player: $player) {
          ...GameStateFields
        }
      }
      ${GAME_STATE}
    `,
    { id, player },
  )
  return toGameState(data.game)
}

// Mutations
export async function create_game(
  creator: string,
  numberOfPlayers: number,
): Promise<GameState> {
  const data = await mutate(
    gql`
      mutation CreateGame($creator: String!, $numberOfPlayers: Int!) {
        create_game(creator: $creator, numberOfPlayers: $numberOfPlayers) {
          ...GameStateFields
        }
      }
      ${GAME_STATE}
    `,
    { creator, numberOfPlayers },
  )
  return toGameState(data.create_game)
}

export async function join_game(
  id: string,
  player: string,
): Promise<GameState> {
  const data = await mutate(
    gql`
      mutation JoinGame($id: ID!, $player: String!) {
        join_game(id: $id, player: $player) {
          ...GameStateFields
        }
      }
      ${GAME_STATE}
    `,
    { id, player },
  )
  return toGameState(data.join_game)
}

export async function play_card(
  id: string,
  player: string,
  cardIndex: number,
  color?: Color,
): Promise<GameState> {
  const data = await mutate(
    gql`
      mutation PlayCard(
        $id: ID!
        $player: String!
        $cardIndex: Int!
        $color: Color
      ) {
        play_card(
          id: $id
          player: $player
          cardIndex: $cardIndex
          color: $color
        ) {
          ...GameStateFields
        }
      }
      ${GAME_STATE}
    `,
    { id, player, cardIndex, color },
  )
  return toGameState(data.play_card)
}

export async function draw_card(
  id: string,
  player: string,
): Promise<GameState> {
  const data = await mutate(
    gql`
      mutation DrawCard($id: ID!, $player: String!) {
        draw_card(id: $id, player: $player) {
          ...GameStateFields
        }
      }
      ${GAME_STATE}
    `,
    { id, player },
  )
  return toGameState(data.draw_card)
}

export async function say_uno(id: string, player: string): Promise<GameState> {
  const data = await mutate(
    gql`
      mutation SayUno($id: ID!, $player: String!) {
        say_uno(id: $id, player: $player) {
          ...GameStateFields
        }
      }
      ${GAME_STATE}
    `,
    { id, player },
  )
  return toGameState(data.say_uno)
}

export async function catch_uno(
  id: string,
  player: string,
  accused: string,
): Promise<boolean> {
  const data = await mutate(
    gql`
      mutation CatchUno($id: ID!, $player: String!, $accused: String!) {
        catch_uno(id: $id, player: $player, accused: $accused)
      }
    `,
    { id, player, accused },
  )
  return data.catch_uno
}

// Subscriptions return a function that stops them
export function onPendingGamesUpdated(
  subscriber: (games: PendingGame[]) => void,
): () => void {
  const subscription = apolloClient
    .subscribe({
      query: gql`
        subscription PendingGamesUpdated {
          pending_games_updated {
            ...PendingGameFields
          }
        }
        ${PENDING_GAME}
      `,
      fetchPolicy: 'no-cache',
    })
    .subscribe({
      next({ data }) {
        if (data) subscriber(data.pending_games_updated)
      },
      error(error) {
        console.error('Pending games subscription error:', error)
      },
    })
  return () => subscription.unsubscribe()
}

export function onGameUpdated(
  id: string,
  player: string,
  subscriber: (state: GameState) => void,
  onError: (error: unknown) => void,
): () => void {
  const subscription = apolloClient
    .subscribe({
      query: gql`
        subscription GameUpdated($id: ID!, $player: String!) {
          game_updated(id: $id, player: $player) {
            ...GameStateFields
          }
        }
        ${GAME_STATE}
      `,
      variables: { id, player },
      fetchPolicy: 'no-cache',
    })
    .subscribe({
      next({ data }) {
        if (data) subscriber(toGameState(data.game_updated))
      },
      error: onError,
    })
  return () => subscription.unsubscribe()
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.'
}
