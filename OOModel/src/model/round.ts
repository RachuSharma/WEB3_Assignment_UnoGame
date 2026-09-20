import { Shuffler, standardShuffler } from '../utils/random_utils'
import { validateIndex } from '../utils/validation'
import { Card, cardFromMemento, CardMemento, Color, isColor, isColored } from './card'
import { createInitialDeck, Deck, StandardDeck } from './deck'
import { DiscardPile, StandardDiscardPile } from './discard_pile'
import { PlayerHand, StandardPlayerHand } from './player_hand'

export const MIN_PLAYERS = 2
export const MAX_PLAYERS = 10
export const UNO_PENALTY = 4

export const directions = ['clockwise', 'counterclockwise'] as const
export type Direction = (typeof directions)[number]

export type RoundEndEvent = Readonly<{ winner: number }>
export type RoundEndListener = (event: RoundEndEvent) => void

export type UnoAccusation = Readonly<{ accuser: number, accused: number }>

// A round is called a "hand" in the rule set
export interface Round {
  readonly playerCount: number
  readonly dealer: number
  player(index: number): string
  playerHand(index: number): ReadonlyArray<Card>
  playerInTurn(): number | undefined
  drawPile(): Deck
  discardPile(): DiscardPile
  canPlay(cardIndex: number): boolean
  canPlayAny(): boolean
  // A color must be named when, and only when, playing a wild card
  play(cardIndex: number, namedColor?: Color): Card
  // The turn passes on unless the drawn card can be played
  draw(): void
  // Protects the player the next time they play down to one card, unless another player acts first
  sayUno(player: number): void
  // Succeeds if the accused played down to one card without saying "UNO!" and nobody has acted since
  catchUnoFailure(accusation: UnoAccusation): boolean
  hasEnded(): boolean
  winner(): number | undefined
  score(): number | undefined
  onEnd(listener: RoundEndListener): void
  toMemento(): RoundMemento
}

export type RoundMemento = {
  players: string[]
  hands: CardMemento[][]
  drawPile: CardMemento[]
  discardPile: CardMemento[]
  currentColor: Color
  currentDirection: Direction
  dealer: number
  playerInTurn: number | undefined
}

export type RoundConfig = {
  players: readonly string[]
  dealer: number
  shuffler?: Shuffler<Card>
  cardsPerPlayer?: number
}

type RoundState = {
  players: readonly string[]
  hands: PlayerHand[]
  drawPile: Deck
  discardPile: DiscardPile
  currentColor: Color
  direction: Direction
  dealer: number
  playerInTurn: number | undefined
  shuffler: Shuffler<Card>
}

export function validatePlayers(players: readonly string[]) {
  if (players.length < MIN_PLAYERS) throw new Error(`At least ${MIN_PLAYERS} players are required`)
  if (players.length > MAX_PLAYERS) throw new Error(`At most ${MAX_PLAYERS} players are allowed`)
}

class StandardRound implements Round {
  private readonly players: readonly string[]
  private readonly hands: PlayerHand[]
  private readonly _drawPile: Deck
  private readonly _discardPile: DiscardPile
  private readonly shuffler: Shuffler<Card>
  private readonly endListeners: RoundEndListener[] = []
  // Players who have said "UNO!" since another player last acted
  private readonly unoSayers = new Set<number>()
  // Played down to one card without saying "UNO!" and can be caught until the next play or draw
  private unoOffender: number | undefined = undefined
  private currentColor: Color
  private direction: Direction
  private turn: number | undefined
  readonly dealer: number

  private constructor(state: RoundState) {
    this.players = [...state.players]
    this.hands = state.hands
    this._drawPile = state.drawPile
    this._discardPile = state.discardPile
    this.currentColor = state.currentColor
    this.direction = state.direction
    this.dealer = state.dealer
    this.turn = state.playerInTurn
    this.shuffler = state.shuffler
  }

  static start({ players, dealer, shuffler = standardShuffler, cardsPerPlayer = 7 }: RoundConfig): StandardRound {
    validatePlayers(players)
    if (!Number.isInteger(dealer) || dealer < 0) throw new Error(`Invalid dealer: ${dealer}`)
    if (!Number.isInteger(cardsPerPlayer) || cardsPerPlayer < 1) throw new Error(`Invalid cards per player: ${cardsPerPlayer}`)

    const drawPile = createInitialDeck()
    if (players.length * cardsPerPlayer >= drawPile.size) throw new Error('Not enough cards to deal')
    drawPile.shuffle(shuffler)

    const hands = players.map(() => {
      const hand = new StandardPlayerHand()
      for (let i = 0; i < cardsPerPlayer; i++) hand.take(drawPile.deal()!)
      return hand
    })

    // A wild card may not start the discard pile: return it to the draw pile, shuffle and try again
    let top = drawPile.deal()!
    while (!isColored(top)) {
      drawPile.add([top])
      drawPile.shuffle(shuffler)
      top = drawPile.deal()!
    }

    const round = new StandardRound({
      players,
      hands,
      drawPile,
      discardPile: new StandardDiscardPile([top]),
      currentColor: top.color,
      direction: 'clockwise',
      // A dealer index beyond the player count wraps around the table
      dealer: dealer % players.length,
      playerInTurn: undefined,
      shuffler,
    })
    // The first card takes effect as if the dealer had played it
    round.turn = round.applyEffect(top, round.dealer)
    return round
  }

