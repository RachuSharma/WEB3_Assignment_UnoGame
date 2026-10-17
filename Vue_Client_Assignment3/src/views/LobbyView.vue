<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import * as api from '../model/uno-client'
import { useGameStore } from '../stores/GameStore'
import { usePendingGamesStore } from '../stores/PendingGamesStore'
import { usePlayerStore } from '../stores/PlayerStore'

const router = useRouter()
const pendingGames = usePendingGamesStore()
const gameStore = useGameStore()
const { name } = storeToRefs(usePlayerStore())
const numberOfPlayers = ref(2)
const error = ref('')
const busy = ref(false)

const playerName = computed(() => name.value.trim())
const validName = computed(
  () => playerName.value.length > 0 && playerName.value.length <= 30,
)

let unsubscribe = () => {}
onMounted(async () => {
  // Subscribe first, so no change between the query and the subscription is missed
  unsubscribe = api.onPendingGamesUpdated(pendingGames.update)
  try {
    pendingGames.update(await api.pending_games())
  } catch (cause) {
    error.value = api.errorMessage(cause)
  }
})
onUnmounted(() => unsubscribe())

async function enter(action: () => Promise<api.GameState>) {
  if (!validName.value || busy.value) return
  error.value = ''
  busy.value = true
  try {
    const game = await action()
    gameStore.update(game)
    await router.push({
      name: 'game',
      params: { id: game.id, player: playerName.value },
    })
  } catch (cause) {
    error.value = api.errorMessage(cause)
  } finally {
    busy.value = false
  }
}

const createGame = () =>
  enter(() => api.create_game(playerName.value, numberOfPlayers.value))
const joinGame = (id: string) =>
  enter(() => api.join_game(id, playerName.value))
</script>

<template>
  <section
    class="panel setup"
    aria-labelledby="lobby-title"
  >
    <h1 id="lobby-title">Let's play UNO</h1>
    <p>Play one round of UNO against 1-3 other players.</p>
    <div
      v-if="error"
      class="error"
      role="alert"
    >
      {{ error }}
    </div>
    <form @submit.prevent="createGame">
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
        v-model.number="numberOfPlayers"
      >
        <option :value="2">2 players &middot; 1 opponent</option>
        <option :value="3">3 players &middot; 2 opponents</option>
        <option :value="4">4 players &middot; 3 opponents</option>
      </select>
      <button
        class="primary"
        :disabled="!validName || busy"
        type="submit"
      >
        Create game &rarr;
      </button>
    </form>
    <h2 id="open-games">Join a game</h2>
    <ul
      v-if="pendingGames.games.length"
      class="game-list"
      aria-labelledby="open-games"
    >
      <li
        v-for="game in pendingGames.games"
        :key="game.id"
      >
        <div>
          <strong>{{ game.creator }}'s game</strong>
          <p class="muted">
            {{ game.players.length }} of {{ game.numberOfPlayers }} players
            &middot; {{ game.players.join(', ') }}
          </p>
        </div>
        <button
          :disabled="!validName || busy || game.players.includes(playerName)"
          @click="joinGame(game.id)"
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
