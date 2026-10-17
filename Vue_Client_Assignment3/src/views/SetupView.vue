<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/GameStore'
const router = useRouter()
const game = useGameStore()
const name = ref('')
const players = ref(2)
const playerName = computed(() => name.value.trim())
const valid = computed(
  () => playerName.value.length > 0 && playerName.value.length <= 30,
)
// Returning to setup leaves the current game and shows the games waiting for players
onMounted(() => {
  game.reset()
  game.watchLobby()
})
onUnmounted(game.unwatchLobby)
async function create() {
  if (!valid.value) return
  await game.create({ name: playerName.value, players: players.value })
  if (game.status !== 'setup') router.push({ name: 'game' })
}
async function join(id: string) {
  if (!valid.value) return
  await game.join(id, playerName.value)
  if (game.status !== 'setup') router.push({ name: 'game' })
}
</script>

<template>
  <section
    class="panel setup"
    aria-labelledby="setup-title"
  >
    <h1 id="setup-title">Let's play UNO</h1>
    <p>Play one round of UNO against 1-3 other players.</p>
    <form @submit.prevent="create">
      <label for="player-name">Your name</label>
      <input
        id="player-name"
        v-model="name"
        maxlength="30"
        required
        autocomplete="nickname"
        placeholder="Enter your name"
      />
      <label for="player-count">New game</label>
      <select
        id="player-count"
        v-model.number="players"
      >
        <option :value="2">2 players &middot; 1 opponent</option>
        <option :value="3">3 players &middot; 2 opponents</option>
        <option :value="4">4 players &middot; 3 opponents</option>
      </select>
      <button
        class="primary"
        :disabled="!valid || game.busy"
        type="submit"
      >
        Create game &rarr;
      </button>
    </form>
    <h2 id="open-games">Join a game</h2>
    <ul
      v-if="game.pendingGames.length"
      class="game-list"
      aria-labelledby="open-games"
    >
      <li
        v-for="pending in game.pendingGames"
        :key="pending.id"
      >
        <div>
          <strong>{{ pending.creator }}'s game</strong>
          <p class="muted">
            {{ pending.players.length }} of
            {{ pending.numberOfPlayers }} players &middot;
            {{ pending.players.join(', ') }}
          </p>
        </div>
        <button
          :disabled="
            !valid || game.busy || pending.players.includes(playerName)
          "
          @click="join(pending.id)"
        >
          Join
        </button>
      </li>
    </ul>
    <p
      v-else
      class="muted"
    >
      No games are waiting for players. Create one above.
    </p>
  </section>
</template>
