import { Shuffler } from '../utils/random_utils'

// Helper types
export const colors = ['RED', 'YELLOW', 'GREEN', 'BLUE'] as const

export type Color = typeof colors[number]

export type Number =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9

// 1. Card
export type Card =
  | {
      type: 'NUMBERED'
      color: Color
      number: Number
    }
  | {
      type: 'SKIP'
      color: Color
    }
  | {
      type: 'REVERSE'
      color: Color
    }
  | {
      type: 'DRAW'
      color: Color
    }
  | {
      type: 'WILD'
    }
  | {
      type: 'WILD DRAW'
    }

// 2. Numbered, coloured, and wild cards
export type NumberedCard =
  Extract<Card, { type: 'NUMBERED' }>

export type ColouredCard =
  Extract<Card, { color: Color }>

export type WildCard =
  Extract<Card, { type: 'WILD' | 'WILD DRAW' }>

// 3. Type
export type Type = Card['type']

// 4. TypedCard<Type>
export type TypedCard<T extends Type> = Extract<Card, { type: T }>

// 5. Deck
export interface Deck {
  readonly size: number
  cards(): readonly Card[]
  deal(): Card | undefined
  shuffle(shuffler: Shuffler<Card>): void
  filter(predicate: (card: Card) => boolean): Deck
  top(): Card | undefined
  add(card: Card): void
}

export const createDeck = (initialCards: Card[]): Deck => {
  const cards = [...initialCards]

  return {
    get size() {
      return cards.length
    },

    cards: () => cards,

    deal: () => cards.shift(),

    top: () => cards[0],

    add: card => {
      cards.unshift(card)
    },

    shuffle: shuffler => {
      shuffler(cards)
    },

    filter: predicate => {
      return createDeck(cards.filter(predicate))
    }
  }
}

// Create a full UNO deck
export const createInitialDeck = (): Deck => {
  const cards: Card[] = []

  const numbers = [
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9
  ] as const

  for (const color of colors) {
    cards.push({
      type: 'NUMBERED',
      color,
      number: 0
    })

    for (const number of numbers) {
      cards.push({
        type: 'NUMBERED',
        color,
        number
      })

      cards.push({
        type: 'NUMBERED',
        color,
        number
      })
    }

    for (let i = 0; i < 2; i++) {
      cards.push({
        type: 'SKIP',
        color
      })

      cards.push({
        type: 'REVERSE',
        color
      })

      cards.push({
        type: 'DRAW',
        color
      })
    }
  }

  for (let i = 0; i < 4; i++) {
    cards.push({
      type: 'WILD'
    })

    cards.push({
      type: 'WILD DRAW'
    })
  }

  return createDeck(cards)
}