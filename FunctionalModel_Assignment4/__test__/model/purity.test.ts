import { describe, it, expect } from '@jest/globals'
import * as _ from 'lodash'
import { canPlay, canPlayAny, draw, hasEnded, play, score, type Round } from '../../src/model/round'
import { isWild } from '../../src/model/card'
import { createRound } from '../utils/test_adapter'
import { noShuffle } from '../utils/shuffling'

// The tests run in strict mode, so changing a frozen value throws
function deepFreeze<T>(value: T): T {
  if (_.isObject(value) && !Object.isFrozen(value)) {
    Object.freeze(value)
    _.forEach(value as object, deepFreeze)
  }
  return value
}

// Plays the first legal card, or draws when there is none
function move(round: Round): Round {
  if (!canPlayAny(round)) return draw(round)
  const playerHand = round.hands[round.playerInTurn!]
  const index = _.findIndex(playerHand, (_card, i) => canPlay(i, round))
  return play(index, isWild(playerHand[index]) ? 'RED' : undefined, round)
}

describe("Pure functions", () => {
  it("never change the round they are given", () => {
    for (let players = 2; players <= 4; players++) {
      let round = deepFreeze(createRound({ players: _.times(players, String), dealer: 0 }))
      for (let moves = 0; !hasEnded(round) && moves < 2000; moves++) {
        const before = _.omit(round, 'shuffler')
        const next = deepFreeze(move(round))
        expect(_.omit(round, 'shuffler')).toEqual(before)
        round = next
      }
      expect(hasEnded(round)).toBeTruthy()
      expect(score(round)).toBeDefined()
    }
  })

  it("give the same result for the same arguments", () => {
    let round = createRound({ players: ['a', 'b', 'c'], dealer: 0, shuffler: noShuffle })
    for (let moves = 0; !hasEnded(round) && moves < 2000; moves++) {
      const next = move(round)
      expect(move(round)).toEqual(next)
      round = next
    }
    expect(hasEnded(round)).toBeTruthy()
  })
})
