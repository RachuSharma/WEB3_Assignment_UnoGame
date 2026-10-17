<script setup lang="ts">
import { computed } from 'vue'
import {
  colors,
  type Card,
  type Color,
} from '../../../OOModel_Assignmet1/src/model/card'
import type { GameState } from '../game/types'
import UnoCard from './UnoCard.vue'

const props = defineProps<{
  state: GameState
  player: string
  hand: readonly Card[]
  legal: number[]
  myTurn: boolean
  canSayUno: boolean
  busy: boolean
  pendingWild: number | null
}>()
const emit = defineEmits<{
  play: [index: number]
  draw: []
  uno: []
  catch: [player: string]
  color: [color: Color]
  cancelColor: []
  restart: []
}>()

const opponents = computed(() =>
  props.state.players.filter(({ name }) => name !== props.player),
)
const banner = computed(() => {
  const { winner, playerInTurn } = props.state
  if (winner)
    return winner === props.player
      ? 'You won the round!'
      : `${winner} won the round!`
  return playerInTurn === props.player
    ? 'Your turn'
    : `Waiting for ${playerInTurn}...`
})
</script>

<template>
  <section aria-label="UNO table">
    <div class="opponents">
      <article
        v-for="opponent in opponents"
        :key="opponent.name"
        class="opponent"
        :class="{ active: state.playerInTurn === opponent.name }"
      >
        <span class="avatar">{{ opponent.name.charAt(0).toUpperCase() }}</span>
        <div>
          <strong>{{ opponent.name }}</strong>
          <p>{{ opponent.cardCount }} cards</p>
        </div>
        <span
          v-if="state.playerInTurn === opponent.name"
          class="badge"
        >
          Playing
        </span>
        <button
          v-if="opponent.cardCount === 1 && !state.winner"
          class="catch"
          :disabled="busy"
          @click="emit('catch', opponent.name)"
        >
          Catch missed UNO!
        </button>
      </article>
    </div>
    <div class="table-center">
      <div
        class="turn-banner"
        role="status"
      >
        {{ banner }}
      </div>
      <div class="piles">
        <div>
          <div
            class="uno-card card-back"
            aria-label="Draw pile"
          >
            <strong>UNO</strong>
          </div>
          <p>Draw &middot; {{ state.drawPileSize }}</p>
        </div>
        <div>
          <UnoCard
            v-if="state.discardTop"
            :card="state.discardTop"
          />
          <p>Discard</p>
        </div>
      </div>
      <p
        v-if="state.currentColor"
        class="colour-status"
      >
        <span
          class="colour-dot"
          :class="state.currentColor.toLowerCase()"
        ></span>
        {{ state.currentColor.toLowerCase() }} &middot;
        {{ state.direction === 'clockwise' ? 'Clockwise' : 'Counterclockwise' }}
      </p>
      <button
        v-if="state.winner"
        class="primary button-link"
        @click="emit('restart')"
      >
        Set up another game &rarr;
      </button>
    </div>
    <section
      class="hand-panel"
      aria-labelledby="hand-title"
    >
      <div class="hand-heading">
        <h2 id="hand-title">
          {{ player }}
          <span class="muted">&middot; {{ hand.length }} cards</span>
        </h2>
      </div>
      <p class="muted">
        Highlighted cards can be played. Choose a colour when playing a wild.
      </p>
      <div class="hand">
        <UnoCard
          v-for="(card, i) in hand"
          :key="i"
          :card="card"
          interactive
          :playable="myTurn && pendingWild === null && legal.includes(i)"
          @play="emit('play', i)"
        />
      </div>
      <fieldset
        v-if="pendingWild !== null"
        class="colour-picker"
      >
        <legend>Choose the next colour</legend>
        <button
          v-for="color in colors"
          :key="color"
          :class="['colour-choice', color.toLowerCase()]"
          @click="emit('color', color)"
        >
          {{ color.toLowerCase() }}
        </button>
        <button @click="emit('cancelColor')">Cancel</button>
      </fieldset>
      <div class="actions">
        <button
          class="primary"
          :disabled="!myTurn || pendingWild !== null"
          @click="emit('draw')"
        >
          Draw a card
        </button>
        <button
          :disabled="!canSayUno"
          @click="emit('uno')"
        >
          Say UNO!
        </button>
      </div>
    </section>
    <details
      class="activity"
      open
    >
      <summary>Table activity</summary>
      <ol>
        <li
          v-for="(event, i) in state.events"
          :key="i"
        >
          {{ event }}
        </li>
      </ol>
    </details>
    <details class="activity">
      <summary>How this table plays</summary>
      <p>
        Match colour, number, or action. Draw Two and Wild Draw Four
        automatically penalise and skip the next player. Reverse acts as Skip
        with two players. Wild Draw Four is allowed only without a card of the
        current colour.
      </p>
      <p>
        Say UNO before playing down to one card. A missed UNO can be caught by
        any other player before the next play or draw for a four-card penalty,
        as implemented in Assignment 1. If a drawn card is playable, your turn
        continues.
      </p>
    </details>
  </section>
</template>
