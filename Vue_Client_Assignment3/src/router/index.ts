import { createRouter, createWebHistory } from 'vue-router'
import SetupView from '../views/SetupView.vue'
import GameView from '../views/GameView.vue'

// The game and player are part of the address, so a refreshed page asks the server again
export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'setup', component: SetupView },
    {
      path: '/game/:id/:player',
      name: 'game',
      component: GameView,
      props: true,
    },
  ],
})
