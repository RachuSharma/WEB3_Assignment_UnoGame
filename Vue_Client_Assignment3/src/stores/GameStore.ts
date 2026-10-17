import { computed, onScopeDispose, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import { isWild, type Color } from '../../../OOModel_Assignmet1/src/model/card'
import * as uno from '../game/unoClient'
import type { GameState, PendingGame, Setup } from '../game/types'

export const useGameStore = defineStore('game', () => {
  // The server owns the round. The store keeps the newest snapshot it sent to this player.
  const state = shallowRef<GameState | null>(null)
  const player = ref('')
  const pendingGames = ref<PendingGame[]>([])
  const error = ref('')
  const notice = ref('')
  const busy = ref(false)
  const pendingWild = ref<number | null>(null)
  let gameId = ''
  let stopGame = () => {}
  let stopLobby = () => {}

  // The router shows the screen that matches this status
  const status = computed(() => {
    if (!state.value) return 'setup'
    if (state.value.pending) return 'waiting'
    return state.value.winner ? 'finished' : 'playing'
  })
  const hand = computed(() => state.value?.hand ?? [])
  const myTurn = computed(
    () =>
      status.value === 'playing' &&
      state.value?.playerInTurn === player.value &&
      !busy.value,
  )
  // The server decides which cards are legal, so the client has no rule logic
  const legal = computed(() => (myTurn.value ? state.value!.playable : []))
  // Say UNO before playing down to one card, or late until someone catches you
  const canSayUno = computed(
    () =>
      status.value === 'playing' &&
      !busy.value &&
      ((myTurn.value && hand.value.length === 2) || hand.value.length === 1),
  )

  // Notifications and mutation results may arrive out of order, so keep the newest
  function update(next: GameState) {
    if (next.id !== gameId) return
    if (state.value && state.value.version > next.version) return
    state.value = next
    if (next.playerInTurn !== player.value) pendingWild.value = null
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

  async function watchLobby() {
    stopLobby()
    // Subscribe first, so no change between the query and the subscription is missed
    stopLobby = uno.onPendingGamesUpdated(
      (games) => (pendingGames.value = games),
    )
    try {
      pendingGames.value = await uno.pending_games()
    } catch (cause) {
      fail(cause)
    }
  }
  function unwatchLobby() {
    stopLobby()
    stopLobby = () => {}
  }

  async function open(game: GameState, name: string) {
    stopGame()
    gameId = game.id
    player.value = name
    update(game)
    // Subscribe, then ask again, so no change before the subscription is missed
    stopGame = uno.onGameUpdated(game.id, name, update, fail)
    update(await uno.game(game.id, name))
  }
  function create(setup: Setup) {
    return run(async () =>
      open(await uno.create_game(setup.name, setup.players), setup.name),
    )
  }
  function join(id: string, name: string) {
    return run(async () => open(await uno.join_game(id, name), name))
  }

  function chooseCard(index: number) {
    if (!legal.value.includes(index)) return
    const card = hand.value[index]
    if (card && isWild(card)) {
      pendingWild.value = index
      return
    }
    play(index)
  }
  function play(index: number, color?: Color) {
    pendingWild.value = null
    return run(async () =>
      update(await uno.play_card(gameId, player.value, index, color)),
    )
  }
  function chooseColor(color: Color) {
    if (pendingWild.value !== null) play(pendingWild.value, color)
  }
  function cancelColor() {
    pendingWild.value = null
  }
  function draw() {
    if (!myTurn.value || pendingWild.value !== null) return
    return run(async () => update(await uno.draw_card(gameId, player.value)))
  }
  function sayUno() {
    if (!canSayUno.value) return
    return run(async () => update(await uno.say_uno(gameId, player.value)))
  }
  function catchPlayer(accused: string) {
    return run(async () => {
      if (!(await uno.catch_uno(gameId, player.value, accused)))
        notice.value = `${accused} cannot be caught: they said UNO or someone has acted since.`
    })
  }

  // Leaves the current game; the server keeps it for the other players
  function reset() {
    stopGame()
    stopGame = () => {}
    gameId = ''
    state.value = null
    player.value = ''
    error.value = ''
    notice.value = ''
    pendingWild.value = null
  }
  onScopeDispose(() => {
    stopGame()
    stopLobby()
  })

  return {
    state,
    player,
    pendingGames,
    error,
    notice,
    busy,
    pendingWild,
    status,
    hand,
    myTurn,
    legal,
    canSayUno,
    watchLobby,
    unwatchLobby,
    create,
    join,
    chooseCard,
    chooseColor,
    cancelColor,
    draw,
    sayUno,
    catchPlayer,
    reset,
  }
})
