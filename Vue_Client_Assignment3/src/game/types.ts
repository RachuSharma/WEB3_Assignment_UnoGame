import type { Card, Color } from '../../../OOModel_Assignmet1/src/model/card'

export type PendingGame = {
  id: string
  creator: string
  numberOfPlayers: number
  players: string[]
}

// The game as the server describes it to one player
export type GameState = {
  id: string
  version: number
  pending: boolean
  numberOfPlayers: number
  players: { name: string; cardCount: number }[]
  hand: Card[]
  playable: number[]
  discardTop: Card | null
  currentColor: Color | null
  direction: string | null
  playerInTurn: string | null
  drawPileSize: number
  winner: string | null
  events: string[]
}
