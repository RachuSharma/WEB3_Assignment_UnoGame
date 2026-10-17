<script setup lang="ts">
import { computed } from 'vue'
import { colors, type Color } from '../../../OOModel_Assignmet1/src/model/card'
import { useCardsStore } from '../stores/CardsStore'
import { useCurrentPlayerStore } from '../stores/CurrentPlayerStore'
import { useDiscardPileStore } from '../stores/DiscardPileStore'
import { useOngoingGameStore } from '../stores/OngoingGameStore'
import { usePlayerHandsStore } from '../stores/PlayerHandsStore'
import UnoCard from './UnoCard.vue'

// The table shows the stores; the game screen handles what the player does
const cards = useCardsStore()
const currentPlayer = useCurrentPlayerStore()
const discardPile = useDiscardPileStore()
const ongoingGame = useOngoingGameStore()
const playerHands = usePlayerHandsStore()

const props = defineProps<{
  player: string
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

const winner = computed(() => ongoingGame.game?.winner ?? null)
const opponents = computed(() =>
  playerHands.playerHands.filter(({ name }) => name !== props.player),
)
const banner = computed(() => {
  if (winner.value)
    return winner.value === props.player
      ? 'You won the round!'
      : `${winner.value} won the round!`
  return currentPlayer.currentPlayer === props.player
    ? 'Your turn'
    : `Waiting for ${currentPlayer.currentPlayer}...`
})
</script>

<template>
  <section aria-label="UNO table">
    <div class="opponents">
      <article
        v-for="opponent in opponents"
        :key="opponent.name"
        class="opponent"
        :class="{ active: currentPlayer.currentPlayer === opponent.name }"
      >
        <span class="avatar">{{ opponent.name.charAt(0).toUpperCase() }}</span>
        <div>
          <strong>{{ opponent.name }}</strong>
          <p>{{ opponent.cardCount }} cards</p>
        </div>
        <span
          v-if="currentPlayer.currentPlayer === opponent.name"
          class="badge"
        >
          Playing
        </span>
        <button
          v-if="opponent.cardCount === 1 && !winner"
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
          <p>Draw &middot; {{ ongoingGame.game?.drawPileSize }}</p>
        </div>
        <div>
          <UnoCard
            v-if="discardPile.topCard"
            :card="discardPile.topCard"
          />
          <p>Discard</p>
        </div>
      </div>
      <p
        v-if="discardPile.currentColor"
        class="colour-status"
      >
        <span
          class="colour-dot"
          :class="discardPile.currentColor.toLowerCase()"
        ></span>
        {{ discardPile.currentColor.toLowerCase() }} &middot;
        {{
          ongoingGame.game?.direction === 'clockwise'
            ? 'Clockwise'
            : 'Counterclockwise'
        }}
      </p>
      <button
        v-if="winner"
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
          <span class="muted">&middot; {{ cards.cards.length }} cards</span>
        </h2>
      </div>
      <p class="muted">
        Highlighted cards can be played. Choose a colour when playing a wild.
      </p>
      <div class="hand">
        <UnoCard
          v-for="(card, i) in cards.cards"
          :key="i"
          :card="card"
          interactive
          :playable="
            myTurn && pendingWild === null && cards.playable.includes(i)
          "
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
          v-for="(event, i) in ongoingGame.game?.events"
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
