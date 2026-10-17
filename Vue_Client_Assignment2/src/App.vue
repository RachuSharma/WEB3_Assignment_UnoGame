<script setup lang="ts">
import GameSetup from './components/GameSetup.vue'
import GameTable from './components/GameTable.vue'
import GameResult from './components/GameResult.vue'
import { useUnoGame } from './game/useUnoGame'
const {
  snapshot,
  screen,
  error,
  messages,
  pendingWild,
  unoArmed,
  offender,
  winner,
  score,
  hand,
  humanTurn,
  legal,
  start,
  chooseCard,
  chooseColor,
  humanDraw,
  sayUno,
  catchBot,
  reset,
} = useUnoGame()
</script>

<template>
  <div class="app-shell">
    <header>
      <a
        class="brand"
        href="#"
        @click.prevent="reset"
      >
        UNO
      </a>
      <button
        v-if="screen !== 'setup'"
        @click="reset"
      >
        New round
      </button>
    </header>
    <main>
      <div
        v-if="error"
        class="error"
        role="alert"
      >
        {{ error }}
        <button @click="reset">Return to setup</button>
      </div>
      <GameSetup
        v-if="screen === 'setup'"
        @start="start"
      />
      <GameTable
        v-else-if="screen === 'playing' && snapshot"
        :state="snapshot"
        :hand="hand"
        :legal="legal"
        :human-turn="humanTurn"
        :pending-wild="pendingWild"
        :uno-armed="unoArmed"
        :offender="offender"
        :messages="messages"
        @play="chooseCard"
        @draw="humanDraw"
        @uno="sayUno"
        @catch="catchBot"
        @color="chooseColor"
        @cancel-color="pendingWild = null"
      />
      <GameResult
        v-else-if="screen === 'finished' && snapshot"
        :winner="winner"
        :score="score"
        :state="snapshot"
        @restart="reset"
      />
    </main>
  </div>
</template>
