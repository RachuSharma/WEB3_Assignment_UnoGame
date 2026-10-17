import { ref } from 'vue'
import { defineStore } from 'pinia'

// The name the user identifies themselves with in the lobby
export const usePlayerStore = defineStore('player', () => {
  const name = ref('')
  return { name }
})
