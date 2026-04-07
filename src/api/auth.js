async function apiPost(url, body) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data?.error || 'Ошибка запроса');
    }

    return data;
}

export async function login(email, password) {
    return apiPost('/api/auth/login', { email, password });
}

export async function sendCode(email, password, password2) {
    return apiPost('/api/auth/send-code', { email, password, password2 });
}

export async function register(email, password, password2, code) {
    return apiPost('/api/auth/register', { email, password, password2, code });
}