import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Card, Color } from '../../../OOModel_Assignmet1/src/model/card'

export const useDiscardPileStore = defineStore('discard pile', () => {
  const topCard = ref<Card | null>(null)
  // A wild card's chosen colour, otherwise the colour of the top card
  const currentColor = ref<Color | null>(null)

  const set = (top: Card | null, color: Color | null) => {
    topCard.value = top
    currentColor.value = color
  }

  const clear = () => set(null, null)

  return { topCard, currentColor, set, clear }
})
