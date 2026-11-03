import { describe, it, test, expect } from '@jest/globals'
import { createRound} from '../utils/test_adapter'
import { canPlay, 
         draw, 
         play, 
         hasEnded,
         winner,
         canPlayAny,
         score} from '../../src/model/round'
import { shuffleBuilder } from '../utils/shuffling'

// The tests of saying "UNO!" and catching a missed "UNO!" are left out:
// functions for saying "UNO" are a should-have requirement that is not implemented

describe("ending the round", () => {
  describe("before playing the last card", () => {
    const shuffler = shuffleBuilder({ players: 4, cardsPerPlayer: 1 })
      .discard().is({ type: 'NUMBERED', color: 'BLUE', number: 8 })
      .hand(0).is({ type: 'NUMBERED', color: 'GREEN', number: 8 })
      .hand(1).is({ type: 'NUMBERED', color: 'GREEN', number: 4 })
      .build()
    const round = createRound({players: ['a', 'b', 'c', 'd'], dealer: 3, shuffler, cardsPerPlayer: 1})
    it("returns false from hasEnded()", () => {
      expect(hasEnded(round)).toBeFalsy()
    })
    it("doesn't return a winner", () => {
      expect(winner(round)).toBeUndefined();
    })
  })

  describe("playing the last card", () => {
    const shuffler = shuffleBuilder({ players: 4, cardsPerPlayer: 1 })
      .discard().is({ type: 'NUMBERED', color: 'BLUE', number: 8 })
      .hand(0).is({ type: 'NUMBERED', color: 'GREEN', number: 8 })
      .hand(1).is({ type: 'NUMBERED', color: 'GREEN', number: 4 })
      .build()
    const round = play(0, undefined, createRound({players: ['a', 'b', 'c', 'd'], dealer: 3, shuffler, cardsPerPlayer: 1}))
    it("returns true from hasEnded()", () => {
      expect(hasEnded(round)).toBeTruthy()
    })
    it("returns the winner", () => {
      expect(winner(round)).toEqual(0);
    })
    it("makes the player in turn undefined", () => {
      expect(round.playerInTurn).toBeUndefined()
    })
    it("ceases play", () => {
      expect(canPlay(0, round)).toBeFalsy()
      expect(canPlayAny(round)).toBeFalsy()
    })
    it("gives error on attempted play", () => {
      expect(() => play(0, undefined, round)).toThrow()
    })
    it("gives error on attempted draw", () => {
      expect(() => draw(round)).toThrow()
    })
  })
})

describe("score", () => {
  const builder = shuffleBuilder({ players: 2, cardsPerPlayer: 1 })
    .discard().is({ type: 'NUMBERED', color: 'BLUE', number: 8 })
    .hand(0).is({ type: 'NUMBERED', color: 'GREEN', number: 8 })
  it("is undefined before the last card is played", () => {
    const shuffler = builder.build()
    const round = createRound({players: ['a', 'b'], dealer: 1, shuffler, cardsPerPlayer: 1})
    expect(hasEnded(round)).toBeFalsy()
    expect(score(round)).toBeUndefined()
  })
  it("is defined after the last card is played", () => {
    const shuffler = builder.build()
    const round = play(0, undefined, createRound({players: ['a', 'b'], dealer: 1, shuffler, cardsPerPlayer: 1}))
    expect(score(round)).toBeDefined()
  })
  it("has the value of the card number if the opponent holds a numbered card", () => {
    for(let number = 0; number <= 9; number++) {
      builder.hand(1).is({type: 'NUMBERED', number})
      const shuffler = builder.build()
      const round = play(0, undefined, createRound({players: ['a', 'b'], dealer: 1, shuffler, cardsPerPlayer: 1}))
      expect(score(round)).toEqual(number)
    }
  })
  it("has the value 20 if the opponent holds a draw card", () => {
    builder.hand(1).is({type: 'DRAW'})
    const shuffler = builder.build()
    const round = play(0, undefined, createRound({players: ['a', 'b'], dealer: 1, shuffler, cardsPerPlayer: 1}))
    expect(score(round)).toEqual(20)
  })
  it("has the value 20 if the opponent holds a reverse card", () => {
    builder.hand(1).is({type: 'REVERSE'})
    const shuffler = builder.build()
    const round = play(0, undefined, createRound({players: ['a', 'b'], dealer: 1, shuffler, cardsPerPlayer: 1}))
    expect(score(round)).toEqual(20)
  })
  it("has the value 20 if the opponent holds a skip card", () => {
    builder.hand(1).is({type: 'SKIP'})
    const shuffler = builder.build()
    const round = play(0, undefined, createRound({players: ['a', 'b'], dealer: 1, shuffler, cardsPerPlayer: 1}))
    expect(score(round)).toEqual(20)
  })
  it("has the value 50 if the opponent holds a wild card", () => {
    builder.hand(1).is({type: 'WILD'})
    const shuffler = builder.build()
    const round = play(0, undefined, createRound({players: ['a', 'b'], dealer: 1, shuffler, cardsPerPlayer: 1}))
    expect(score(round)).toEqual(50)
  })
  it("has the value 50 if the opponent holds a wild draw card", () => {
    builder.hand(1).is({type: 'WILD DRAW'})
    const shuffler = builder.build()
    const round = play(0, undefined, createRound({players: ['a', 'b'], dealer: 1, shuffler, cardsPerPlayer: 1}))
    expect(score(round)).toEqual(50)
  })
  it("adds the cards if the opponent have more than one card", () => {
    builder.hand(0).is({color: 'BLUE', type: 'DRAW'})
    builder.hand(1).is({type: 'WILD DRAW'})
    builder.drawPile().is({number: 5}, {type: 'REVERSE'})
    const shuffler = builder.build()
    const round = play(0, undefined, createRound({players: ['a', 'b'], dealer: 1, shuffler, cardsPerPlayer: 1}))
    expect(round.hands[1].length).toEqual(3)
    expect(score(round)).toEqual(75)
  })
  it("adds the cards of all opponents if there are more than 2 players", () => {
    const builder = shuffleBuilder({ players: 4, cardsPerPlayer: 1 })
      .discard().is({ type: 'NUMBERED', color: 'BLUE', number: 8 })
      .hand(0).is({color: 'BLUE', type: 'DRAW'})
      .hand(1).is({type: 'WILD DRAW'})
      .hand(2).is({number: 7})
      .hand(3).is({number: 3})
      .drawPile().is({number: 5}, {type: 'REVERSE'})
    const shuffler = builder.build()
    const round = play(0, undefined, createRound({players: ['a', 'b', 'c', 'd'], dealer: 3, shuffler, cardsPerPlayer: 1}))
    expect(score(round)).toEqual(85)
  })
})
