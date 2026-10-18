import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Direction } from '../../../OOModel_Assignmet1/src/model/round'
import type { Setup } from '../game/types'

// The chosen setup, the state of the table and the result of the round being played
export const useOngoingGameStore = defineStore('ongoing game', () => {
  const setup = ref<Setup | null>(null)
  const direction = ref<Direction>('clockwise')
  const drawPileSize = ref(0)
  const messages = ref<string[]>([])
  const winner = ref<string | null>(null)
  const score = ref(0)

  const start = (newSetup: Setup) => {
    clear()
    setup.value = newSetup
  }

  const set = (table: { direction: Direction; drawPileSize: number }) => {
    direction.value = table.direction
    drawPileSize.value = table.drawPileSize
  }

  const log = (message: string) => {
    messages.value = [message, ...messages.value].slice(0, 12)
  }

  const finish = (winnerName: string, points: number) => {
    winner.value = winnerName
    score.value = points
  }

  const clear = () => {
    setup.value = null
    direction.value = 'clockwise'
    drawPileSize.value = 0
    messages.value = []
    winner.value = null
    score.value = 0
  }

  return {
    setup,
    direction,
    drawPileSize,
    messages,
    winner,
    score,
    start,
    set,
    log,
    finish,
    clear,
  }
})
