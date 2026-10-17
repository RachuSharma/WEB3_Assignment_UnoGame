<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/GameStore'
const router = useRouter()
const game = useGameStore()
const name = ref('')
const bots = ref(1)
const valid = computed(
  () => name.value.trim().length > 0 && name.value.trim().length <= 30,
)
// Returning to setup, also with the browser's back button, ends a running round
onMounted(game.reset)
function submit() {
  if (!valid.value) return
  game.start({ name: name.value.trim(), bots: bots.value })
  if (game.status === 'playing') router.push({ name: 'game' })
}
</script>

<template>
  <section
    class="panel setup"
    aria-labelledby="setup-title"
  >
    <h1 id="setup-title">Let's play UNO</h1>
    <p>Play one round of UNO against up to three bots.</p>
    <form @submit.prevent="submit">
      <label for="player-name">Your name</label>
      <input
        id="player-name"
        v-model="name"
        maxlength="30"
        required
        autocomplete="nickname"
        placeholder="Enter your name"
      />
      <label for="bot-count">Opponents</label>
      <select
        id="bot-count"
        v-model.number="bots"
      >
        <option :value="1">1 bot &middot; 2 players</option>
        <option :value="2">2 bots &middot; 3 players</option>
        <option :value="3">3 bots &middot; 4 players</option>
      </select>
      <button
        class="primary"
        :disabled="!valid"
        type="submit"
      >
        Deal the cards &rarr;
      </button>
    </form>
    <p class="muted">
      Seven cards each. One winner. Say UNO before playing down to one card.
    </p>
  </section>
</template>
