import { ref } from 'vue'
import { defineStore } from 'pinia'

// Index 0 is the human; the others are the bots
export type PlayerHand = { name: string; cardCount: number; handValue: number }

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
