import { shallowRef } from 'vue'
import { defineStore } from 'pinia'
import type { GameState } from '../model/uno-client'

// The game as the server last described it to this player
export const useGameStore = defineStore('game', () => {
  const state = shallowRef<GameState | null>(null)

  // Notifications and mutation results may arrive out of order, so keep the newest
  function update(next: GameState) {
    const current = state.value
    if (current && current.id === next.id && current.version > next.version)
      return
    state.value = next
  }

  function clear() {
    state.value = null
  }

  return { state, update, clear }
})
