import { Randomizer, Shuffler, standardRandomizer, standardShuffler } from '../../src/utils/random_utils'
import * as deck from '../../src/model/deck'
import * as round from '../../src/model/round'
import * as uno from '../../src/model/uno'

type Card = deck.Card
type Deck = deck.Deck
type Round = round.Round
type Game = uno.Game

export function createInitialDeck(): Deck {
  return deck.createInitialDeck()
}

export function createDeckFromMemento(cards: Record<string, string | number>[]): Deck {
  return deck.deckFromMemento(cards)
}

export type HandConfig = {
  players: string[]
  dealer: number
  shuffler?: Shuffler<Card>
  cardsPerPlayer?: number
}

export function createRound({
    players, 
    dealer, 
    shuffler = standardShuffler,
    cardsPerPlayer = 7
  }: HandConfig): Round {
  return round.startRound({ players, dealer, shuffler, cardsPerPlayer })
}

export function createRoundFromMemento(memento: any, shuffler: Shuffler<Card> = standardShuffler): Round {
  return round.roundFromMemento(memento, shuffler)
}

export type GameConfig = {
  players: string[]
  targetScore: number
  randomizer: Randomizer
  shuffler: Shuffler<Card>
  cardsPerPlayer: number
}

export function createGame(props: Partial<GameConfig>): Game {
  return uno.startGame(props)
}

export function createGameFromMemento(memento: any, randomizer: Randomizer = standardRandomizer, shuffler: Shuffler<Card> = standardShuffler): Game {
  return uno.gameFromMemento(memento, randomizer, shuffler)
}
