<script setup lang="ts">
import { useOngoingGameStore } from '../stores/OngoingGameStore'
import { usePlayerHandsStore } from '../stores/PlayerHandsStore'

const ongoingGame = useOngoingGameStore()
const playerHands = usePlayerHandsStore()

const emit = defineEmits<{ restart: [] }>()
</script>

<template>
  <section
    class="panel results"
    aria-labelledby="result-title"
  >
    <p class="round-status">ROUND COMPLETE</p>

    <h1 id="result-title">{{ ongoingGame.winner }} wins!</h1>

    <p class="score">
      {{ ongoingGame.score }}
      <span>points</span>
    </p>

    <p>Points come from the cards remaining in everyone else's hands.</p>

    <table>
      <caption>Final hands</caption>

      <thead>
        <tr>
          <th scope="col">Player</th>
          <th scope="col">Cards left</th>
          <th scope="col">Hand value</th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="(hand, playerIndex) in playerHands.playerHands"
          :key="playerIndex"
        >
          <th scope="row">{{ hand.name }}</th>
          <td>{{ hand.cardCount }}</td>
          <td>{{ hand.handValue }}</td>
        </tr>
      </tbody>
    </table>

    <button
      class="primary"
      @click="emit('restart')"
    >
      Set up another round &rarr;
    </button>
  </section>
</template>
