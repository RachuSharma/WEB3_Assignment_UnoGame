import { Card, CardMemento, cardScore, Color, hasColor } from './card'

export interface PlayerHand {
  readonly cards: ReadonlyArray<Card>
  readonly size: number
  readonly isEmpty: boolean
  cardAt(index: number): Card | undefined
  take(card: Card): void
  remove(index: number): Card
  containsColor(color: Color): boolean
  score(): number
  toMemento(): CardMemento[]
}

export class StandardPlayerHand implements PlayerHand {
  private readonly _cards: Card[]

  constructor(cards: readonly Card[] = []) {
    this._cards = [...cards]
  }

  get cards(): ReadonlyArray<Card> {
    return this._cards
  }

  get size(): number {
    return this._cards.length
  }

  get isEmpty(): boolean {
    return this._cards.length === 0
  }

  cardAt(index: number): Card | undefined {
    return this._cards[index]
  }

  take(card: Card): void {
    this._cards.push(card)
  }

  remove(index: number): Card {
    const card = this.cardAt(index)
    if (card === undefined) throw new Error(`No card at index ${index}`)
    this._cards.splice(index, 1)
    return card
  }

  containsColor(color: Color): boolean {
    return this._cards.some(card => hasColor(card, color))
  }

  score(): number {
    return this._cards.reduce((sum, card) => sum + cardScore(card), 0)
  }

  toMemento(): CardMemento[] {
    return this._cards.map(card => ({ ...card }))
  }
}
