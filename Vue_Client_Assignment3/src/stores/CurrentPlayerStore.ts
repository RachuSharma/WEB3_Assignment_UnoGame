import { ref } from 'vue'
import { defineStore } from 'pinia'

// The name of the player in turn, or null before the round starts and after it ends
export const useCurrentPlayerStore = defineStore('current player', () => {
  const currentPlayer = ref<string | null>(null)

  const set = (player: string | null) => {
    currentPlayer.value = player
  }

  const clear = () => {
    currentPlayer.value = null
  }

  return { currentPlayer, set, clear }
})
