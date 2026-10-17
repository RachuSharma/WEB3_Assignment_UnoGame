<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import GameTable from '../components/GameTable.vue'
import WaitingRoom from '../components/WaitingRoom.vue'
import { useUnoGame } from '../game/useUnoGame'
import { useOngoingGameStore } from '../stores/OngoingGameStore'
const props = defineProps<{ id: string; player: string }>()
const router = useRouter()
const ongoingGame = useOngoingGameStore()
// The subscription to this game belongs to this screen and stops when it is left
const {
  error,
  notice,
  busy,
  pendingWild,
  myTurn,
  canSayUno,
  load,
  chooseCard,
  chooseColor,
  cancelColor,
  draw,
  sayUno,
  catchPlayer,
} = useUnoGame(props.id, props.player)
onMounted(load)
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
  <p
    v-if="notice"
    class="notice"
    role="status"
  >
    {{ notice }}
  </p>
  <template v-if="ongoingGame.game?.id === id">
    <WaitingRoom
      v-if="ongoingGame.game.pending"
      :player="player"
    />
    <GameTable
      v-else
      :player="player"
      :my-turn="myTurn"
      :can-say-uno="canSayUno"
      :busy="busy"
      :pending-wild="pendingWild"
      @play="chooseCard"
      @draw="draw"
      @uno="sayUno"
      @catch="catchPlayer"
      @color="chooseColor"
      @cancel-color="cancelColor"
      @restart="router.push({ name: 'setup' })"
    />
  </template>
  <p
    v-else-if="!error"
    class="muted"
  >
    Loading the game...
  </p>
</template>
