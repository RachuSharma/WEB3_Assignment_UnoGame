import { Shuffler } from '../utils/random_utils'
import { actionTypes, Card, cardFromMemento, CardMemento, cardNumbers, colors, wildTypes } from './card'

export type { ActionCard, Card, CardMemento, CardNumber, Color, ColoredCard, NumberedCard, Type, TypedCard, WildCard } from './card'
export { colors, hasColor, hasNumber } from './card'

// Used both for the full deck and for the draw pile
export interface Deck {
  readonly size: number
  shuffle(shuffler: Shuffler<Card>): void
  deal(): Card | undefined
  peek(): Card | undefined
  // Puts the cards at the bottom of the deck
  add(cards: readonly Card[]): void
  filter(predicate: (card: Card) => boolean): Deck
  toMemento(): CardMemento[]
}

export class StandardDeck implements Deck {
  // Index 0 is the top of the deck
  private readonly cards: Card[]

  constructor(cards: readonly Card[] = []) {
    this.cards = [...cards]
  }

  get size(): number {
    return this.cards.length
  }

  shuffle(shuffler: Shuffler<Card>): void {
    shuffler(this.cards)
  }

  deal(): Card | undefined {
    return this.cards.shift()
  }

  peek(): Card | undefined {
    return this.cards[0]
  }

  add(cards: readonly Card[]): void {
    this.cards.push(...cards)
  }

  filter(predicate: (card: Card) => boolean): Deck {
    return new StandardDeck(this.cards.filter(predicate))
  }

  toMemento(): CardMemento[] {
    return this.cards.map(card => ({ ...card }))
  }
}

// An unshuffled deck of all 108 UNO cards
export function createInitialDeck(): Deck {
  const cards: Card[] = []
  for (const color of colors) {
    cards.push({ type: 'NUMBERED', color, number: 0 })
    for (const number of cardNumbers.slice(1)) {
      cards.push({ type: 'NUMBERED', color, number }, { type: 'NUMBERED', color, number })
    }
  }
  for (const type of actionTypes) {
    for (const color of colors) {
      cards.push({ type, color }, { type, color })
    }
  }
  for (const type of wildTypes) {
    cards.push({ type }, { type }, { type }, { type })
  }
  return new StandardDeck(cards)
}

export function deckFromMemento(memento: readonly Readonly<Record<string, unknown>>[]): Deck {
  return new StandardDeck(memento.map(card => cardFromMemento(card)))
}
