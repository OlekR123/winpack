import crypto from 'crypto';

const codes = new Map();

const MAX_ATTEMPTS = 5;

export function saveCode(email, code, expiresInMs = 10 * 60 * 1000) {
    codes.set(email.toLowerCase(), {
        code,
        expiresAt: Date.now() + expiresInMs
    });
}

export function verifyCode(email, code) {
    const stored = codes.get(email.toLowerCase());

    if (!stored) return false;

    if (Date.now() > stored.expiresAt) {
        codes.delete(email.toLowerCase());
        return false;
    }

    let isMatch = false;
    try {
        isMatch = crypto.timingSafeEqual(
            Buffer.from(stored.code),
            Buffer.from(code)
        );
    } catch (e) {
        isMatch = false;
    }

    if (!isMatch) {
        // Считаем неверные попытки и удаляем код после лимита, чтобы его нельзя было перебрать.
        stored.attempts = (stored.attempts || 0) + 1;
        if (stored.attempts >= MAX_ATTEMPTS) {
            codes.delete(email.toLowerCase());
        }
        return false;
    }

    codes.delete(email.toLowerCase());
    return true;
}

setInterval(() => {
    const now = Date.now();
    for (const [email, data] of codes.entries()) {
        if (now > data.expiresAt) {
            codes.delete(email);
        }
    }
}, 5 * 60 * 1000);