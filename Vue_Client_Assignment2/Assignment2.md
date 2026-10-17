# Assignment 2: implementation and explanation

## Learning preference

Finish the assignment while giving short explanations as work progresses. Do not interrupt implementation with quizzes or comprehension questions. Keep these notes available for exam revision afterwards.

## Requirements covered

- Browser-only Vue application with one human and 1-3 bots.
- One round using the existing Assignment 1 rules.
- A separate Web Worker per bot; application communication uses postMessage and onmessage only.
- Setup, playing, and results screens.
- Bots sometimes forget UNO and sometimes catch another player's missed UNO.
- Consistent Composition API with TypeScript.
- Optional full matches and between-round scoring are not implemented.

## 1. Model: Assignment 1

OOModel_Assignmet1 remains the rules authority. Round.canPlay checks legality; play and draw apply effects; sayUno and catchUnoFailure manage the UNO window and four-card penalty; winner and score provide results. We reuse this implementation rather than duplicating rules in components or workers. Assignment 2 follows this model's drawing and opening-card behaviour.

## 2. View model: src/game/useUnoGame.ts

A composable is a function that groups Vue reactive state and related behaviour. useUnoGame owns one live Round instance. It exports screen state and actions to App.vue. After each model action it replaces a plain snapshot stored in shallowRef. Vue notices that replacement and renders the current state. The snapshot is derived display data; the live model remains authoritative.

computed derives the human hand, whose turn it is, and playable indices. We avoid separately maintaining copied turn names, card counts, and colours. This prevents inconsistent display values. ref holds UI choices such as an unfinished wild-card selection and whether the user has armed UNO.

A single root-owned composable is sufficient for this small application. Pinia would help if many independent pages needed access to the same state; the course presents both approaches. Screen changes use conditional components, also demonstrated in the Components slides. There is no server or URL-addressable saved game.

## 3. Views and reusable components

App.vue chooses the active screen and connects component events to composable actions. GameSetup.vue owns the form fields. v-model binds input values; computed validates the trimmed name; submit.prevent handles the form without reloading the page. It emits a typed Setup value to its parent.

GameTable.vue receives the current state through props and emits user intentions: play, draw, UNO, catch, and colour choice. UnoCard.vue renders a single card, deriving its label and colour from its prop. GameResult.vue displays the winner, round score, and remaining hand values. This follows props down, events up. Components do not mutate the model themselves.

The colour chooser uses ordinary accessible buttons rather than window.prompt. Disabled cards communicate legality. Labels, headings, text equivalents for colours and symbols, keyboard focus, and status messages support accessibility. CSS adapts to mobile widths and has no required external assets.

## 4. Worker boundary

bot.worker.ts runs separately from the UI thread. Each worker receives plain data: its own hand, legal move indices, a public missed-UNO indicator, phase, and request ID. It never receives opponents' hands or the draw-pile order. It returns a decision rather than changing the real game.

The strategy picks a legal index, chooses a wild colour favouring its remaining hand, and says UNO with probability 0.8 when playing from two cards. In the observe phase it attempts a catch with probability 0.55. The live model checks and applies returned actions. Strategy quality can improve without changing the UI or the UNO rules.

Worker(new URL(..., import.meta.url), { type: 'module' }) lets Vite bundle the worker separately. postMessage sends data; onmessage receives responses. Neither side shares a Round instance or Vue refs. The typed message protocol is the boundary we can adapt later when Assignment 3 is supplied; its requirements are not yet known.

## 5. Async safety and lifecycle

A 1.4-second pause makes bot actions readable and gives the human a catch window. Workers can observe a missed UNO even when it is the human's turn. Model actions end the catch window according to the existing rules.

Request IDs match responses to requests. A generation counter rejects responses from a previous game; a state version prevents a decision based on an outdated hand from being applied. Restarting, finishing, or disposing the component terminates workers and clears timers. Errors and five-second response timeouts stop play with a visible recovery action.

## 6. TypeScript compatibility

The existing model was written without noUncheckedIndexedAccess or verbatimModuleSyntax. The client aligns these two options with the model while keeping strict checking. This avoids modifying Assignment 1 just to satisfy defaults from the newer Vue template. New client code uses explicit type imports and checks optional values.

## 7. Verification

npm run build performs vue-tsc type checking and a production build, including a separate worker artifact. Jest checks 300 reproducible complete rounds, legal bot choices, card conservation, wild colours, optional UNO actions, and the four-card penalty/catch window. Check the real browser UI and workers manually, including round completion, mobile width, and restarting. See the README for commands and final validation results.

## References

- Teacher: WEB3 Assignment 2; MVVM and Components slides.
- https://vuejs.org/guide/essentials/reactivity-fundamentals.html
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
- https://vite.dev/guide/features.html#web-workers
