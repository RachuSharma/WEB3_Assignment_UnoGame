export const colors = ['BLUE', 'GREEN', 'RED', 'YELLOW'] as const
export type Color = (typeof colors)[number]

export const cardNumbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const
export type CardNumber = (typeof cardNumbers)[number]

// Blank cards are left out since they have no gameplay
export const types = ['NUMBERED', 'SKIP', 'REVERSE', 'DRAW', 'WILD', 'WILD DRAW'] as const
export type Type = (typeof types)[number]

export const actionTypes = ['SKIP', 'REVERSE', 'DRAW'] as const
export type ActionType = (typeof actionTypes)[number]

export const wildTypes = ['WILD', 'WILD DRAW'] as const
export type WildType = (typeof wildTypes)[number]

export type ColoredType = Exclude<Type, WildType>

type CardProperties = {
  'NUMBERED': { readonly color: Color, readonly number: CardNumber }
  'SKIP': { readonly color: Color }
  'REVERSE': { readonly color: Color }
  'DRAW': { readonly color: Color }
  'WILD': {}
  'WILD DRAW': {}
}

// Distributes over unions: TypedCard<'SKIP' | 'WILD'> is a skip card or a wild card
export type TypedCard<T extends Type> = { [K in T]: { readonly type: K } & CardProperties[K] }[T]

export type Card = TypedCard<Type>
export type NumberedCard = TypedCard<'NUMBERED'>
export type ActionCard = TypedCard<ActionType>
export type ColoredCard = TypedCard<ColoredType>
export type WildCard = TypedCard<WildType>

// Cards are plain immutable data, so a card is its own memento
export type CardMemento = Card

export function isColor(value: unknown): value is Color {
  return colors.includes(value as Color)
}

export function isWild(card: Card): card is WildCard {
  return card.type === 'WILD' || card.type === 'WILD DRAW'
}

export function isColored(card: Card): card is ColoredCard {
  return !isWild(card)
}

export function isNumbered(card: Card): card is NumberedCard {
  return card.type === 'NUMBERED'
}

export function hasColor(card: Card, color: Color): boolean {
  return isColored(card) && card.color === color
}

export function hasNumber(card: Card, number: number): boolean {
  return isNumbered(card) && card.number === number
}

export function cardScore(card: Card): number {
  switch (card.type) {
    case 'NUMBERED':
      return card.number
    case 'SKIP': case 'REVERSE': case 'DRAW':
      return 20
    case 'WILD': case 'WILD DRAW':
      return 50
  }
}

function colorFromMemento(color: unknown): Color {
  if (!isColor(color)) throw new Error(`Invalid card color: ${String(color)}`)
  return color
}

function numberFromMemento(number: unknown): CardNumber {
  if (!cardNumbers.includes(number as CardNumber)) throw new Error(`Invalid card number: ${String(number)}`)
  return number as CardNumber
}

export function cardFromMemento(memento: Readonly<Record<string, unknown>>): Card {
  switch (memento.type) {
    case 'NUMBERED':
      return { type: 'NUMBERED', color: colorFromMemento(memento.color), number: numberFromMemento(memento.number) }
    case 'SKIP':
      return { type: 'SKIP', color: colorFromMemento(memento.color) }
    case 'REVERSE':
      return { type: 'REVERSE', color: colorFromMemento(memento.color) }
    case 'DRAW':
      return { type: 'DRAW', color: colorFromMemento(memento.color) }
    case 'WILD':
      return { type: 'WILD' }
    case 'WILD DRAW':
      return { type: 'WILD DRAW' }
    default:
      throw new Error(`Invalid card type: ${String(memento.type)}`)
  }
}
