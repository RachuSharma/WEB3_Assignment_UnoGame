const assert = require('node:assert/strict')
const { decide } = require('../src/game/botStrategy.ts')
const {
  startRound,
  roundFromMemento,
} = require('../../OOModel_Assignmet1/src/model/round.ts')
const { colors } = require('../../OOModel_Assignmet1/src/model/card.ts')

function rng(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
}
test('bots can forget/say UNO, catch/ignore UNO, and choose a valid wild colour', () => {
  const request = {
    id: 1,
    phase: 'turn',
    hand: [{ type: 'WILD' }, { type: 'NUMBERED', color: 'RED', number: 3 }],
    legal: [0],
    offender: null,
  }
  const says = decide(request, () => 0)
  const forgets = decide(request, () => 0.95)
  assert.equal(says.sayUno, true)
  assert.equal(forgets.sayUno, false)
  assert.equal(says.color, 'RED')
  assert.equal(
    decide({ ...request, phase: 'observe', offender: 0 }, () => 0).catch,
    true,
  )
  assert.equal(
    decide({ ...request, phase: 'observe', offender: 0 }, () => 0.9).catch,
    false,
  )
  assert.equal(decide({ ...request, legal: [] }).type, 'draw')
})
test('300 seeded rounds with 2-4 players finish using only legal bot decisions', () => {
  for (let players = 2; players <= 4; players++)
    for (let seed = 1; seed <= 100; seed++) {
      const random = rng(seed)
      const shuffler = (cards) => {
        for (let i = cards.length - 1; i > 0; i--) {
          const j = Math.floor(random() * (i + 1))
          ;[cards[i], cards[j]] = [cards[j], cards[i]]
        }
      }
      const round = startRound({
        players: Array.from({ length: players }, (_, i) => `P${i}`),
        dealer: 0,
        shuffler,
      })
      let moves = 0
      while (!round.hasEnded() && moves++ < 10000) {
        const player = round.playerInTurn()
        const hand = round.playerHand(player)
        const legal = hand.flatMap((_, i) => (round.canPlay(i) ? [i] : []))
        const decision = decide(
          { id: moves, phase: 'turn', hand, legal, offender: null },
          random,
        )
        if (decision.type === 'draw') round.draw()
        else {
          assert(legal.includes(decision.index))
          if (decision.color) assert(colors.includes(decision.color))
          if (decision.sayUno) round.sayUno(player)
          round.play(decision.index, decision.color)
        }
        const m = round.toMemento()
        assert.equal(
          m.hands.flat().length + m.drawPile.length + m.discardPile.length,
          108,
        )
      }
      assert(round.hasEnded(), `unfinished: ${players} players seed ${seed}`)
      assert.equal(round.playerHand(round.winner()).length, 0)
    }
})
test('model enforces four-card missed UNO penalty and closes catch window after next draw', () => {
  const state = {
    players: ['Human', 'Bot'],
    hands: [
      [
        { type: 'NUMBERED', color: 'RED', number: 1 },
        { type: 'NUMBERED', color: 'BLUE', number: 2 },
      ],
      [
        { type: 'NUMBERED', color: 'RED', number: 3 },
        { type: 'NUMBERED', color: 'GREEN', number: 4 },
      ],
    ],
    discardPile: [{ type: 'NUMBERED', color: 'RED', number: 5 }],
    drawPile: Array.from({ length: 12 }, () => ({
      type: 'NUMBERED',
      color: 'YELLOW',
      number: 8,
    })),
    currentColor: 'RED',
    currentDirection: 'clockwise',
    dealer: 1,
    playerInTurn: 0,
  }
  const round = roundFromMemento(state)
  round.play(0)
  assert.equal(round.catchUnoFailure({ accuser: 1, accused: 0 }), true)
  assert.equal(round.playerHand(0).length, 5)
  const expired = roundFromMemento(state)
  expired.play(0)
  expired.draw()
  assert.equal(expired.catchUnoFailure({ accuser: 1, accused: 0 }), false)
})
