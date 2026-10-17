import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Card } from '../../../OOModel_Assignmet1/src/model/card'

// The human player's hand
export const useCardsStore = defineStore('cards', () => {
  const cards = ref<Card[]>([])

  const set = (hand: Card[]) => {
    cards.value = hand
  }

  const clear = () => {
    cards.value = []
  }

  return { cards, set, clear }
})
