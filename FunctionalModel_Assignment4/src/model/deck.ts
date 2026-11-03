import * as _ from 'lodash'
import type { Shuffler } from '../utils/random_utils'
import { actionCard, actionTypes, cardNumbers, colors, numberedCard, wildCard, wildTypes, type Card } from './card'

export type { ActionCard, Card, CardNumber, Color, ColoredCard, NumberedCard, Type, TypedCard, WildCard } from './card'
export { colors } from './card'

// Used both for the full deck and for the draw pile. Index 0 is the top of the deck
export type Deck = readonly Card[]

// An unshuffled deck of all 108 UNO cards
export function createInitialDeck(): Deck {
  const numbered = _.flatMap(colors, color => [
    numberedCard(color, 0),
    ..._.flatMap(cardNumbers.slice(1), number => _.times(2, () => numberedCard(color, number))),
  ])
  const actions = _.flatMap(actionTypes, type => _.flatMap(colors, color => _.times(2, () => actionCard(type, color))))
  const wilds = _.flatMap(wildTypes, type => _.times(4, () => wildCard(type)))
  return [...numbered, ...actions, ...wilds]
}

export function shuffle(shuffler: Shuffler<Card>, deck: Deck): Deck {
  return shuffler(deck)
}

// The top card and the rest of the deck
export function deal(deck: Deck): [Card | undefined, Deck] {
  return [_.head(deck), _.tail(deck)]
}

// Puts the cards at the bottom of the deck
export function add(cards: readonly Card[], deck: Deck): Deck {
  return [...deck, ...cards]
}
