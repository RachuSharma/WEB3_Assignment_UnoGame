import { Card, Color, Deck, createDeck, createInitialDeck } from './deck'
import { Hand, createHand } from './player-hand'
import { Shuffler } from '../utils/random_utils'

export interface Round {
  readonly playerCount: number
  readonly dealer: number

  player(index: number): string
  playerHand(index: number): readonly Card[]
  playerInTurn(): number | undefined

  drawPile(): Deck
  discardPile(): Deck

  canPlay(cardIndex: number): boolean
  play(cardIndex: number, chosenColor?: Color): Card

  canPlayAny(): boolean
  draw(): Card | undefined

  hasEnded(): boolean
  winner(): number | undefined

  sayUno(player: number): void

  catchUnoFailure(props: {
    accuser: number
    accused: number
  }): boolean
}

export type RoundConfig = {
  players: string[]
  dealer: number
  shuffler: Shuffler<Card>
  cardsPerPlayer?: number
}


// Create Round 

export const createRound = ({
  players,
  dealer,
  shuffler,
  cardsPerPlayer = 7
}: RoundConfig): Round => {

// validate round setup

  if (players.length < 2 || players.length > 10) {
    throw new Error('A round requires between 2 and 10 players')
  }

  if (dealer < 0 || dealer >= players.length) {
    throw new Error('Dealer index is out of bounds')
  }

  // create and shuffle draw pile
  const drawPile = createInitialDeck()
  drawPile.shuffle(shuffler)

  // creates one empty hand for every player.
  const hands: Hand[] = players.map(() => createHand())

  for (const hand of hands) {
    for (let i = 0; i < cardsPerPlayer; i++) {
      const card = drawPile.deal()

      if (card !== undefined) {
        hand.add(card)
      }
    }
  }

  // Create the first discard card
  let firstDiscard = drawPile.deal()

  // The player left of the dealer starts unless a special card changes the setup.
  while (
    firstDiscard?.type === 'WILD' ||
    firstDiscard?.type === 'WILD DRAW'
  ) {
    drawPile.add(firstDiscard)
    drawPile.shuffle(shuffler)
    firstDiscard = drawPile.deal()
  }


  // Create the discard pile
  const discardPile = firstDiscard === undefined
    ? createDeck([])
    : createDeck([firstDiscard])

  let currentPlayer = (dealer + 1) % players.length

  let direction = 1

  let currentColor =
    firstDiscard !== undefined && 'color' in firstDiscard
      ? firstDiscard.color
      : undefined


// Apply first discard special-card effect
  if (firstDiscard?.type === 'SKIP') {
    currentPlayer = (currentPlayer + 1) % players.length
  }

  if (firstDiscard?.type === 'REVERSE') {
    direction = -1
    currentPlayer = (dealer - 1 + players.length) % players.length
  }

  if (firstDiscard?.type === 'DRAW') {
    for (let i = 0; i < 2; i++) {
      const card = drawPile.deal()

      if (card !== undefined) {
        hands[currentPlayer].add(card)
      }
    }

    currentPlayer = (currentPlayer + 1) % players.length
  }

  // helper function 

  const nextPlayer = (steps = 1): number => {
    return (
      currentPlayer +
      direction * steps +
      players.length * steps
    ) % players.length
  }

  const refillDrawPile = (): void => {
    if (drawPile.size > 0 || discardPile.size <= 1) {
      return
    }

    const topCard = discardPile.deal()

    let card = discardPile.deal()

    while (card !== undefined) {
      drawPile.add(card)
      card = discardPile.deal()
    }

    if (topCard !== undefined) {
      discardPile.add(topCard)
    }

    drawPile.shuffle(shuffler)
  }

  // ROUND STATE

  // winner of the round
  let winningPlayer: number | undefined = undefined

  // UNO state
  let unoPlayer: number | undefined = undefined
  let unoSaid = false
  let drawnCardForTurn: Card | undefined = undefined

  const drawCard = (): Card | undefined => {
    if (drawPile.size === 0) {
      refillDrawPile()
    }

    const card = drawPile.deal()

    if (drawPile.size === 0) {
      refillDrawPile()
    }

    return card
  }


   // Check whether a card can be played on the current discard
  const isPlayable = (card: Card): boolean => {
    const topCard = discardPile.top()

    if (topCard === undefined) {
      return true
    }

    if (card.type === 'WILD') {
      return true 
    }

    if (card.type === 'WILD DRAW') {
      if (currentColor === undefined) {
        return true
      }

      const currentHand = hands[currentPlayer].cards()

      const hasMatchingColor = currentHand.some(
        handCard =>
          'color' in handCard &&
          handCard.color === currentColor
      )

      return !hasMatchingColor
    }

    if (
      'color' in card &&
      currentColor !== undefined &&
      card.color === currentColor
    ) {
      return true
    }

    if (
      card.type === 'NUMBERED' &&
      topCard.type === 'NUMBERED' &&
      card.number === topCard.number
    ) {
      return true
    }

    if (card.type === topCard.type) {
      return true
    }

    return false
  }

  // Round Implementation

  return {

    get playerCount() {
      return players.length
    },

    get dealer() {
      return dealer
    },

    player: index => {
      if (index < 0 || index >= players.length) {
        throw new Error('Player index is out of bounds')
      }

      return players[index]
    },

    playerHand: index => {
      if (index < 0 || index >= players.length) {
        throw new Error('Player index is out of bounds')
      }

      return hands[index].cards()
    },

    playerInTurn: () =>
      winningPlayer === undefined
        ? currentPlayer
        : undefined,

    drawPile: () => drawPile,

    discardPile: () => discardPile,

    canPlay: cardIndex => {
      if (winningPlayer !== undefined) {
        return false
      }

      const hand = hands[currentPlayer]
      const cards = hand.cards()

      if (cardIndex < 0 || cardIndex >= cards.length) {
        throw new Error('Card index is out of bounds')
      }

      if (
        drawnCardForTurn !== undefined &&
        cards[cardIndex] !== drawnCardForTurn
      ) {
        throw new Error('Only the drawn card can be played')
      }

      return isPlayable(cards[cardIndex])
    },


    // Check whether the player in turn can play any card
    canPlayAny: () => {
      if (winningPlayer !== undefined) {
        return false
      }

      return hands[currentPlayer]
        .cards()
        .some(card =>
          (drawnCardForTurn === undefined || card === drawnCardForTurn) &&
          isPlayable(card)
        )
    },

    // Play a card from the player in turn's hand
    play: (cardIndex, chosenColor) => {
      if (winningPlayer !== undefined) {
        throw new Error('The round has ended')
      }

      const hand = hands[currentPlayer]
      const cards = hand.cards()

      if (cardIndex < 0 || cardIndex >= cards.length) {
        throw new Error('Card index is out of bounds')
      }

      const card = cards[cardIndex]

      if (
        drawnCardForTurn !== undefined &&
        card !== drawnCardForTurn
      ) {
        throw new Error('Only the drawn card can be played')
      }

      if (!isPlayable(card)) {
        throw new Error('Card cannot be played')
      }

      const isWild =
        card.type === 'WILD' ||
        card.type === 'WILD DRAW'

      if (isWild && chosenColor === undefined) {
        throw new Error('A color must be chosen for a wild card')
      }

      if (!isWild && chosenColor !== undefined) {
        throw new Error('A color can only be chosen for a wild card')
      }

      hand.remove(card)
      drawnCardForTurn = undefined

      discardPile.add(card)

      if (hand.size === 1) {
        if (unoPlayer !== currentPlayer) {
          unoPlayer = currentPlayer
          unoSaid = false
        }
      } else {
        unoPlayer = undefined
        unoSaid = false
      }

      if (hand.size === 0) {
        winningPlayer = currentPlayer
      }

      if ('color' in card) {
        currentColor = card.color
      } else if (chosenColor !== undefined) {
        currentColor = chosenColor
      }

      if (card.type === 'SKIP') {
        currentPlayer = nextPlayer(2)
        return card
      }

      if (card.type === 'REVERSE') {
        direction = direction * -1

        currentPlayer = players.length === 2
          ? nextPlayer(2)
          : nextPlayer()

        return card
      }

      if (card.type === 'DRAW') {
        const next = nextPlayer()

        for (let i = 0; i < 2; i++) {
          const drawnCard = drawCard()

          if (drawnCard !== undefined) {
            hands[next].add(drawnCard)
          }
        }

        currentPlayer = nextPlayer(2)
        return card
      }

      if (card.type === 'WILD DRAW') {
        const next = nextPlayer()

        for (let i = 0; i < 4; i++) {
          const drawnCard = drawCard()

          if (drawnCard !== undefined) {
            hands[next].add(drawnCard)
          }
        }

        currentPlayer = nextPlayer(2)
        return card
      }

      currentPlayer = nextPlayer()
      return card
    },



    // Draw a card for the player in turn
    draw: () => {
      if (winningPlayer !== undefined) {
        throw new Error('The round has ended')
      }

      if (
        unoPlayer !== undefined &&
        unoPlayer !== currentPlayer
      ) {
        unoPlayer = undefined
        unoSaid = false
      }

      const card = drawCard()

      if (card === undefined) {
        return undefined
      }

      hands[currentPlayer].add(card)
      drawnCardForTurn = card

      if (unoPlayer === currentPlayer) {
        unoPlayer = undefined
        unoSaid = false
      }

      if (!isPlayable(card)) {
        drawnCardForTurn = undefined
        currentPlayer = nextPlayer()
      }

      return card
    },


    // Say UNO
    sayUno: player => {
      if (winningPlayer !== undefined) {
        throw new Error('The round has ended')
      }

      if (player < 0 || player >= players.length) {
        throw new Error('Player index is out of bounds')
      }

      if (player !== currentPlayer) {
        throw new Error('Only the player in turn can say UNO')
      }

      if (hands[player].size !== 2) {
        throw new Error('UNO can only be said before playing the penultimate card')
      }

      unoPlayer = player
      unoSaid = true
    },



    // Catch a UNO failure
    catchUnoFailure: ({ accuser, accused }) => {
      if (winningPlayer !== undefined) {
        return false
      }

      if (
        accuser < 0 ||
        accuser >= players.length ||
        accused < 0 ||
        accused >= players.length
      ) {
        throw new Error('Player index is out of bounds')
      }

      if (accuser === accused) {
        return false
      }

      if (
        unoPlayer !== accused ||
        unoSaid ||
        hands[accused].size !== 1
      ) {
        return false
      }

      for (let i = 0; i < 4; i++) {
        const card = drawCard()

        if (card !== undefined) {
          hands[accused].add(card)
        }
      }

      unoPlayer = undefined
      unoSaid = false

      return true
    },

    // Check if the round has ended
    hasEnded: () => winningPlayer !== undefined,

    winner: () => winningPlayer
  }
}