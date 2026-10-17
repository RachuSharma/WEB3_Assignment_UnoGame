import { createRouter, createWebHistory } from 'vue-router'
import { useGameStore } from '../stores/GameStore'
import SetupView from '../views/SetupView.vue'
import GameView from '../views/GameView.vue'

// Without a game in the store, for example after a page refresh, return to setup
export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'setup', component: SetupView },
    {
      path: '/game',
      name: 'game',
      component: GameView,
      beforeEnter: () => useGameStore().status !== 'setup' || { name: 'setup' },
    },
  ],
})
