import { createRouter, createWebHistory } from 'vue-router'
import LobbyView from '../views/LobbyView.vue'
import GameView from '../views/GameView.vue'

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'lobby', component: LobbyView },
    {
      path: '/game/:id/:player',
      name: 'game',
      component: GameView,
      props: true,
    },
  ],
})
