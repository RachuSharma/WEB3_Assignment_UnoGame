import * as _ from 'lodash'
import { standardShuffler, type Shuffler } from '../utils/random_utils'
import { isColor, isColored, type Card, type Color, type ColoredCard } from './card'
import * as deck from './deck'
import * as discard from './discard_pile'
import * as hand from './player_hand'
import type { Deck } from './deck'
import type { DiscardPile } from './discard_pile'
import type { PlayerHand } from './player_hand'

export const MIN_PLAYERS = 2
export const MAX_PLAYERS = 10

export const directions = ['clockwise', 'counterclockwise'] as const
export type Direction = (typeof directions)[number]

// A round is called a "hand" in the rule set. Every action returns a new round and leaves the old one unchanged.
export type Round = Readonly<{
  players: readonly string[]
  playerCount: number
  dealer: number
  hands: readonly PlayerHand[]
  drawPile: Deck
  discardPile: DiscardPile
  currentColor: Color
  currentDirection: Direction
  // Undefined once the round has ended
  playerInTurn: number | undefined
  // Kept for reshuffling the discard pile into a new draw pile
  shuffler: Shuffler<Card>
}>

export function createRound(
  players: readonly string[],
  dealer: number,
  shuffler: Shuffler<Card> = standardShuffler,
  cardsPerPlayer: number = 7
): Round {
  if (players.length < MIN_PLAYERS) throw new Error(`At least ${MIN_PLAYERS} players are required`)
  if (players.length > MAX_PLAYERS) throw new Error(`At most ${MAX_PLAYERS} players are allowed`)
  if (!Number.isInteger(dealer) || dealer < 0) throw new Error(`Invalid dealer: ${dealer}`)
  if (!Number.isInteger(cardsPerPlayer) || cardsPerPlayer < 1) throw new Error(`Invalid cards per player: ${cardsPerPlayer}`)

  const cards = deck.shuffle(shuffler, deck.createInitialDeck())
  const dealtCount = players.length * cardsPerPlayer
  if (dealtCount >= cards.length) throw new Error('Not enough cards to deal')

  const hands = _.chunk(_.take(cards, dealtCount), cardsPerPlayer)
  const [top, drawPile] = firstDiscard(shuffler, _.drop(cards, dealtCount))
  // A dealer index beyond the player count wraps around the table
  const dealerIndex = dealer % players.length

  const dealt: Round = {
    players: [...players],
    playerCount: players.length,
    dealer: dealerIndex,
    hands,
    drawPile,
    discardPile: [top],
    currentColor: top.color,
    currentDirection: 'clockwise',
    playerInTurn: undefined,
    shuffler,
  }
  // The first card takes effect as if the dealer had played it
  return applyEffect(top, dealerIndex, dealt)
}

export function topOfDiscard(round: Round): Card | undefined {
  return discard.top(round.discardPile)
}

export function canPlay(cardIndex: number, round: Round): boolean {
  if (round.playerInTurn === undefined) return false
  const playerHand = round.hands[round.playerInTurn]
  if (!_.inRange(cardIndex, 0, playerHand.length)) return false
  return isLegalPlay(playerHand[cardIndex], playerHand, round)
}

export function canPlayAny(round: Round): boolean {
  if (round.playerInTurn === undefined) return false
  return _.some(_.range(round.hands[round.playerInTurn].length), index => canPlay(index, round))
}

// A color must be named when, and only when, playing a wild card
export function play(cardIndex: number, namedColor: Color | undefined, round: Round): Round {
  const player = requirePlayerInTurn(round)
  const playerHand = round.hands[player]
  if (!_.inRange(cardIndex, 0, playerHand.length)) throw new Error(`Player ${player} has no card at index ${cardIndex}`)
  const card = playerHand[cardIndex]
  const color = colorAfterPlaying(card, namedColor)
  if (!isLegalPlay(card, playerHand, round)) throw new Error('Illegal play')

  const played: Round = {
    ...updateHand(player, hand.remove(cardIndex, playerHand), round),
    discardPile: discard.place(card, round.discardPile),
    currentColor: color,
  }
  const afterEffect = applyEffect(card, player, played)
  // Playing the last card ends the round
  return _.isEmpty(afterEffect.hands[player]) ? { ...afterEffect, playerInTurn: undefined } : afterEffect
}

// The turn passes on unless the drawn card can be played
export function draw(round: Round): Round {
  const player = requirePlayerInTurn(round)
  const [card, dealt] = dealCard(round)
  if (card === undefined) return { ...dealt, playerInTurn: nextPlayer(player, dealt) }
  const withCard = updateHand(player, hand.take(card, dealt.hands[player]), dealt)
  return isLegalPlay(card, withCard.hands[player], withCard)
    ? withCard
    : { ...withCard, playerInTurn: nextPlayer(player, withCard) }
}

