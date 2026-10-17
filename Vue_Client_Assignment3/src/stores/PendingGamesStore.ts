import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { PendingGame } from '../model/uno-client'

export const usePendingGamesStore = defineStore('pending games', () => {
  const games = ref<PendingGame[]>([])

  function update(pendingGames: PendingGame[]) {
    games.value = pendingGames
  }

  return { games, update }
})
