<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app-shell">
    <header>
      <RouterLink
        class="brand"
        to="/"
      >
        UNO
      </RouterLink>
    </header>
    <main>
      <RouterView />
    </main>
  </div>
</template>
