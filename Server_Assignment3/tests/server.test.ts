import { create_api, type API, type Broadcaster } from '../src/api'
import { MemoryStore } from '../src/memorystore'
import { player_view, type Game, type PendingGame } from '../src/servermodel'
import type { Card } from '../../OOModel_Assignmet1/src/model/card'

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
}

function setup(seed = 1) {
  const random = rng(seed)
  const shuffler = (cards: Card[]) => {
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[cards[i], cards[j]] = [cards[j], cards[i]]
    }
  }
  const sent: Game[] = []
  const lobby: PendingGame[][] = []
  const broadcaster: Broadcaster = {
    send_game: async (game) => {
      sent.push(game)
    },
    send_pending_games: async (games) => {
      lobby.push(games)
    },
  }
  const api = create_api(broadcaster, new MemoryStore(), shuffler)
  return { api, sent, lobby }
}

async function startedGame(api: API, players: string[]) {
  const { id } = await api.create_game(players[0], players.length)
  let game: Game | undefined
  for (const player of players.slice(1)) game = await api.join_game(id, player)
  return game!
}

test('players create, see and join games; the round starts when the game is full', async () => {
  const { api, sent, lobby } = setup()
  const created = await api.create_game('Alice', 3)
  expect(created.pending).toBe(true)
  expect(lobby.at(-1)?.map((g) => g.players)).toEqual([['Alice']])

  await api.join_game(created.id, 'Bob')
  expect(lobby.at(-1)?.[0].players).toEqual(['Alice', 'Bob'])
  expect(sent.at(-1)?.events[0]).toBe('Bob joined the game')

  const started = await api.join_game(created.id, 'Carol')
  expect(started.pending).toBe(false)
  expect(lobby.at(-1)).toEqual([])
  expect(sent.at(-1)).toBe(started)
  const view = player_view(started, 'Alice')
  expect(view.players).toEqual([
    { name: 'Alice', cardCount: 7 },
    { name: 'Bob', cardCount: 7 },
    { name: 'Carol', cardCount: 7 },
  ])
  expect(view.discardTop).not.toBeNull()
})

test('invalid requests are rejected', async () => {
  const { api } = setup()
  await expect(api.create_game('Alice', 1)).rejects.toThrow('2 to 4 players')
  await expect(api.create_game('Alice', 5)).rejects.toThrow('2 to 4 players')
  await expect(api.create_game('', 2)).rejects.toThrow('name')
  const { id } = await api.create_game('Alice', 2)
  await expect(api.join_game(id, 'Alice')).rejects.toThrow('already taken')
  await expect(api.join_game('missing', 'Bob')).rejects.toThrow('not found')
  await expect(api.draw_card(id, 'Alice')).rejects.toThrow('not started')

  const game = await api.join_game(id, 'Bob')
  await expect(api.join_game(id, 'Carol')).rejects.toThrow('already started')
  await expect(api.draw_card(id, 'Mallory')).rejects.toThrow('not playing')
  expect(() => player_view(game, 'Mallory')).toThrow('not playing')

  const view = player_view(game, 'Alice')
  const other = view.playerInTurn === 'Alice' ? 'Bob' : 'Alice'
  await expect(api.draw_card(id, other)).rejects.toThrow('not your turn')
  await expect(api.play_card(id, other, 0)).rejects.toThrow('not your turn')
  const inTurn = player_view(game, view.playerInTurn!)
  const illegal = inTurn.hand.findIndex((_, i) => !inTurn.playable.includes(i))
  if (illegal !== -1)
    await expect(
      api.play_card(id, view.playerInTurn!, illegal),
    ).rejects.toThrow('cannot be played')
})

test('players only see their own hand', async () => {
  const { api } = setup()
  const game = await startedGame(api, ['Alice', 'Bob'])
  const alice = player_view(game, 'Alice')
  const bob = player_view(game, 'Bob')
  expect(alice.hand).not.toEqual(bob.hand)
  expect(alice.hand).toHaveLength(alice.players[0].cardCount)
  expect(bob.hand).toHaveLength(bob.players[1].cardCount)
  const waiting = alice.playerInTurn === 'Alice' ? bob : alice
  expect(waiting.playable).toEqual([])
})

test('seeded rounds with 2-4 players finish, notifying participants of every change', async () => {
  let caught = 0
  let protectedByUno = 0
  for (let players = 2; players <= 4; players++)
    for (let seed = 1; seed <= 30; seed++) {
      const { api, sent } = setup(seed)
      const names = ['Alice', 'Bob', 'Carol', 'Dave'].slice(0, players)
      let game = await startedGame(api, names)
      let moves = 0
      while (!player_view(game, names[0]).winner && moves++ < 5000) {
        const before = sent.length
        const player = player_view(game, names[0]).playerInTurn!
        const view = player_view(game, player)
        if (view.playable.length === 0) game = await api.draw_card(game.id, player)
        else {
          const index = view.playable[0]
          const card = view.hand[index]
          const saysUno = view.hand.length === 2 && moves % 2 === 0
          if (saysUno) await api.say_uno(game.id, player)
          game = await api.play_card(
            game.id,
            player,
            index,
            card.type === 'WILD' || card.type === 'WILD DRAW' ? 'RED' : undefined,
          )
          const after = player_view(game, player)
          if (after.hand.length === 1 && !after.winner) {
            const accuser = names.find((name) => name !== player)!
            const success = await api.catch_uno(game.id, accuser, player)
            expect(success).toBe(!saysUno)
            game = await api.game(game.id)
            if (success) {
              caught++
              expect(player_view(game, player).hand).toHaveLength(5)
            } else protectedByUno++
          }
        }
        expect(sent.length).toBeGreaterThan(before)
        expect(sent.at(-1)?.version).toBe(game.version)
      }
      const result = player_view(game, names[0])
      expect(result.winner).not.toBeNull()
      expect(result.players.find((p) => p.name === result.winner)?.cardCount).toBe(0)
      await expect(api.draw_card(game.id, names[0])).rejects.toThrow('round is over')
    }
  expect(caught).toBeGreaterThan(0)
  expect(protectedByUno).toBeGreaterThan(0)
})
