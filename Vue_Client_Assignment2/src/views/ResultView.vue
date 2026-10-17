<script setup lang="ts">
import { useRouter } from 'vue-router'
import GameResult from '../components/GameResult.vue'
import { useGameStore } from '../stores/GameStore'
const router = useRouter()
const game = useGameStore()
</script>

<template>
  <GameResult
    v-if="game.snapshot"
    :winner="game.winner"
    :score="game.score"
    :state="game.snapshot"
    @restart="router.push({ name: 'setup' })"
  />
</template>
