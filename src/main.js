import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import HomePage from './components/HomePage.vue';
import ProfilePage from './components/ProfilePage.vue';
import AdminDashboard from './components/AdminDashboard.vue';

const routes = [
    { path: '/', component: HomePage },
    { path: '/profile', component: ProfilePage },
    { path: '/admin', component: AdminDashboard, meta: { requiresAdmin: true } }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

const app = createApp(App);
app.use(router);
app.mount('#app');
