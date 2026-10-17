import { computed, onScopeDispose, ref, shallowRef } from 'vue'
import {
  startRound,
  type Round,
} from '../../../OOModel_Assignmet1/src/model/round'
import { isWild, type Color } from '../../../OOModel_Assignmet1/src/model/card'
import type { BotDecision, BotRequest, BotResponse, Setup } from './types'

export function useUnoGame() {
  // The class instance owns the rules. Replacing its plain snapshot notifies Vue.
  let round: Round | null = null
  const snapshot = shallowRef<ReturnType<Round['toMemento']> | null>(null)
  const screen = ref<'setup' | 'playing' | 'finished'>('setup')
  const error = ref('')
  const messages = ref<string[]>([])
  const busy = ref(false)
  const pendingWild = ref<number | null>(null)
  const unoArmed = ref(false)
  const offender = ref<number | null>(null)
  const winner = ref('')
  const score = ref(0)
  let workers: Worker[] = []
  let generation = 0
  let requestId = 0
  let stateVersion = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  const pending = new Map<
    number,
    {
      resolve: (decision: BotDecision) => void
      reject: (error: Error) => void
      timeout: ReturnType<typeof setTimeout>
    }
  >()

  const hand = computed(() => snapshot.value?.hands[0] ?? [])
  const humanTurn = computed(
    () =>
      screen.value === 'playing' &&
      snapshot.value?.playerInTurn === 0 &&
      !busy.value &&
      !error.value,
  )
  const legal = computed(() => {
    if (!snapshot.value || !round || !humanTurn.value) return []
    return hand.value.flatMap((_, i) => (round!.canPlay(i) ? [i] : []))
  })
  function log(message: string) {
    messages.value = [message, ...messages.value].slice(0, 12)
  }
  function sync() {
    stateVersion++
    snapshot.value = round?.toMemento() ?? null
    if (round?.hasEnded()) {
      winner.value = round.player(round.winner()!)
      score.value = round.score() ?? 0
      screen.value = 'finished'
      stop()
    }
  }
  function stop() {
    generation++
    clearTimeout(timer)
    workers.forEach((worker) => worker.terminate())
    workers = []
    for (const task of pending.values()) {
      clearTimeout(task.timeout)
      task.reject(new Error('Game stopped'))
    }
    pending.clear()
    busy.value = false
  }
  function fail(cause: unknown) {
    error.value =
      cause instanceof Error ? cause.message : 'Something went wrong.'
    stop()
  }
  function ask(
    player: number,
    phase: BotRequest['phase'],
  ): Promise<BotDecision> {
    const worker = workers[player - 1]
    if (!worker || !round)
      return Promise.reject(
        new Error('Bot worker unavailable. Start a new round.'),
      )
    const id = ++requestId
    const request: BotRequest = {
      id,
      phase,
      hand: [...round.playerHand(player)],
      legal:
        phase === 'turn'
          ? round
              .playerHand(player)
              .flatMap((_, i) => (round!.canPlay(i) ? [i] : []))
          : [],
      offender: offender.value === player ? null : offender.value,
    }
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        pending.delete(id)
        reject(
          new Error('A bot did not respond. Start a new round to try again.'),
        )
      }, 5000)
      pending.set(id, { resolve, reject, timeout })
      worker.postMessage(request)
    })
  }
  function start(setup: Setup) {
    stop()
    error.value = ''
    if (
      !setup.name.trim() ||
      !Number.isInteger(setup.bots) ||
      setup.bots < 1 ||
      setup.bots > 3
    ) {
      error.value = 'Enter your name and choose 1 to 3 bots.'
      return
    }
    try {
      round = startRound({
        players: [
          setup.name.trim(),
          ...Array.from({ length: setup.bots }, (_, i) => `Bot ${i + 1}`),
        ],
        dealer: setup.bots,
      })
      messages.value = []
      pendingWild.value = null
      offender.value = null
      unoArmed.value = false
      for (let i = 0; i < setup.bots; i++) {
        const worker = new Worker(
          new URL('../workers/bot.worker.ts', import.meta.url),
          {
            type: 'module',
          },
        )
        worker.onmessage = ({ data }: MessageEvent<BotResponse>) => {
          const task = pending.get(data.id)
          if (!task) return
          clearTimeout(task.timeout)
          pending.delete(data.id)
          task.resolve(data.decision)
        }
        worker.onerror = () =>
          fail(
            new Error('A bot worker failed. Start a new round to try again.'),
          )
        workers.push(worker)
      }
      screen.value = 'playing'
      sync()
      log(
        'Round started. Match the colour, number, or symbol on the discard pile.',
      )
      schedule()
    } catch (cause) {
      fail(cause)
    }
  }
  function play(player: number, index: number, color?: Color, saysUno = false) {
    if (!round || round.playerInTurn() !== player || !round.canPlay(index))
      throw new Error('That move is no longer available.')
    const card = round.playerHand(player)[index]
    if (!card) return
    const before = round.playerHand(player).length
    if (saysUno) round.sayUno(player)
    round.play(index, color)
    offender.value = before === 2 && !saysUno ? player : null
    unoArmed.value = false
    log(
      `${round.player(player)} played ${card.type === 'NUMBERED' ? card.number : card.type}${color ? ` and chose ${color.toLowerCase()}` : ''}.${saysUno ? ' UNO!' : ''}`,
    )
    sync()
  }
  function draw(player: number) {
    if (!round || round.playerInTurn() !== player) return
    round.draw()
    offender.value = null
    unoArmed.value = false
    log(
      `${round.player(player)} drew a card.${round.playerInTurn() === player ? ' The drawn card is playable; the turn continues.' : ''}`,
    )
    sync()
  }
  function catchPlayer(accuser: number, accused: number) {
    if (!round || round.hasEnded() || accuser === accused) return
    if (round.catchUnoFailure({ accuser, accused })) {
      log(
        `${round.player(accuser)} caught ${round.player(accused)} missing UNO: four penalty cards.`,
      )
      offender.value = null
      sync()
    }
  }
  function schedule() {
    if (screen.value !== 'playing' || error.value) return
    const token = generation
    // Leave a visible window to say UNO late or catch a bot before its next action.
    busy.value = snapshot.value?.playerInTurn !== 0
    clearTimeout(timer)
    timer = setTimeout(() => {
      void advance(token)
    }, 1400)
  }
  async function advance(token: number) {
    try {
      if (token !== generation || !round || round.hasEnded()) return
      if (offender.value !== null) {
        const accused = offender.value
        const version = stateVersion
        const decisions = await Promise.all(
          workers.map((_, i) => ask(i + 1, 'observe')),
        )
        if (token !== generation) return
        if (version !== stateVersion) {
          schedule()
          return
        }
        for (const [i, decision] of decisions.entries()) {
          if (
            decision.type === 'observe' &&
            decision.catch &&
            offender.value === accused
          )
            catchPlayer(i + 1, accused)
        }
      }
      if (token !== generation || !round) return
      const player = round.playerInTurn()
      if (player === undefined || player === 0) {
        busy.value = false
        return
      }
      const version = stateVersion
      const decision = await ask(player, 'turn')
      if (token !== generation) return
      if (version !== stateVersion) {
        schedule()
        return
      }
      if (decision.type === 'play')
        play(player, decision.index, decision.color, decision.sayUno)
      else if (decision.type === 'draw') draw(player)
      else throw new Error('Unexpected bot response.')
      schedule()
    } catch (cause) {
      if (token === generation) fail(cause)
    }
  }
  function chooseCard(index: number) {
    if (!humanTurn.value || !legal.value.includes(index)) return
    const card = hand.value[index]
    if (card && isWild(card)) {
      pendingWild.value = index
      return
    }
    humanPlay(index)
  }
  function humanPlay(index: number, color?: Color) {
    if (!humanTurn.value) return
    try {
      play(0, index, color, unoArmed.value)
      pendingWild.value = null
      schedule()
    } catch (cause) {
      fail(cause)
    }
  }
  function chooseColor(color: Color) {
    if (pendingWild.value !== null) humanPlay(pendingWild.value, color)
  }
  function humanDraw() {
    if (!humanTurn.value || pendingWild.value !== null) return
    try {
      draw(0)
      schedule()
    } catch (cause) {
      fail(cause)
    }
  }
  function sayUno() {
    if (!round || screen.value !== 'playing' || error.value) return
    if (offender.value === 0) {
      round.sayUno(0)
      offender.value = null
      log(`${round.player(0)} said UNO!`)
    } else if (humanTurn.value && hand.value.length === 2) {
      unoArmed.value = !unoArmed.value
    }
  }
  function catchBot(player: number) {
    try {
      catchPlayer(0, player)
    } catch (cause) {
      fail(cause)
    }
  }
  function reset() {
    stop()
    round = null
    snapshot.value = null
    screen.value = 'setup'
    error.value = ''
    pendingWild.value = null
  }
  onScopeDispose(stop)
  return {
    snapshot,
    screen,
    error,
    messages,
    busy,
    pendingWild,
    unoArmed,
    offender,
    winner,
    score,
    hand,
    humanTurn,
    legal,
    start,
    chooseCard,
    chooseColor,
    humanDraw,
    sayUno,
    catchBot,
    reset,
  }
}
