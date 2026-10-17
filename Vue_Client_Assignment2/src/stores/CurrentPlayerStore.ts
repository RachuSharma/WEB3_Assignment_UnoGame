import { ref } from 'vue'
import { defineStore } from 'pinia'

// The index of the player in turn, or null when the round has ended
export const useCurrentPlayerStore = defineStore('current player', () => {
  const currentPlayer = ref<number | null>(null)

  const set = (player: number | null) => {
    currentPlayer.value = player
  }

  const clear = () => {
    currentPlayer.value = null
  }

  return { currentPlayer, set, clear }
})
