import {
  startRound,
  UNO_PENALTY,
  type Direction,
  type Round,
} from '../../OOModel_Assignmet1/src/model/round'
import type { Card, Color } from '../../OOModel_Assignmet1/src/model/card'
import type { Shuffler } from '../../OOModel_Assignmet1/src/utils/random_utils'

// One round against 1-3 human opponents
export const MIN_PLAYERS = 2
export const MAX_PLAYERS = 4
const MAX_NAME_LENGTH = 30
const EVENTS_KEPT = 12

type GameInfo = Readonly<{
  id: string
  creator: string
  numberOfPlayers: number
  players: readonly string[]
  // Newest first: what the participants are told about the latest changes
  events: readonly string[]
  // Increases with every change, so clients can ignore outdated notifications
  version: number
}>

export type PendingGame = GameInfo & Readonly<{ pending: true }>
// The Assignment 1 round stays the authority on the rules
export type ActiveGame = GameInfo & Readonly<{ pending: false; round: Round }>
export type Game = PendingGame | ActiveGame

export type PlayerView = {
  id: string
  version: number
  pending: boolean
  numberOfPlayers: number
  players: { name: string; cardCount: number }[]
  hand: Card[]
  playable: number[]
  discardTop: Card | null
  currentColor: Color | null
  direction: Direction | null
  playerInTurn: string | null
  drawPileSize: number
  winner: string | null
  events: readonly string[]
}

export interface GameStore {
  games(): Promise<readonly Game[]>
  game(id: string): Promise<Game>
  add(game: Omit<PendingGame, 'id'>): Promise<PendingGame>
  // Reads and writes in one step, so simultaneous requests cannot overwrite each other
  update(id: string, change: (game: Game) => Game): Promise<Game>
}

export class ServerModel {
  constructor(
    private readonly store: GameStore,
    private readonly shuffler?: Shuffler<Card>,
  ) {}

  async pending_games(): Promise<PendingGame[]> {
    const games = await this.store.games()
    return games.filter((game): game is PendingGame => game.pending)
  }

  game(id: string): Promise<Game> {
    return this.store.game(id)
  }

  async create_game(creator: string, numberOfPlayers: number): Promise<Game> {
    validateName(creator)
    if (
      !Number.isInteger(numberOfPlayers) ||
      numberOfPlayers < MIN_PLAYERS ||
      numberOfPlayers > MAX_PLAYERS
    )
      throw new Error(`A game needs ${MIN_PLAYERS} to ${MAX_PLAYERS} players`)
    return this.store.add({
      creator,
      numberOfPlayers,
      players: [creator],
      events: [`${creator} created the game`],
      version: 1,
      pending: true,
    })
  }

  async join_game(id: string, player: string): Promise<Game> {
    validateName(player)
    return this.store.update(id, (game) => {
      if (!game.pending) throw new Error('The game has already started')
      if (game.players.includes(player))
        throw new Error(`The name ${player} is already taken in this game`)
      const players = [...game.players, player]
      if (players.length < game.numberOfPlayers)
        return changed({ ...game, players }, `${player} joined the game`)
      // The dealer sits before the creator, so the creator normally plays first
      const round = startRound({
        players,
        dealer: players.length - 1,
        shuffler: this.shuffler,
      })
      return changed(
        { ...game, players, pending: false, round },
        `${player} joined the game. The round has started!`,
      )
    })
  }

  play_card(
    id: string,
    player: string,
    cardIndex: number,
    color?: Color,
  ): Promise<Game> {
    return this.act(id, player, ({ round }, index) => {
      requireTurn(round, index)
      if (!round.canPlay(cardIndex))
        throw new Error('That card cannot be played now')
      const card = round.play(cardIndex, color)
      const chosen = color ? ` and chose ${color.toLowerCase()}` : ''
      const won = round.hasEnded() ? ` ${player} won the round!` : ''
      return `${player} played ${describe(card)}${chosen}.${won}`
    })
  }

  draw_card(id: string, player: string): Promise<Game> {
    return this.act(id, player, ({ round }, index) => {
      requireTurn(round, index)
      round.draw()
      // The model keeps the turn when the drawn card can be played
      return round.playerInTurn() === index
        ? `${player} drew a card that can be played`
        : `${player} drew a card`
    })
  }

