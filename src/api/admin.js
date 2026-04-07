function getToken() {
    return localStorage.getItem('token');
}

function authHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
    };
}

async function request(url, options = {}) {
    const res = await fetch(url, {
        ...options,
        headers: { ...authHeaders(), ...(options.headers || {}) }
    });
    return res;
}

// Категории
export async function fetchCategories() {
    const res = await request('/api/admin/categories');
    return res.json();
}

export async function createCategory(data) {
    const res = await request('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify(data)
    });
    return res;
}

export async function updateCategory(id, data) {
    const res = await request(`/api/admin/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
    return res;
}

export async function deleteCategory(id) {
    const res = await request(`/api/admin/categories/${id}`, { method: 'DELETE' });
    return res;
}

// Программы
export async function fetchPrograms() {
    const res = await request('/api/admin/programs');
    return res.json();
}

export async function createProgram(data) {
    const res = await request('/api/admin/programs', {
        method: 'POST',
        body: JSON.stringify(data)
    });
    return res;
}

export async function updateProgram(id, data) {
    const res = await request(`/api/admin/programs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
    return res;
}

export async function deleteProgram(id) {
    const res = await request(`/api/admin/programs/${id}`, { method: 'DELETE' });
    return res;
}

// Настройки
export async function fetchSettings() {
    const res = await request('/api/admin/settings');
    return res.json();
}

export async function createSetting(data) {
    const res = await request('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify(data)
    });
    return res;
}

export async function updateSetting(id, data) {
    const res = await request(`/api/admin/settings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
    return res;
}

export async function deleteSetting(id) {
    const res = await request(`/api/admin/settings/${id}`, { method: 'DELETE' });
    return res;
}

// Пользователи
export async function fetchUsers() {
    const res = await request('/api/admin/users');
    return res.json();
}

export async function createUser(data) {
    const res = await request('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(data)
    });
    return res;
}

export async function updateUserRole(id, role) {
    const res = await request(`/api/admin/users/${id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role })
    });
    return res;
}

export async function deleteUser(id) {
    const res = await request(`/api/admin/users/${id}`, { method: 'DELETE' });
    return res;
}

// Статистика
export async function fetchDashboardOverview() {
    const res = await request('/api/admin/dashboard-overview');
    return res.json();
}

export async function fetchSettingsStats() {
    const res = await request('/api/admin/settings-stats');
    return res.json();
}

export async function fetchPopularSettings(limit = 10) {
    const res = await request(`/api/admin/popular-settings?limit=${limit}`);
    return res.json();
}

export async function fetchRecommendedRemoval(limit = 10) {
    const res = await request(`/api/admin/recommended-removal?limit=${limit}`);
    return res.json();
}

// Winget
export async function searchWinget(query) {
    const res = await fetch(`/api/winget/search?q=${encodeURIComponent(query)}`);
    return res.json();
}