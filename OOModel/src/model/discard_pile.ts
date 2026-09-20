import { Card, CardMemento } from './card'

export interface DiscardPile {
  readonly size: number
  top(): Card | undefined
  place(card: Card): void
  takeAllButTop(): Card[]
  toMemento(): CardMemento[]
}

export class StandardDiscardPile implements DiscardPile {
  // Index 0 is the top of the pile
  private readonly cards: Card[]

  constructor(cards: readonly Card[] = []) {
    this.cards = [...cards]
  }

  get size(): number {
    return this.cards.length
  }

  top(): Card | undefined {
    return this.cards[0]
  }

  place(card: Card): void {
    this.cards.unshift(card)
  }

  takeAllButTop(): Card[] {
    return this.cards.splice(1)
  }

  toMemento(): CardMemento[] {
    return this.cards.map(card => ({ ...card }))
  }
}
