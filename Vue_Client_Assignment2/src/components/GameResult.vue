<script setup lang="ts">
import type { RoundMemento } from '../../../OOModel_Assignmet1/src/model/round'
import { cardScore } from '../../../OOModel_Assignmet1/src/model/card'

defineProps<{ winner: string; score: number; state: RoundMemento }>()

const emit = defineEmits<{ restart: [] }>()
</script>

<template>
  <section
    class="panel results"
    aria-labelledby="result-title"
  >
    <p class="round-status">ROUND COMPLETE</p>

    <h1 id="result-title">{{ winner }} wins!</h1>

    <p class="score">
      {{ score }}
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
          v-for="(playerName, playerIndex) in state.players"
          :key="playerIndex"
        >
          <th scope="row">{{ playerName }}</th>
          <td>{{ state.hands[playerIndex]?.length }}</td>
          <td>
            {{
              state.hands[playerIndex]?.reduce(
                (sum, card) => sum + cardScore(card),
                0,
              )
            }}
          </td>
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