export function hasEnded(round: Round): boolean {
  return winner(round) !== undefined
}

export function winner(round: Round): number | undefined {
  const index = _.findIndex(round.hands, _.isEmpty)
  return index === -1 ? undefined : index
}

// The winner gets the value of the cards left in the other players' hands
export function score(round: Round): number | undefined {
  if (!hasEnded(round)) return undefined
  return _.sumBy(round.hands, hand.handScore)
}

function requirePlayerInTurn(round: Round): number {
  if (round.playerInTurn === undefined) throw new Error('The round has ended')
  return round.playerInTurn
}

function isLegalPlay(card: Card, playerHand: PlayerHand, round: Round): boolean {
  switch (card.type) {
    case 'WILD':
      return true
    case 'WILD DRAW':
      // Only allowed when the player has no card matching the current color
      return !hand.containsColor(round.currentColor, playerHand)
    default: {
      if (card.color === round.currentColor) return true
      const top = topOfDiscard(round)
      if (top === undefined) return false
      if (card.type === 'NUMBERED') return top.type === 'NUMBERED' && top.number === card.number
      return top.type === card.type
    }
  }
}

function colorAfterPlaying(card: Card, namedColor: Color | undefined): Color {
  if (isColored(card)) {
    if (namedColor !== undefined) throw new Error('A color can only be named when playing a wild card')
    return card.color
  }
  if (!isColor(namedColor)) throw new Error('A color must be named when playing a wild card')
  return namedColor
}

// Sets whose turn it is, and makes the next player draw when the card says so
function applyEffect(card: Card, player: number, round: Round): Round {
  switch (card.type) {
    case 'SKIP':
      return { ...round, playerInTurn: nextPlayer(player, round, 2) }
    case 'REVERSE': {
      const reversed: Round = { ...round, currentDirection: round.currentDirection === 'clockwise' ? 'counterclockwise' : 'clockwise' }
      // With only two players a reverse card works like a skip card
      return { ...reversed, playerInTurn: nextPlayer(player, reversed, round.playerCount === 2 ? 2 : 1) }
    }
    case 'DRAW':
    case 'WILD DRAW': {
      const victim = nextPlayer(player, round)
      const drawn = drawCards(victim, card.type === 'DRAW' ? 2 : 4, round)
      return { ...drawn, playerInTurn: nextPlayer(victim, drawn) }
    }
    case 'NUMBERED':
    case 'WILD':
      return { ...round, playerInTurn: nextPlayer(player, round) }
  }
}

function nextPlayer(player: number, round: Round, steps = 1): number {
  const offset = round.currentDirection === 'clockwise' ? steps : -steps
  return (((player + offset) % round.playerCount) + round.playerCount) % round.playerCount
}

function updateHand(player: number, newHand: PlayerHand, round: Round): Round {
  return { ...round, hands: _.map(round.hands, (h, i) => (i === player ? newHand : h)) }
}

function drawCards(player: number, count: number, round: Round): Round {
  return _.reduce(_.range(count), r => giveCard(player, r), round)
}

function giveCard(player: number, round: Round): Round {
  const [card, dealt] = dealCard(round)
  return card === undefined ? dealt : updateHand(player, hand.take(card, dealt.hands[player]), dealt)
}

// Deals from the draw pile, replenishing it from the discard pile whenever it runs out
function dealCard(round: Round): [Card | undefined, Round] {
  const before = _.isEmpty(round.drawPile) ? replenishDrawPile(round) : round
  const [card, drawPile] = deck.deal(before.drawPile)
  const after: Round = { ...before, drawPile }
  return [card, _.isEmpty(drawPile) ? replenishDrawPile(after) : after]
}

function replenishDrawPile(round: Round): Round {
  const [cards, discardPile] = discard.takeAllButTop(round.discardPile)
  if (_.isEmpty(cards)) return round
  return { ...round, discardPile, drawPile: deck.shuffle(round.shuffler, deck.add(cards, round.drawPile)) }
}

// A wild card may not start the discard pile: return it to the draw pile, shuffle and try again
function firstDiscard(shuffler: Shuffler<Card>, pile: Deck): [ColoredCard, Deck] {
  const [top, rest] = deck.deal(pile)
  if (top === undefined) throw new Error('Not enough cards to deal')
  if (isColored(top)) return [top, rest]
  return firstDiscard(shuffler, deck.shuffle(shuffler, deck.add([top], rest)))
}
