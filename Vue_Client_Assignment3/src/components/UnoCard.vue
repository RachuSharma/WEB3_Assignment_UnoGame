<script setup lang="ts">
import { computed } from 'vue'
import type { Card } from '../../../OOModel_Assignmet1/src/model/card'
const props = defineProps<{
  card: Card
  playable?: boolean
  interactive?: boolean
}>()
const emit = defineEmits<{ play: [] }>()
const label = computed(() =>
  props.card.type === 'NUMBERED'
    ? String(props.card.number)
    : {
        SKIP: '\u2298',
        REVERSE: '\u21c4',
        DRAW: '+2',
        WILD: 'W',
        'WILD DRAW': '+4',
      }[props.card.type],
)
const colour = computed(() =>
  'color' in props.card ? props.card.color.toLowerCase() : 'wild',
)
const description = computed(
  () =>
    `${colour.value} ${props.card.type === 'NUMBERED' ? props.card.number : props.card.type}`,
)
</script>

<template>
  <button
    v-if="interactive"
    class="uno-card"
    :class="colour"
    :disabled="!playable"
    :aria-label="`Play ${description}`"
    @click="emit('play')"
  >
    <span class="corner">{{ label }}</span>
    <strong>{{ label }}</strong>
    <span class="corner bottom">{{ label }}</span>
  </button>
  <div
    v-else
    class="uno-card"
    :class="colour"
    role="img"
    :aria-label="description"
  >
    <span class="corner">{{ label }}</span>
    <strong>{{ label }}</strong>
    <span class="corner bottom">{{ label }}</span>
  </div>
</template>