  static fromMemento(memento: RoundMemento, shuffler: Shuffler<Card>): StandardRound {
    const { players, currentColor, currentDirection, dealer, playerInTurn } = memento
    validatePlayers(players)
    if (memento.hands.length !== players.length) throw new Error('There must be exactly one hand per player')

    const hands = memento.hands.map(cards => new StandardPlayerHand(cards.map(card => cardFromMemento(card))))
    const winnerCount = hands.filter(hand => hand.isEmpty).length
    if (winnerCount > 1) throw new Error('A round cannot have more than one winner')

    const discardPile = new StandardDiscardPile(memento.discardPile.map(card => cardFromMemento(card)))
    const top = discardPile.top()
    if (top === undefined) throw new Error('The discard pile cannot be empty')
    if (!isColor(currentColor)) throw new Error(`Invalid current color: ${currentColor}`)
    if (isColored(top) && top.color !== currentColor) throw new Error('The current color must match the top of the discard pile')
    if (!directions.includes(currentDirection)) throw new Error(`Invalid direction: ${currentDirection}`)
    validateIndex(dealer, players.length, 'dealer')

    const hasEnded = winnerCount === 1
    if (!hasEnded) validateIndex(playerInTurn, players.length, 'player in turn')

    return new StandardRound({
      players,
      hands,
      drawPile: new StandardDeck(memento.drawPile.map(card => cardFromMemento(card))),
      discardPile,
      currentColor,
      direction: currentDirection,
      dealer,
      playerInTurn: hasEnded ? undefined : playerInTurn,
      shuffler,
    })
  }

  get playerCount(): number {
    return this.players.length
  }

  player(index: number): string {
    validateIndex(index, this.playerCount, 'player index')
    return this.players[index]
  }

  playerHand(index: number): ReadonlyArray<Card> {
    validateIndex(index, this.playerCount, 'player index')
    return this.hands[index].cards
  }

  playerInTurn(): number | undefined {
    return this.turn
  }

  drawPile(): Deck {
    return this._drawPile
  }

  discardPile(): DiscardPile {
    return this._discardPile
  }

  canPlay(cardIndex: number): boolean {
    if (this.turn === undefined) return false
    const hand = this.hands[this.turn]
    const card = hand.cardAt(cardIndex)
    return card !== undefined && this.isLegalPlay(card, hand)
  }

  canPlayAny(): boolean {
    if (this.turn === undefined) return false
    return this.hands[this.turn].cards.some((_, index) => this.canPlay(index))
  }

  play(cardIndex: number, namedColor?: Color): Card {
    const player = this.requirePlayerInTurn()
    const hand = this.hands[player]
    const card = hand.cardAt(cardIndex)
    if (card === undefined) throw new Error(`Player ${player} has no card at index ${cardIndex}`)
    const color = this.colorAfterPlaying(card, namedColor)
    if (!this.isLegalPlay(card, hand)) throw new Error('Illegal play')

    this.beginAction(player)
    hand.remove(cardIndex)
    this._discardPile.place(card)
    this.currentColor = color
    this.turn = this.applyEffect(card, player)
    if (hand.size === 1) this.checkUnoSaid(player)
    if (hand.isEmpty) this.end(player)
    return card
  }

  draw(): void {
    const player = this.requirePlayerInTurn()
    this.beginAction(player)
    const hand = this.hands[player]
    const card = this.dealCard()
    if (card !== undefined) hand.take(card)
    if (card === undefined || !this.isLegalPlay(card, hand)) {
      this.turn = this.nextPlayer(player)
    }
  }

  sayUno(player: number): void {
    validateIndex(player, this.playerCount, 'player index')
    this.requirePlayerInTurn()
    if (this.unoOffender === player) this.unoOffender = undefined
    else this.unoSayers.add(player)
  }

