<script setup lang="ts">
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import GameTable from '../components/GameTable.vue'
import { useGameStore } from '../stores/GameStore'
const router = useRouter()
const game = useGameStore()
// The round can end after the human's play or a bot's, so follow the store
watch(
  () => game.status,
  (status) => {
    if (status === 'finished') router.replace({ name: 'result' })
  },
)
</script>

<template>
  <GameTable
    v-if="game.snapshot"
    :state="game.snapshot"
    :hand="game.hand"
    :legal="game.legal"
    :human-turn="game.humanTurn"
    :pending-wild="game.pendingWild"
    :uno-armed="game.unoArmed"
    :offender="game.offender"
    :messages="game.messages"
    @play="game.chooseCard"
    @draw="game.humanDraw"
    @uno="game.sayUno"
    @catch="game.catchBot"
    @color="game.chooseColor"
    @cancel-color="game.cancelColor"
  />
</template>
