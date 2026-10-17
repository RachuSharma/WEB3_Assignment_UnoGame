import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { PendingGame } from '../game/types'

// Games waiting for players, shown on the setup screen
export const usePendingGamesStore = defineStore('pending games', () => {
  const games = ref<PendingGame[]>([])

  const update = (pendingGames: PendingGame[]) => {
    games.value = pendingGames
  }

  return { games, update }
})
