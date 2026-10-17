import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Card } from '../../../OOModel_Assignmet1/src/model/card'

// This player's hand and the cards the server allows them to play now
export const useCardsStore = defineStore('cards', () => {
  const cards = ref<Card[]>([])
  const playable = ref<number[]>([])

  const set = (hand: Card[], playableIndices: number[]) => {
    cards.value = hand
    playable.value = playableIndices
  }

  const clear = () => set([], [])

  return { cards, playable, set, clear }
})
