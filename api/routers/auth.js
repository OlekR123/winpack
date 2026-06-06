import Router from 'express';
import { query } from '../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendVerificationCode } from '../utils/mailer.js';
import { saveCode, verifyCode } from '../utils/codeStore.js';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function isValidPassword(password) {
    if (!password || password.length < 8) return false;
    // bcrypt молча обрезает пароль на 72 байтах - длиннее не принимаем.
    if (Buffer.byteLength(password, 'utf8') > 72) return false;
    return /[a-z]/.test(password) && /[A-Z]/.test(password) && /[0-9]/.test(password);
}

function signToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

const sendCodeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Слишком много попыток' },
    standardHeaders: true,
    legacyHeaders: false
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Слишком много попыток входа' },
    standardHeaders: true,
    legacyHeaders: false
});

// Лимит на регистрацию: вместе со счётчиком в codeStore не даёт перебирать код.
const registerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Слишком много попыток' },
    standardHeaders: true,
    legacyHeaders: false
});

router.post('/send-code', sendCodeLimiter, async (req, res) => {
    // ВАЖНО: не логируем req.body — там пароль в открытом виде.
    try {
        const { email, password, password2 } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email обязателен' });
        }
        if (!isValidEmail(email)) {
            return res.status(400).json({ error: 'Неверный формат email' });
        }
        if (!password || !password2) {
            return res.status(400).json({ error: 'Пароли обязательны' });
        }
        if (password !== password2) {
            return res.status(400).json({ error: 'Пароли не совпадают' });
        }
        if (!isValidPassword(password)) {
            return res.status(400).json({ error: 'Пароль: 8+ символов, a-z, A-Z, 0-9' });
        }

        const { rows } = await query('SELECT * FROM user_by_email($1)', [email]);

        if (rows.length > 0) {
            return res.status(409).json({ error: 'Email уже зарегистрирован' });
        }

        const code = crypto.randomInt(100000, 1000000).toString();
        saveCode(email, code);

        await sendVerificationCode(email, code);

        res.json({ ok: true, message: 'Код отправлен' });
    } catch (e) {
        console.error('[send-code] error:', e.message);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

router.post('/register', registerLimiter, async (req, res) => {
    try {
        const { email, password, password2, code } = req.body;
        if (!email || !password || !password2 || !code) return res.status(400).json({ error: 'Все поля обязательны' });
        if (!verifyCode(email, code)) return res.status(400).json({ error: 'Неверный код' });

        const hash = await bcrypt.hash(password, 12);

        const { rows } = await query(
            'SELECT * FROM users_register($1, $2)',
            [email, hash]
        );

        const user = rows[0];

        const token = signToken({
            id: user.id,
            email: user.email,
            role: user.role_name
        });

        res.json({
            user: {
                id: user.id,
                email: user.email,
                role_name: user.role_name
            },
            token
        });
    } catch (e) {
        console.error('/register error:', e.message);
        if (e.message === 'email_exists' || e.code === '23505') {
            return res.status(409).json({ error: 'Email уже используется' });
        }
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password || !isValidEmail(email)) {
            return res.status(400).json({ error: 'Неверные данные' });
        }

        const { rows } = await query('SELECT * FROM user_by_email($1)', [email]);

        if (!rows[0]?.password_hash) {
            return res.status(400).json({ error: 'Неверный email или пароль' });
        }

        const user = rows[0];
        const isValid = await bcrypt.compare(password, user.password_hash);

        if (!isValid) {
            return res.status(400).json({ error: 'Неверный email или пароль' });
        }

        const token = signToken({
            id: user.id,
            email: user.email,
            role: user.role_name
        });

        res.json({
            user: {
                id: user.id,
                email: user.email,
                role_name: user.role_name
            },
            token
        });
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ error: 'Серверная ошибка' });
    }
});

router.get('/profile', requireAuth, async (req, res) => {
    try {
        const { rows } = await query('SELECT * FROM user_by_email($1)', [req.user.email]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        const user = rows[0];
        res.json({
            user: { id: user.id, email: user.email, role_name: user.role_name }
        });
    } catch (e) {
        console.error('/profile error:', e.message);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

router.get('/check-admin', requireAuth, async (req, res) => {
    try {
        const { rows } = await query('SELECT role_name FROM user_by_email($1)', [req.user.email]);
        res.json({ isAdmin: rows.length > 0 && rows[0].role_name === 'admin' });
    } catch (e) {
        res.json({ isAdmin: false });
    }
});

export default router;