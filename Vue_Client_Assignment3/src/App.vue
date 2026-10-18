<script setup lang="ts">
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()
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
        @click="router.push({ name: 'setup' })"
      >
        New game
      </button>
    </header>
    <main>
      <!-- A new game address starts a new game screen and subscription -->
      <RouterView :key="route.fullPath" />
    </main>
  </div>
</template>
