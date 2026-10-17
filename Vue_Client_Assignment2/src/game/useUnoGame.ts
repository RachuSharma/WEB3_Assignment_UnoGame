import { computed, onScopeDispose, ref } from 'vue'
import {
  startRound,
  type Round,
} from '../../../OOModel_Assignmet1/src/model/round'
import {
  cardScore,
  isWild,
  type Color,
} from '../../../OOModel_Assignmet1/src/model/card'
import { useCardsStore } from '../stores/CardsStore'
import { useCurrentPlayerStore } from '../stores/CurrentPlayerStore'
import { useDiscardPileStore } from '../stores/DiscardPileStore'
import { useOngoingGameStore } from '../stores/OngoingGameStore'
import { usePlayerHandsStore } from '../stores/PlayerHandsStore'
import type { BotDecision, BotRequest, BotResponse, Setup } from './types'

// Runs the round for the game screen; leaving the screen stops the bots
export function useUnoGame() {
  const cards = useCardsStore()
  const currentPlayer = useCurrentPlayerStore()
  const discardPile = useDiscardPileStore()
  const ongoingGame = useOngoingGameStore()
  const playerHands = usePlayerHandsStore()
  // The class instance owns the rules. The stores receive plain copies to display.
  let round: Round | null = null
  const error = ref('')
  const busy = ref(false)
  const pendingWild = ref<number | null>(null)
  const unoArmed = ref(false)
  const offender = ref<number | null>(null)
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

  const humanTurn = computed(
    () => currentPlayer.currentPlayer === 0 && !busy.value && !error.value,
  )
  const legal = computed(() => {
    if (!round || !humanTurn.value) return []
    return cards.cards.flatMap((_, i) => (round!.canPlay(i) ? [i] : []))
  })
  function log(message: string) {
    ongoingGame.log(message)
  }
  function sync() {
    stateVersion++
    if (!round) return
    const memento = round.toMemento()
    cards.set(memento.hands[0])
    playerHands.update(
      memento.players.map((name, i) => ({
        name,
        cardCount: memento.hands[i].length,
        handValue: memento.hands[i].reduce(
          (sum, card) => sum + cardScore(card),
          0,
        ),
      })),
    )
    currentPlayer.set(memento.playerInTurn ?? null)
    discardPile.set(memento.discardPile[0] ?? null, memento.currentColor)
    ongoingGame.set({
      direction: memento.currentDirection,
      drawPileSize: memento.drawPile.length,
    })
    if (round.hasEnded()) {
      ongoingGame.finish(round.player(round.winner()!), round.score() ?? 0)
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
    if (!round || round.hasEnded() || error.value) return
    const token = generation
    // Leave a visible window to say UNO late or catch a bot before its next action.
    busy.value = currentPlayer.currentPlayer !== 0
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
    const card = cards.cards[index]
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
  function cancelColor() {
    pendingWild.value = null
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
    if (!round || round.hasEnded() || error.value) return
    if (offender.value === 0) {
      round.sayUno(0)
      offender.value = null
      log(`${round.player(0)} said UNO!`)
    } else if (humanTurn.value && cards.cards.length === 2) {
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
  onScopeDispose(stop)
  return {
    error,
    busy,
    pendingWild,
    unoArmed,
    offender,
    humanTurn,
    legal,
    start,
    chooseCard,
    chooseColor,
    cancelColor,
    humanDraw,
    sayUno,
    catchBot,
  }
}
