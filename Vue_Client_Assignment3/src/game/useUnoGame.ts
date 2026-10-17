import { computed, onScopeDispose, ref } from 'vue'
import { isWild, type Color } from '../../../OOModel_Assignmet1/src/model/card'
import { useCardsStore } from '../stores/CardsStore'
import { useCurrentPlayerStore } from '../stores/CurrentPlayerStore'
import { useDiscardPileStore } from '../stores/DiscardPileStore'
import { useOngoingGameStore } from '../stores/OngoingGameStore'
import { usePlayerHandsStore } from '../stores/PlayerHandsStore'
import * as uno from './unoClient'
import type { GameState } from './types'

// Follows one game on the game screen; leaving the screen stops the subscription
export function useUnoGame(id: string, player: string) {
  const cards = useCardsStore()
  const currentPlayer = useCurrentPlayerStore()
  const discardPile = useDiscardPileStore()
  const ongoingGame = useOngoingGameStore()
  const playerHands = usePlayerHandsStore()
  const error = ref('')
  const notice = ref('')
  const busy = ref(false)
  const pendingWild = ref<number | null>(null)

  // The server decides which cards are legal, so the client has no rule logic
  const myTurn = computed(
    () =>
      ongoingGame.game?.id === id &&
      !ongoingGame.game.winner &&
      currentPlayer.currentPlayer === player &&
      !busy.value,
  )
  // Say UNO before playing down to one card, or late until someone catches you
  const canSayUno = computed(
    () =>
      ongoingGame.game?.id === id &&
      !ongoingGame.game.pending &&
      !ongoingGame.game.winner &&
      !busy.value &&
      ((myTurn.value && cards.cards.length === 2) || cards.cards.length === 1),
  )

  // The server sends complete snapshots; notifications and mutation results may
  // arrive out of order, so only the newest one reaches the stores
  function show(state: GameState) {
    if (state.id !== id) return
    const shown = ongoingGame.game
    if (shown && shown.id === id && shown.version > state.version) return
    ongoingGame.set({
      id: state.id,
      version: state.version,
      pending: state.pending,
      numberOfPlayers: state.numberOfPlayers,
      direction: state.direction,
      drawPileSize: state.drawPileSize,
      winner: state.winner,
      events: state.events,
    })
    playerHands.update(state.players)
    currentPlayer.set(state.playerInTurn)
    discardPile.set(state.discardTop, state.currentColor)
    cards.set(state.hand, state.playable)
    if (state.playerInTurn !== player) pendingWild.value = null
  }
  function fail(cause: unknown) {
    error.value = uno.errorMessage(cause)
  }
  async function run(action: () => Promise<void>) {
    error.value = ''
    notice.value = ''
    busy.value = true
    try {
      await action()
    } catch (cause) {
      fail(cause)
    } finally {
      busy.value = false
    }
  }

  // Subscribe first, so no change between the query and the subscription is missed
  const unsubscribe = uno.onGameUpdated(id, player, show, fail)
  onScopeDispose(unsubscribe)
  async function load() {
    try {
      show(await uno.game(id, player))
    } catch (cause) {
      fail(cause)
    }
  }

  function chooseCard(index: number) {
    if (!myTurn.value || !cards.playable.includes(index)) return
    const card = cards.cards[index]
    if (card && isWild(card)) {
      pendingWild.value = index
      return
    }
    play(index)
  }
  function play(index: number, color?: Color) {
    pendingWild.value = null
    return run(async () => show(await uno.play_card(id, player, index, color)))
  }
  function chooseColor(color: Color) {
    if (pendingWild.value !== null) play(pendingWild.value, color)
  }
  function cancelColor() {
    pendingWild.value = null
  }
  function draw() {
    if (!myTurn.value || pendingWild.value !== null) return
    return run(async () => show(await uno.draw_card(id, player)))
  }
  function sayUno() {
    if (!canSayUno.value) return
    return run(async () => show(await uno.say_uno(id, player)))
  }
  function catchPlayer(accused: string) {
    return run(async () => {
      if (!(await uno.catch_uno(id, player, accused)))
        notice.value = `${accused} cannot be caught: they said UNO or someone has acted since.`
    })
  }

  return {
    error,
    notice,
    busy,
    pendingWild,
    myTurn,
    canSayUno,
    load,
    chooseCard,
    chooseColor,
    cancelColor,
    draw,
    sayUno,
    catchPlayer,
  }
}
