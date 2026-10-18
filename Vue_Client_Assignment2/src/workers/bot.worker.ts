import { decide } from '../game/botStrategy'
import type { BotRequest, BotResponse } from '../game/types'

// No model instance, DOM, or shared reactive state crosses this boundary.
const worker = self as unknown as {
  onmessage: ((event: MessageEvent<BotRequest>) => void) | null
  postMessage: (response: BotResponse) => void
}
worker.onmessage = ({ data }) => {
  worker.postMessage({ id: data.id, decision: decide(data) })
}
