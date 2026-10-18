import type { Card, Color } from '../../../OOModel_Assignmet1/src/model/card'
export type Setup = { name: string; bots: number }
export type BotRequest = {
  id: number
  phase: 'observe' | 'turn'
  hand: readonly Card[]
  legal: number[]
  offender: number | null
}
export type BotDecision =
  | { type: 'observe'; catch: boolean }
  | { type: 'draw' }
  | { type: 'play'; index: number; color?: Color; sayUno: boolean }
export type BotResponse = { id: number; decision: BotDecision }
