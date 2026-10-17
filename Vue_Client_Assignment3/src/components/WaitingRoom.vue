<script setup lang="ts">
import { useOngoingGameStore } from '../stores/OngoingGameStore'
import { usePlayerHandsStore } from '../stores/PlayerHandsStore'
defineProps<{ player: string }>()
const ongoingGame = useOngoingGameStore()
const playerHands = usePlayerHandsStore()
</script>

<template>
  <section
    class="panel setup"
    aria-labelledby="waiting-title"
  >
    <p class="round-status">WAITING FOR PLAYERS</p>
    <h1 id="waiting-title">
      {{ playerHands.playerHands.length }} of
      {{ ongoingGame.game?.numberOfPlayers }} players
    </h1>
    <ol class="player-list">
      <li
        v-for="{ name } in playerHands.playerHands"
        :key="name"
      >
        {{ name }}
        <span
          v-if="name === player"
          class="muted"
        >
          (you)
        </span>
      </li>
    </ol>
    <p class="muted">
      Others can join this game from the setup screen. The round starts as soon
      as everyone has joined.
    </p>
  </section>
</template>
