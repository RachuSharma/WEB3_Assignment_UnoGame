import * as _ from 'lodash'
import { cardScore, hasColor, type Card, type Color } from './card'

export type PlayerHand = readonly Card[]

export function take(card: Card, hand: PlayerHand): PlayerHand {
  return [...hand, card]
}

export function remove(index: number, hand: PlayerHand): PlayerHand {
  return _.filter(hand, (_card, i) => i !== index)
}

export function containsColor(color: Color, hand: PlayerHand): boolean {
  return _.some(hand, card => hasColor(color, card))
}

export function handScore(hand: PlayerHand): number {
  return _.sumBy(hand, cardScore)
}
