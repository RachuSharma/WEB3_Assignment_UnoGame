import { Shuffler, standardShuffler } from '../../src/utils/random_utils'
import * as deck from '../../src/model/deck'
import * as round from '../../src/model/round'

// createGame is left out: a full game of UNO is a could-have requirement that is not implemented

export function createInitialDeck(): deck.Deck {
  return deck.createInitialDeck()
}

export type RoundProps = {
  players: string[]
  dealer: number
  shuffler?: Shuffler<deck.Card>
  cardsPerPlayer?: number
}

export function createRound({
    players,
    dealer,
    shuffler = standardShuffler,
    cardsPerPlayer = 7
  }: RoundProps): round.Round {
  return round.createRound(players, dealer, shuffler, cardsPerPlayer)
}
