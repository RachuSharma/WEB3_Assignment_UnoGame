import { ref } from 'vue'
import { defineStore } from 'pinia'

export type OngoingGame = {
  id: string
  // Increases with every change on the server, so older updates can be ignored
  version: number
  pending: boolean
  numberOfPlayers: number
  direction: string | null
  drawPileSize: number
  winner: string | null
  events: string[]
}

// The game this player is in, as the server last described it
export const useOngoingGameStore = defineStore('ongoing game', () => {
  const game = ref<OngoingGame | null>(null)

  const set = (ongoingGame: OngoingGame) => {
    game.value = ongoingGame
  }

  const clear = () => {
    game.value = null
  }

  return { game, set, clear }
})
