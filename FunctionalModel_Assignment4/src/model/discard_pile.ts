import * as _ from 'lodash'
import type { Card } from './card'

// Index 0 is the top of the pile
export type DiscardPile = readonly Card[]

export function top(pile: DiscardPile): Card | undefined {
  return _.head(pile)
}

export function place(card: Card, pile: DiscardPile): DiscardPile {
  return [card, ...pile]
}

// The cards under the top card, and the pile with only the top card left
export function takeAllButTop(pile: DiscardPile): [readonly Card[], DiscardPile] {
  return [_.tail(pile), _.take(pile, 1)]
}
