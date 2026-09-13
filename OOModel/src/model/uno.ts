import { Randomizer, Shuffler, standardRandomizer, standardShuffler } from '../utils/random_utils'
import { validateIndex } from '../utils/validation'
import { Card } from './card'
import { Round, RoundMemento, roundFromMemento, startRound, validatePlayers } from './round'

export const DEFAULT_PLAYERS: readonly string[] = ['A', 'B']
export const DEFAULT_TARGET_SCORE = 500
export const DEFAULT_CARDS_PER_PLAYER = 7

export interface Game {
  readonly playerCount: number
  readonly targetScore: number
  player(index: number): string
  score(playerIndex: number): number
  winner(): number | undefined
  currentRound(): Round | undefined
  toMemento(): GameMemento
}

export type GameMemento = {
  players: string[]
  targetScore: number
  scores: number[]
  cardsPerPlayer: number
  // Only present while the game is running
  currentRound?: RoundMemento
}

export type GameConfig = {
  players: readonly string[]
  targetScore: number
  randomizer: Randomizer
  shuffler: Shuffler<Card>
  cardsPerPlayer: number
}

type GameState = {
  players: readonly string[]
  targetScore: number
  scores: number[]
  cardsPerPlayer: number
  randomizer: Randomizer
  shuffler: Shuffler<Card>
}

function validateTargetScore(targetScore: number) {
  if (!Number.isInteger(targetScore) || targetScore <= 0) throw new Error(`Invalid target score: ${targetScore}`)
}

class StandardGame implements Game {
  private readonly players: readonly string[]
  private readonly scores: number[]
  private readonly cardsPerPlayer: number
  private readonly randomizer: Randomizer
  private readonly shuffler: Shuffler<Card>
  private round: Round | undefined = undefined
  readonly targetScore: number

  private constructor(state: GameState) {
    this.players = [...state.players]
    this.targetScore = state.targetScore
    this.scores = state.scores
    this.cardsPerPlayer = state.cardsPerPlayer
    this.randomizer = state.randomizer
    this.shuffler = state.shuffler
  }

  static start({
    players = DEFAULT_PLAYERS,
    targetScore = DEFAULT_TARGET_SCORE,
    randomizer = standardRandomizer,
    shuffler = standardShuffler,
    cardsPerPlayer = DEFAULT_CARDS_PER_PLAYER,
  }: Partial<GameConfig>): StandardGame {
    validatePlayers(players)
    validateTargetScore(targetScore)
    const game = new StandardGame({ players, targetScore, scores: players.map(() => 0), cardsPerPlayer, randomizer, shuffler })
    game.startNewRound()
    return game
  }

  static fromMemento(memento: GameMemento, randomizer: Randomizer, shuffler: Shuffler<Card>): StandardGame {
    const { players, targetScore, scores, cardsPerPlayer, currentRound } = memento
    validatePlayers(players)
    validateTargetScore(targetScore)
    if (scores.length !== players.length) throw new Error('There must be exactly one score per player')
    if (scores.some(score => !Number.isInteger(score) || score < 0)) throw new Error('Scores must be non-negative integers')
    if (!Number.isInteger(cardsPerPlayer) || cardsPerPlayer < 1) throw new Error(`Invalid cards per player: ${cardsPerPlayer}`)
    const winnerCount = scores.filter(score => score >= targetScore).length
    if (winnerCount > 1) throw new Error('A game cannot have more than one winner')

    const game = new StandardGame({ players, targetScore, scores: [...scores], cardsPerPlayer, randomizer, shuffler })
    if (winnerCount === 1) {
      if (currentRound !== undefined) throw new Error('A finished game cannot have a current round')
      return game
    }

    if (currentRound === undefined) throw new Error('An unfinished game must have a current round')
    const round = roundFromMemento(currentRound, shuffler)
    if (round.playerCount !== players.length || players.some((name, index) => round.player(index) !== name)) {
      throw new Error('The current round must have the same players as the game')
    }
    if (round.hasEnded()) throw new Error('The current round has already ended')
    game.playRound(round)
    return game
  }

  get playerCount(): number {
    return this.players.length
  }

  player(index: number): string {
    validateIndex(index, this.playerCount, 'player index')
    return this.players[index]
  }

  score(playerIndex: number): number {
    validateIndex(playerIndex, this.playerCount, 'player index')
    return this.scores[playerIndex]
  }

  winner(): number | undefined {
    const index = this.scores.findIndex(score => score >= this.targetScore)
    return index === -1 ? undefined : index
  }

  currentRound(): Round | undefined {
    return this.round
  }

  toMemento(): GameMemento {
    return {
      players: [...this.players],
      targetScore: this.targetScore,
      scores: [...this.scores],
      cardsPerPlayer: this.cardsPerPlayer,
      currentRound: this.round?.toMemento(),
    }
  }

  private startNewRound() {
    this.playRound(startRound({
      players: this.players,
      dealer: this.randomizer(this.playerCount),
      shuffler: this.shuffler,
      cardsPerPlayer: this.cardsPerPlayer,
    }))
  }

  private playRound(round: Round) {
    this.round = round
    round.onEnd(({ winner }) => this.endRound(round, winner))
  }

  private endRound(round: Round, winner: number) {
    this.scores[winner] += round.score() ?? 0
    if (this.winner() === undefined) {
      this.startNewRound()
    } else {
      this.round = undefined
    }
  }
}

export function startGame(config: Partial<GameConfig> = {}): Game {
  return StandardGame.start(config)
}

export function gameFromMemento(
  memento: GameMemento,
  randomizer: Randomizer = standardRandomizer,
  shuffler: Shuffler<Card> = standardShuffler
): Game {
  return StandardGame.fromMemento(memento, randomizer, shuffler)
}
