import type { Game, GameStore, PendingGame } from './servermodel'

export class MemoryStore implements GameStore {
  private readonly _games = new Map<string, Game>()
  private nextId = 1

  async games() {
    return [...this._games.values()]
  }

  async game(id: string) {
    return this.find(id)
  }

  async add(game: Omit<PendingGame, 'id'>) {
    const added: PendingGame = { ...game, id: String(this.nextId++) }
    this._games.set(added.id, added)
    return added
  }

  async update(id: string, change: (game: Game) => Game) {
    const updated = change(this.find(id))
    this._games.set(id, updated)
    return updated
  }

  private find(id: string): Game {
    const game = this._games.get(id)
    if (game === undefined) throw new Error(`Game ${id} was not found`)
    return game
  }
}
