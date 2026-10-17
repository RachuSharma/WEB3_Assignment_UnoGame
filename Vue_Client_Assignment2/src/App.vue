<script setup lang="ts">
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useGameStore } from './stores/GameStore'
const game = useGameStore()
const route = useRoute()
const router = useRouter()
function newRound() {
  game.reset()
  router.push({ name: 'setup' })
}
</script>

<template>
  <div class="app-shell">
    <header>
      <RouterLink
        class="brand"
        :to="{ name: 'setup' }"
      >
        UNO
      </RouterLink>
      <button
        v-if="route.name !== 'setup'"
        @click="newRound"
      >
        New round
      </button>
    </header>
    <main>
      <div
        v-if="game.error"
        class="error"
        role="alert"
      >
        {{ game.error }}
        <button @click="newRound">Return to setup</button>
      </div>
      <RouterView />
    </main>
  </div>
</template>
