import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import { createPinia } from 'pinia';
import App from './App.vue';
import HomePage from './components/HomePage.vue';
import ProfilePage from './components/ProfilePage.vue';
import AdminDashboard from './components/AdminDashboard.vue';

if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
}

const SCROLL_KEY = 'winpack:scroll';

window.addEventListener('beforeunload', () => {
    sessionStorage.setItem(SCROLL_KEY, JSON.stringify({
        path: window.location.pathname,
        y: window.scrollY
    }));
});

const routes = [
    { path: '/', component: HomePage },
    { path: '/profile', component: ProfilePage, meta: { requiresAuth: true } },
    { path: '/admin', component: AdminDashboard, meta: { requiresAdmin: true } }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
            return new Promise(resolve => {
                setTimeout(() => resolve(savedPosition), 200);
            });
        }
        if (!from.name) {
            try {
                const raw = sessionStorage.getItem(SCROLL_KEY);
                if (raw) {
                    const saved = JSON.parse(raw);
                    if (saved.path === to.path && typeof saved.y === 'number') {
                        sessionStorage.removeItem(SCROLL_KEY);
                        return new Promise(resolve => {
                            setTimeout(() => resolve({ top: saved.y, behavior: 'instant' }), 200);
                        });
                    }
                }
            } catch (e) {}
        }
        return { top: 0 };
    }
});

router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token');
    const userInfo = localStorage.getItem('userInfo');
    let user = null;
    try {
        user = userInfo ? JSON.parse(userInfo) : null;
    } catch (e) {
        // битый localStorage не должен ронять навигацию
        user = null;
    }

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