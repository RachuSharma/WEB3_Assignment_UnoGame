import { createRouter, createWebHistory } from 'vue-router'
import { useGameStore } from '../stores/GameStore'
import SetupView from '../views/SetupView.vue'
import GameView from '../views/GameView.vue'
import ResultView from '../views/ResultView.vue'

// The round lives in memory, so a screen without a matching round returns to setup
export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'setup', component: SetupView },
    {
      path: '/game',
      name: 'game',
      component: GameView,
      beforeEnter: () =>
        useGameStore().status === 'playing' || { name: 'setup' },
    },
    {
      path: '/result',
      name: 'result',
      component: ResultView,
      beforeEnter: () =>
        useGameStore().status === 'finished' || { name: 'setup' },
    },
  ],
})