  catchUnoFailure({ accuser, accused }: UnoAccusation): boolean {
    validateIndex(accuser, this.playerCount, 'accuser')
    validateIndex(accused, this.playerCount, 'accused')
    this.requirePlayerInTurn()
    if (this.unoOffender !== accused) return false
    this.unoOffender = undefined
    this.drawCards(accused, UNO_PENALTY)
    return true
  }

  hasEnded(): boolean {
    return this.winner() !== undefined
  }

  winner(): number | undefined {
    const index = this.hands.findIndex(hand => hand.isEmpty)
    return index === -1 ? undefined : index
  }

  score(): number | undefined {
    if (!this.hasEnded()) return undefined
    return this.hands.reduce((sum, hand) => sum + hand.score(), 0)
  }

  onEnd(listener: RoundEndListener): void {
    this.endListeners.push(listener)
  }

  toMemento(): RoundMemento {
    return {
      players: [...this.players],
      hands: this.hands.map(hand => hand.toMemento()),
      drawPile: this._drawPile.toMemento(),
      discardPile: this._discardPile.toMemento(),
      currentColor: this.currentColor,
      currentDirection: this.direction,
      dealer: this.dealer,
      playerInTurn: this.turn,
    }
  }

  private requirePlayerInTurn(): number {
    if (this.turn === undefined) throw new Error('The round has ended')
    return this.turn
  }

  // A play or draw ends the chance to catch the previous offender and voids the "UNO!" of every other player
  private beginAction(player: number) {
    this.unoOffender = undefined
    const hasSaidUno = this.unoSayers.has(player)
    this.unoSayers.clear()
    if (hasSaidUno) this.unoSayers.add(player)
  }

  private checkUnoSaid(player: number) {
    if (this.unoSayers.has(player)) this.unoSayers.delete(player)
    else this.unoOffender = player
  }

  private isLegalPlay(card: Card, hand: PlayerHand): boolean {
    switch (card.type) {
      case 'WILD':
        return true
      case 'WILD DRAW':
        // Only allowed when the player has no card matching the current color
        return !hand.containsColor(this.currentColor)
      default: {
        if (card.color === this.currentColor) return true
        const top = this._discardPile.top()
        if (top === undefined) return false
        if (card.type === 'NUMBERED') return top.type === 'NUMBERED' && top.number === card.number
        return top.type === card.type
      }
    }
  }

  private colorAfterPlaying(card: Card, namedColor: Color | undefined): Color {
    if (isColored(card)) {
      if (namedColor !== undefined) throw new Error('A color can only be named when playing a wild card')
      return card.color
    }
    if (!isColor(namedColor)) throw new Error('A color must be named when playing a wild card')
    return namedColor
  }

  // Returns the next player in turn
  private applyEffect(card: Card, player: number): number {
    switch (card.type) {
      case 'SKIP':
        return this.nextPlayer(player, 2)
      case 'REVERSE':
        this.direction = this.direction === 'clockwise' ? 'counterclockwise' : 'clockwise'
        // With only two players a reverse card works like a skip card
        return this.nextPlayer(player, this.playerCount === 2 ? 2 : 1)
      case 'DRAW':
      case 'WILD DRAW': {
        const victim = this.nextPlayer(player)
        this.drawCards(victim, card.type === 'DRAW' ? 2 : 4)
        return this.nextPlayer(victim)
      }
      case 'NUMBERED':
      case 'WILD':
        return this.nextPlayer(player)
    }
  }

  private nextPlayer(player: number, steps = 1): number {
    const offset = this.direction === 'clockwise' ? steps : -steps
    return (((player + offset) % this.playerCount) + this.playerCount) % this.playerCount
  }

  private drawCards(player: number, count: number) {
    for (let i = 0; i < count; i++) {
      const card = this.dealCard()
      if (card === undefined) return
      this.hands[player].take(card)
    }
  }

  // Deals from the draw pile, replenishing it from the discard pile whenever it runs out
  private dealCard(): Card | undefined {
    if (this._drawPile.size === 0) this.replenishDrawPile()
    const card = this._drawPile.deal()
    if (this._drawPile.size === 0) this.replenishDrawPile()
    return card
  }

  private replenishDrawPile() {
    const cards = this._discardPile.takeAllButTop()
    if (cards.length === 0) return
    this._drawPile.add(cards)
    this._drawPile.shuffle(this.shuffler)
  }

  private end(winner: number) {
    this.turn = undefined
    this.endListeners.forEach(listener => listener({ winner }))
  }
}

export function startRound(config: RoundConfig): Round {
  return StandardRound.start(config)
}

export function roundFromMemento(memento: RoundMemento, shuffler: Shuffler<Card> = standardShuffler): Round {
  return StandardRound.fromMemento(memento, shuffler)
}
