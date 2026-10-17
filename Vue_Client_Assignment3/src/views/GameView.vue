<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import {
  isWild,
  type Color,
} from '../../../OOModel_Assignmet1/src/model/card'
import GameTable from '../components/GameTable.vue'
import * as api from '../model/uno-client'
import { useGameStore } from '../stores/GameStore'

const props = defineProps<{ id: string; player: string }>()
const gameStore = useGameStore()
const { state } = storeToRefs(gameStore)
const error = ref('')
const notice = ref('')
const busy = ref(false)
const pendingWild = ref<number | null>(null)

let unsubscribe = () => {}
onMounted(async () => {
  // Subscribe first, so no change between the query and the subscription is missed
  unsubscribe = api.onGameUpdated(
    props.id,
    props.player,
    gameStore.update,
    (cause) => (error.value = api.errorMessage(cause)),
  )
  try {
    gameStore.update(await api.game(props.id, props.player))
  } catch (cause) {
    error.value = api.errorMessage(cause)
  }
})
onUnmounted(() => {
  unsubscribe()
  gameStore.clear()
})

// A colour choice is only meaningful during this player's own turn
watch(
  () => state.value?.playerInTurn,
  (playerInTurn) => {
    if (playerInTurn !== props.player) pendingWild.value = null
  },
)

async function run(action: () => Promise<void>) {
  error.value = ''
  notice.value = ''
  busy.value = true
  try {
    await action()
  } catch (cause) {
    error.value = api.errorMessage(cause)
  } finally {
    busy.value = false
  }
}

function chooseCard(index: number) {
  const card = state.value?.hand[index]
  if (!card) return
  if (isWild(card)) pendingWild.value = index
  else play(index)
}

function play(index: number, color?: Color) {
  pendingWild.value = null
  return run(async () =>
    gameStore.update(await api.play_card(props.id, props.player, index, color)),
  )
}

function chooseColor(color: Color) {
  if (pendingWild.value !== null) play(pendingWild.value, color)
}

const draw = () =>
  run(async () =>
    gameStore.update(await api.draw_card(props.id, props.player)),
  )

const sayUno = () =>
  run(async () => gameStore.update(await api.say_uno(props.id, props.player)))

const catchPlayer = (accused: string) =>
  run(async () => {
    if (!(await api.catch_uno(props.id, props.player, accused)))
      notice.value = `${accused} cannot be caught: they said UNO or someone has acted since.`
  })
</script>

<template>
  <div
    v-if="error"
    class="error"
    role="alert"
  >
    {{ error }}
    <RouterLink
      v-if="!state"
      to="/"
    >
      Return to the lobby
    </RouterLink>
  </div>
  <p
    v-if="notice"
    class="notice"
    role="status"
  >
    {{ notice }}
  </p>
  <section
    v-if="state?.pending"
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
      Others can join this game from the lobby. The round starts as soon as
      everyone has joined.
    </p>
  </section>
  <GameTable
    v-else-if="state"
    :state="state"
    :player="player"
    :busy="busy"
    :pending-wild="pendingWild"
    @play="chooseCard"
    @draw="draw"
    @uno="sayUno"
    @catch="catchPlayer"
    @color="chooseColor"
    @cancel-color="pendingWild = null"
  />
  <p
    v-else-if="!error"
    class="muted"
  >
    Loading the game...
  </p>
</template>
