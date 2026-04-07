import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import { createPinia } from 'pinia';
import App from './App.vue';
import HomePage from './components/HomePage.vue';
import ProfilePage from './components/ProfilePage.vue';
import AdminDashboard from './components/AdminDashboard.vue';

const routes = [
    { path: '/', component: HomePage },
    { path: '/profile', component: ProfilePage, meta: { requiresAuth: true } },
    { path: '/admin', component: AdminDashboard, meta: { requiresAdmin: true } }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token');
    const userInfo = localStorage.getItem('userInfo');
    const user = userInfo ? JSON.parse(userInfo) : null;

    if (to.meta.requiresAuth && !token) {
        return next('/');
    }

    if (to.meta.requiresAdmin && (!token || user?.role_name !== 'admin')) {
        return next('/profile');
    }

    if (to.path === '/profile' && user?.role_name === 'admin') {
        return next('/admin');
    }

    next();
});

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount('#app');