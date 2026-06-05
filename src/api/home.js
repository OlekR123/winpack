// Публичные ручки при ошибке могут вернуть не-массив ({error}); приводим к массиву,
// чтобы один сбойный запрос не ломал рендер.
async function getJsonArray(res) {
    if (!res.ok) return [];
    const data = await res.json().catch(() => []);
    return Array.isArray(data) ? data : [];
}

export async function fetchProgramCategories() {
    const res = await fetch('/api/home/program-categories');
    return getJsonArray(res);
}

export async function fetchProgramsByCategory(categoryId) {
    const url = new URL('/api/home/programs', window.location.origin);
    url.searchParams.set('categoryId', categoryId);
    const res = await fetch(url);
    return getJsonArray(res);
}

export async function fetchSettingCategories() {
    const res = await fetch('/api/home/setting-categories');
    return getJsonArray(res);
}

export async function fetchSettingsByCategory(categoryId) {
    const url = new URL('/api/home/settings', window.location.origin);
    url.searchParams.set('categoryId', categoryId);
    const res = await fetch(url);
    return getJsonArray(res);
}

export async function fetchUserSettings(userId, headers) {
    const res = await fetch(`/api/home/user-settings/${userId}`, { headers });
    return getJsonArray(res);
}

export async function saveUserSettings(userId, settingIds, headers) {
    const res = await fetch(`/api/home/save-user-settings/${userId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ settingIds })
    });
    return res;
}

export async function fetchUserPrograms(userId, headers) {
    const res = await fetch(`/api/home/user-programs/${userId}`, { headers });
    return getJsonArray(res);
}

export async function saveUserPrograms(userId, programIds, headers) {
    const res = await fetch(`/api/home/save-user-programs/${userId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ programIds })
    });
    return res;
}

export async function fetchUserScript(userId, token) {
    const res = await fetch(`/api/home/user-script/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return res;
}

export async function fetchProgramsScript(programIds) {
    const res = await fetch('/api/home/programs-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programIds })
    });
    return res;
}
