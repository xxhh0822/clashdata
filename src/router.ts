import { createRouter, createWebHistory } from 'vue-router';
import HomeView from './views/HomeView.vue';

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/search', name: 'search', component: HomeView },
    { path: '/:base/:category', name: 'list', component: HomeView },
    { path: '/:base/:category/:id', name: 'detail', component: HomeView },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});
