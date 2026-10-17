<script setup lang="ts">
import type { GameState } from '../game/types'
defineProps<{ state: GameState; player: string }>()
</script>

<template>
  <section
    class="panel setup"
    aria-labelledby="waiting-title"
  >
    <p class="round-status">WAITING FOR PLAYERS</p>
    <h1 id="waiting-title">
      {{ state.players.length }} of {{ state.numberOfPlayers }} players
    </h1>
    <ol class="player-list">
      <li
        v-for="{ name } in state.players"
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
