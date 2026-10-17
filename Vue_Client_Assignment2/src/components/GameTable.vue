<script setup lang="ts">
import {
  colors,
  type Color,
  type Card,
} from '../../../OOModel_Assignmet1/src/model/card'
import type { RoundMemento } from '../../../OOModel_Assignmet1/src/model/round'
import UnoCard from './UnoCard.vue'
defineProps<{
  state: RoundMemento
  hand: readonly Card[]
  legal: number[]
  humanTurn: boolean
  pendingWild: number | null
  unoArmed: boolean
  offender: number | null
  messages: string[]
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
        v-for="(name, i) in state.players.slice(1)"
        :key="i"
        class="opponent"
        :class="{ active: state.playerInTurn === i + 1 }"
      >
        <span class="avatar">B{{ i + 1 }}</span>
        <div>
          <strong>{{ name }}</strong>
          <p>{{ state.hands[i + 1]?.length }} cards</p>
        </div>
        <span
          v-if="state.playerInTurn === i + 1"
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
            : `${state.players[state.playerInTurn ?? 0]} is thinking...`
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
          <p>Draw &middot; {{ state.drawPile.length }}</p>
        </div>
        <div>
          <UnoCard
            v-if="state.discardPile[0]"
            :card="state.discardPile[0]"
          />
          <p>Discard</p>
        </div>
      </div>
      <p class="colour-status">
        <span
          class="colour-dot"
          :class="state.currentColor.toLowerCase()"
        ></span>
        {{ state.currentColor.toLowerCase() }} &middot;
        {{
          state.currentDirection === 'clockwise'
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
          {{ state.players[0] }}
          <span class="muted">&middot; {{ hand.length }} cards</span>
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
          v-for="(card, i) in hand"
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
          :disabled="!(offender === 0 || (humanTurn && hand.length === 2))"
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
          v-for="(message, i) in messages"
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
