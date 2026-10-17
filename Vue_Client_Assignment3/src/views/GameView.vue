<script setup lang="ts">
import { useRouter } from 'vue-router'
import GameTable from '../components/GameTable.vue'
import WaitingRoom from '../components/WaitingRoom.vue'
import { useGameStore } from '../stores/GameStore'
const router = useRouter()
const game = useGameStore()
</script>

<template>
  <WaitingRoom
    v-if="game.state?.pending"
    :state="game.state"
    :player="game.player"
  />
  <GameTable
    v-else-if="game.state"
    :state="game.state"
    :player="game.player"
    :hand="game.hand"
    :legal="game.legal"
    :my-turn="game.myTurn"
    :can-say-uno="game.canSayUno"
    :busy="game.busy"
    :pending-wild="game.pendingWild"
    @play="game.chooseCard"
    @draw="game.draw"
    @uno="game.sayUno"
    @catch="game.catchPlayer"
    @color="game.chooseColor"
    @cancel-color="game.cancelColor"
    @restart="router.push({ name: 'setup' })"
  />
</template>
