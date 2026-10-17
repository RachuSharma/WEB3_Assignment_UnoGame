import {
  colors,
  isColored,
  isWild,
} from '../../../OOModel_Assignmet1/src/model/card'
import type { BotDecision, BotRequest } from './types'

// Strategy chooses among moves already approved by the model, without copying UNO rules.
export function decide(request: BotRequest, random = Math.random): BotDecision {
  if (request.phase === 'observe') {
    return {
      type: 'observe',
      catch: request.offender !== null && random() < 0.55,
    }
  }
  const index = request.legal[Math.floor(random() * request.legal.length)]
  if (index === undefined) return { type: 'draw' }
  const card = request.hand[index]
  if (!card) return { type: 'draw' }
  const color = isWild(card)
    ? [...colors].sort(
        (a, b) =>
          request.hand.filter((c) => isColored(c) && c.color === b).length -
          request.hand.filter((c) => isColored(c) && c.color === a).length,
      )[0]
    : undefined
  return {
    type: 'play',
    index,
    ...(color ? { color } : {}),
    sayUno: request.hand.length === 2 && random() < 0.8,
  }
}
