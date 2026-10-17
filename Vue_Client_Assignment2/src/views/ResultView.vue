<script setup lang="ts">
import { useRouter } from 'vue-router'
import GameResult from '../components/GameResult.vue'
const router = useRouter()
</script>

<template>
  <GameResult @restart="router.push({ name: 'setup' })" />
</template>
