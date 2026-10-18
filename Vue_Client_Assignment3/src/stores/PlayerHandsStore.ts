import { ref } from 'vue'
import { defineStore } from 'pinia'

// Everyone sees each player's card count, but only their own cards
export type PlayerHand = { name: string; cardCount: number }

export const usePlayerHandsStore = defineStore('player hands', () => {
  const playerHands = ref<PlayerHand[]>([])

  const update = (hands: PlayerHand[]) => {
    playerHands.value = hands
  }

  const clear = () => {
    playerHands.value = []
  }

  return { playerHands, update, clear }
})
