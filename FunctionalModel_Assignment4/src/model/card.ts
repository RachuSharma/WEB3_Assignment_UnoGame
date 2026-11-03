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
  'NUMBERED': { color: Color, number: CardNumber }
  'SKIP': { color: Color }
  'REVERSE': { color: Color }
  'DRAW': { color: Color }
  'WILD': {}
  'WILD DRAW': {}
}

// Cards are immutable values. Distributes over unions: TypedCard<'SKIP' | 'WILD'> is a skip card or a wild card
export type TypedCard<T extends Type> = { [K in T]: Readonly<{ type: K } & CardProperties[K]> }[T]

export type Card = TypedCard<Type>
export type NumberedCard = TypedCard<'NUMBERED'>
export type ActionCard = TypedCard<ActionType>
export type ColoredCard = TypedCard<ColoredType>
export type WildCard = TypedCard<WildType>

export const numberedCard = (color: Color, number: CardNumber): NumberedCard => ({ type: 'NUMBERED', color, number })

export const actionCard = (type: ActionType, color: Color): ActionCard => ({ type, color })

export const wildCard = (type: WildType): WildCard => ({ type })

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

export function hasColor(color: Color, card: Card): boolean {
  return isColored(card) && card.color === color
}

export function hasNumber(number: number, card: Card): boolean {
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
