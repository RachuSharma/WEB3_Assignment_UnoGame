import { Card } from './deck'

export interface Hand {
  readonly size: number
  cards(): readonly Card[]
  add(card: Card): void
  remove(card: Card): Card | undefined
}

export const createHand = (initialCards: Card[] = []): Hand => {
    const handCards = [...initialCards]

    return {
        get size() {
            return handCards.length 
        }, 

        cards: () => [...handCards],

        add: (card) => {
            handCards.push(card)
        },

        remove: (card) => {
            const index = handCards.indexOf(card)

            if (index === -1) {
                return undefined
            }

            return handCards.splice(index, 1)[0]
        }
    }
}


