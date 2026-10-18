<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import GameTable from '../components/GameTable.vue'
import { useUnoGame } from '../game/useUnoGame'
import { useOngoingGameStore } from '../stores/OngoingGameStore'
const router = useRouter()
const ongoingGame = useOngoingGameStore()
// The round and its bot workers belong to this screen and stop when it is left
const {
  error,
  pendingWild,
  unoArmed,
  offender,
  humanTurn,
  legal,
  start,
  chooseCard,
  chooseColor,
  cancelColor,
  humanDraw,
  sayUno,
  catchBot,
} = useUnoGame()
onMounted(() => {
  if (ongoingGame.setup) start(ongoingGame.setup)
})
// The round can end after the human's play or a bot's
watch(
  () => ongoingGame.winner,
  (winner) => {
    if (winner !== null) router.replace({ name: 'result' })
  },
)
</script>

<template>
  <div
    v-if="error"
    class="error"
    role="alert"
  >
    {{ error }}
    <button @click="router.push({ name: 'setup' })">Return to setup</button>
  </div>
  <GameTable
    :legal="legal"
    :human-turn="humanTurn"
    :pending-wild="pendingWild"
    :uno-armed="unoArmed"
    :offender="offender"
    @play="chooseCard"
    @draw="humanDraw"
    @uno="sayUno"
    @catch="catchBot"
    @color="chooseColor"
    @cancel-color="cancelColor"
  />
</template>
