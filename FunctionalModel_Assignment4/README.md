# UNO - Assignment 4: functional model

The UNO rules from Assignment 1 (`../OOModel_Assignmet1`) converted to functional style: immutable types and pure functions, using lodash.

## Run

Use Node 22.18+ or 24.12+.

```powershell
Set-Location 'FunctionalModel_Assignment4'
npm install
npm test
npm run type-check
```

## Requirements covered (must have)

- **As functional as possible.** There are no classes and nothing is changed in place. Data is plain values, and behaviour is functions that take a value and return a new one. The data comes last in every function (`play(cardIndex, color, round)`), so functions compose with lodash's `_.flow` and `_.partial`, as the teacher's tests do.
- **Immutable types corresponding to Assignment 1.** Every type is `Readonly`, and every list is a `readonly` array:

  | Assignment 1 (object-oriented) | Assignment 4 (functional) |
  |---|---|
  | `Card` types in `card.ts` | The same card types, read-only, with `numberedCard`, `actionCard` and `wildCard` constructors |
  | `Deck` / `StandardDeck` class | `Deck = readonly Card[]`, with `createInitialDeck`, `shuffle`, `deal` and `add` |
  | `DiscardPile` / `StandardDiscardPile` class | `DiscardPile = readonly Card[]`, with `top`, `place` and `takeAllButTop` |
  | `PlayerHand` / `StandardPlayerHand` class | `PlayerHand = readonly Card[]`, with `take`, `remove`, `containsColor` and `handScore` |
  | `Round` / `StandardRound` class | `Round`, a read-only record, with `createRound`, `canPlay`, `canPlayAny`, `play`, `draw`, `topOfDiscard`, `hasEnded`, `winner` and `score` |

- **Functions that follow the UNO rules.** Dealing; reshuffling when the first discard is a wild card; the first card's effect; matching colour, number or type; Skip, Reverse (a Skip with two players), Draw Two and Wild Draw Four (only without a card of the current colour); choosing a colour for wild cards; keeping the turn after drawing a playable card; refilling the draw pile from the discard pile; ending the round; and scoring.
- **lodash** is used for list work: `flatMap`, `times`, `chunk`, `take`, `drop`, `head`, `tail`, `filter`, `some`, `sumBy`, `findIndex`, `reduce`, `range` and `inRange`.
- **Pure functions.** Functions never change their arguments and depend only on them. Randomness comes in only through the shuffler given to `createRound`, as in Assignment 1. With a fixed shuffler, the same arguments always give the same round. Illegal actions throw an error, which is what the teacher's tests expect. `__test__/model/purity.test.ts` checks this: it freezes every round while playing whole rounds, so any change would throw, and it repeats every move to check the result is the same.

## Not implemented (optional)

- Should have: functions for saying "UNO" and catching a missed "UNO".
- Could have: an immutable type for a full game of UNO, and making the whole test suite pass.

## Tests

`__test__` contains the teacher's functional test suite for the rules that are implemented: the deck, setting up a round, legal plays, playing and drawing, ending the round, and scoring (138 tests), plus the purity test. The teacher allows changing the tests, so two parts are left out because they test optional features: the tests of saying and catching "UNO" (should have), and `uno.test.ts` with `createGame` (could have).

## Structure

- `src/model/card.ts`: card types, constructors, predicates and card scores.
- `src/model/deck.ts`: the 108-card deck and draw pile functions.
- `src/model/discard_pile.ts`: discard pile functions.
- `src/model/player_hand.ts`: hand functions.
- `src/model/round.ts`: the round type and the rules of play.
- `src/utils/random_utils.ts`: the teacher's shuffler, which returns a new array.
