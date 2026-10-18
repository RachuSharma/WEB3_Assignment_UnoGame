<script setup lang="ts">
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
defineProps<{
  legal: number[]
  humanTurn: boolean
  pendingWild: number | null
  unoArmed: boolean
  offender: number | null
}>()
const emit = defineEmits<{
  play: [index: number]
  draw: []
  uno: []
  catch: [player: number]
  color: [color: Color]
  cancelColor: []
}>()
</script>

<template>
  <section aria-label="UNO table">
    <div class="opponents">
      <article
        v-for="(opponent, i) in playerHands.playerHands.slice(1)"
        :key="i"
        class="opponent"
        :class="{ active: currentPlayer.currentPlayer === i + 1 }"
      >
        <span class="avatar">B{{ i + 1 }}</span>
        <div>
          <strong>{{ opponent.name }}</strong>
          <p>{{ opponent.cardCount }} cards</p>
        </div>
        <span
          v-if="currentPlayer.currentPlayer === i + 1"
          class="badge"
        >
          Playing
        </span>
        <button
          v-if="offender === i + 1"
          class="catch"
          @click="emit('catch', i + 1)"
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
        {{
          humanTurn
            ? 'Your turn'
            : `${playerHands.playerHands[currentPlayer.currentPlayer ?? 0]?.name} is thinking...`
        }}
      </div>
      <div class="piles">
        <div>
          <div
            class="uno-card card-back"
            aria-label="Draw pile"
          >
            <strong>UNO</strong>
          </div>
          <p>Draw &middot; {{ ongoingGame.drawPileSize }}</p>
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
          ongoingGame.direction === 'clockwise'
            ? 'Clockwise'
            : 'Counterclockwise'
        }}
      </p>
    </div>
    <section
      class="hand-panel"
      aria-labelledby="hand-title"
    >
      <div class="hand-heading">
        <h2 id="hand-title">
          {{ playerHands.playerHands[0]?.name }}
          <span class="muted">&middot; {{ cards.cards.length }} cards</span>
        </h2>
        <span
          v-if="unoArmed"
          class="badge"
        >
          UNO ready for your next play
        </span>
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
          :playable="humanTurn && pendingWild === null && legal.includes(i)"
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
          :disabled="!humanTurn || pendingWild !== null"
          @click="emit('draw')"
        >
          Draw a card
        </button>
        <button
          :aria-pressed="unoArmed"
          :disabled="
            !(offender === 0 || (humanTurn && cards.cards.length === 2))
          "
          @click="emit('uno')"
        >
          {{ unoArmed ? 'UNO armed' : 'Say UNO!' }}
        </button>
      </div>
      <p
        v-if="offender === 0"
        role="status"
      >
        You have one card! Say UNO before someone catches you.
      </p>
    </section>
    <details
      class="activity"
      open
    >
      <summary>Table activity</summary>
      <ol>
        <li
          v-for="(message, i) in ongoingGame.messages"
          :key="i"
        >
          {{ message }}
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
        Say UNO before playing down to one card. A missed UNO can be caught
        before the next play or draw for a four-card penalty, as implemented in
        Assignment 1. If a drawn card is playable, your turn continues according
        to that model.
      </p>
    </details>
  </section>
</template>