  say_uno(id: string, player: string): Promise<Game> {
    return this.act(id, player, ({ round }, index) => {
      round.sayUno(index)
      return `${player} said UNO!`
    })
  }

  async catch_uno(
    id: string,
    player: string,
    accused: string,
  ): Promise<{ game: Game; caught: boolean }> {
    let caught = false
    const game = await this.act(id, player, ({ round, players }, index) => {
      const accusedIndex = players.indexOf(accused)
      if (accusedIndex === -1)
        throw new Error(`${accused} is not playing in this game`)
      if (accusedIndex === index) throw new Error('You cannot catch yourself')
      caught = round.catchUnoFailure({ accuser: index, accused: accusedIndex })
      return caught
        ? `${player} caught ${accused} not saying UNO: ${accused} draws ${UNO_PENALTY} cards`
        : undefined
    })
    return { game, caught }
  }

  // Applies a player's action to a running round; no event means nothing changed
  private act(
    id: string,
    player: string,
    action: (game: ActiveGame, index: number) => string | undefined,
  ): Promise<Game> {
    return this.store.update(id, (game) => {
      if (game.pending) throw new Error('The game has not started yet')
      if (game.round.hasEnded()) throw new Error('The round is over')
      const event = action(game, playerIndex(game, player))
      return event === undefined ? game : changed(game, event)
    })
  }
}

// What one participant is allowed to see: their own hand and everyone's card count
export function player_view(game: Game, player: string): PlayerView {
  const index = playerIndex(game, player)
  const shared = {
    id: game.id,
    version: game.version,
    pending: game.pending,
    numberOfPlayers: game.numberOfPlayers,
    events: game.events,
  }
  if (game.pending)
    return {
      ...shared,
      players: game.players.map((name) => ({ name, cardCount: 0 })),
      hand: [],
      playable: [],
      discardTop: null,
      currentColor: null,
      direction: null,
      playerInTurn: null,
      drawPileSize: 0,
      winner: null,
    }
  const { round } = game
  const { currentColor, currentDirection } = round.toMemento()
  const turn = round.playerInTurn()
  const winner = round.winner()
  const hand = round.playerHand(index)
  return {
    ...shared,
    players: game.players.map((name, i) => ({
      name,
      cardCount: round.playerHand(i).length,
    })),
    hand: [...hand],
    playable:
      turn === index ? hand.flatMap((_, i) => (round.canPlay(i) ? [i] : [])) : [],
    discardTop: round.discardPile().top() ?? null,
    currentColor,
    direction: currentDirection,
    playerInTurn: turn === undefined ? null : game.players[turn],
    drawPileSize: round.drawPile().size,
    winner: winner === undefined ? null : game.players[winner],
  }
}

function changed<G extends Game>(game: G, event: string): G {
  return {
    ...game,
    events: [event, ...game.events].slice(0, EVENTS_KEPT),
    version: game.version + 1,
  }
}

function playerIndex(game: Game, player: string): number {
  const index = game.players.indexOf(player)
  if (index === -1) throw new Error(`${player} is not playing in this game`)
  return index
}

function requireTurn(round: Round, index: number) {
  if (round.playerInTurn() !== index) throw new Error('It is not your turn')
}

function validateName(name: string) {
  if (name.length === 0 || name.length > MAX_NAME_LENGTH || name.trim() !== name)
    throw new Error(
      `A name must be 1 to ${MAX_NAME_LENGTH} characters without surrounding spaces`,
    )
}

function describe(card: Card): string {
  switch (card.type) {
    case 'NUMBERED':
      return `${card.color.toLowerCase()} ${card.number}`
    case 'SKIP':
      return `${card.color.toLowerCase()} skip`
    case 'REVERSE':
      return `${card.color.toLowerCase()} reverse`
    case 'DRAW':
      return `${card.color.toLowerCase()} draw two`
    case 'WILD':
      return 'wild'
    case 'WILD DRAW':
      return 'wild draw four'
  }
}
