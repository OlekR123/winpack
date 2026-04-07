import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useAuthStore = defineStore('auth', () => {
    const token = ref(localStorage.getItem('token') || null);
    const user = ref(loadUser());

    const isAuthenticated = computed(() => !!token.value);
    const isAdmin = computed(() => user.value?.role_name === 'admin');
    const userId = computed(() => user.value?.id || null);
    const userEmail = computed(() => user.value?.email || '');

    function loadUser() {
        try {
            const raw = localStorage.getItem('userInfo');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    function setAuth(tokenValue, userData) {
        token.value = tokenValue;
        user.value = userData;
        localStorage.setItem('token', tokenValue);
        localStorage.setItem('userInfo', JSON.stringify(userData));
    }

    function logout() {
        token.value = null;
        user.value = null;
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
    }

    function getAuthHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token.value}`
        };
    }

    return {
        token,
        user,
        isAuthenticated,
        isAdmin,
        userId,
        userEmail,
        setAuth,
        logout,
        getAuthHeaders
    };
});