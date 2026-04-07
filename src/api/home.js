export async function fetchProgramCategories() {
    const res = await fetch('/api/home/program-categories');
    return res.json();
}

export async function fetchProgramsByCategory(categoryId) {
    const url = new URL('/api/home/programs', window.location.origin);
    url.searchParams.set('categoryId', categoryId);
    const res = await fetch(url);
    return res.json();
}

export async function fetchSettingCategories() {
    const res = await fetch('/api/home/setting-categories');
    return res.json();
}

export async function fetchSettingsByCategory(categoryId) {
    const url = new URL('/api/home/settings', window.location.origin);
    url.searchParams.set('categoryId', categoryId);
    const res = await fetch(url);
    return res.json();
}

export async function fetchUserSettings(userId, headers) {
    const res = await fetch(`/api/home/user-settings/${userId}`, { headers });
    if (!res.ok) return [];
    return res.json();
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
    if (!res.ok) return [];
    return res.json();
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