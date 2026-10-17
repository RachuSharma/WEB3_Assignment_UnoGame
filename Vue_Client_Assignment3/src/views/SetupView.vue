<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import * as uno from '../game/unoClient'
import type { GameState } from '../game/types'
import { usePendingGamesStore } from '../stores/PendingGamesStore'
const router = useRouter()
const pendingGames = usePendingGamesStore()
const name = ref('')
const players = ref(2)
const error = ref('')
const busy = ref(false)
const playerName = computed(() => name.value.trim())
const valid = computed(
  () => playerName.value.length > 0 && playerName.value.length <= 30,
)

let unsubscribe = () => {}
onMounted(async () => {
  // Subscribe first, so no change between the query and the subscription is missed
  unsubscribe = uno.onPendingGamesUpdated(pendingGames.update)
  try {
    pendingGames.update(await uno.pending_games())
  } catch (cause) {
    error.value = uno.errorMessage(cause)
  }
})
onUnmounted(() => unsubscribe())

async function enter(action: () => Promise<GameState>) {
  if (!valid.value || busy.value) return
  error.value = ''
  busy.value = true
  try {
    const game = await action()
    await router.push({
      name: 'game',
      params: { id: game.id, player: playerName.value },
    })
  } catch (cause) {
    error.value = uno.errorMessage(cause)
  } finally {
    busy.value = false
  }
}
const create = () =>
  enter(() => uno.create_game(playerName.value, players.value))
const join = (id: string) => enter(() => uno.join_game(id, playerName.value))
</script>

<template>
  <section
    class="panel setup"
    aria-labelledby="setup-title"
  >
    <h1 id="setup-title">Let's play UNO</h1>
    <p>Play one round of UNO against 1-3 other players.</p>
    <div
      v-if="error"
      class="error"
      role="alert"
    >
      {{ error }}
    </div>
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
        :disabled="!valid || busy"
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
        v-for="pending in pendingGames.games"
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
          :disabled="!valid || busy || pending.players.includes(playerName)"
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
