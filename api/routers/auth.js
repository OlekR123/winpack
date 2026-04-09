import Router from 'express';
import { query } from '../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendVerificationCode } from '../utils/mailer.js';
import { saveCode, verifyCode } from '../utils/codeStore.js';
import rateLimit from 'express-rate-limit';

const router = Router();

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPassword(password) {
    return password?.length >= 8 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /[0-9]/.test(password);
}

function signToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

const sendCodeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Слишком много попыток' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        const key = req.ip || req.headers['x-forwarded-for'] || 'unknown';
        console.log('[rate-limit] send-code key:', key);
        return key;
    }
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Слишком много попыток входа' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.ip || req.headers['x-forwarded-for'] || 'unknown';
    }
});

router.post('/send-code', sendCodeLimiter, async (req, res) => {
    console.log('[send-code] === START ===');
    console.log('[send-code] IP:', req.ip);
    console.log('[send-code] X-Forwarded-For:', req.headers['x-forwarded-for']);
    console.log('[send-code] Content-Type:', req.headers['content-type']);
    console.log('[send-code] Body:', JSON.stringify(req.body));

    try {
        const { email, password, password2 } = req.body;
        if (!email) {
            console.log('[send-code] FAIL: email отсутствует');
            return res.status(400).json({ error: 'Email обязателен' });
        }
        if (!isValidEmail(email)) {
            console.log('[send-code] FAIL: невалидный email:', email);
            return res.status(400).json({ error: 'Неверный формат email' });
        }
        if (!password || !password2) {
            console.log('[send-code] FAIL: пароли отсутствуют');
            return res.status(400).json({ error: 'Пароли обязательны' });
        }
        if (password !== password2) {
            console.log('[send-code] FAIL: пароли не совпадают');
            return res.status(400).json({ error: 'Пароли не совпадают' });
        }
        if (!isValidPassword(password)) {
            console.log('[send-code] FAIL: слабый пароль');
            return res.status(400).json({ error: 'Пароль: 8+ символов, a-z, A-Z, 0-9' });
        }

        console.log('[send-code] Проверяем email в БД...');
        const { rows } = await query('SELECT * FROM user_by_email($1)', [email]);

        if (rows.length > 0) {
            console.log('[send-code] FAIL: email уже зарегистрирован');
            return res.status(409).json({ error: 'Email уже зарегистрирован' });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        saveCode(email, code);

        console.log('[send-code] Отправляем письмо на:', email);
        await sendVerificationCode(email, code);

        console.log('[send-code] SUCCESS: код отправлен');
        res.json({ ok: true, message: 'Код отправлен' });
    } catch (e) {
        console.error('[send-code] ERROR:', e.message);
        console.error('[send-code] STACK:', e.stack);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

router.post('/register', async (req, res) => {
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

router.get('/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Токен отсутствует' });

        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const { rows } = await query('SELECT * FROM user_by_email($1)', [payload.email]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        const user = rows[0];

        res.json({
            user: {
                id: user.id,
                email: user.email,
                role_name: user.role_name
            }
        });
    } catch (e) {
        if (e.name === 'JsonWebTokenError' || e.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Неверный токен' });
        }
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

router.get('/check-admin', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ isAdmin: false });

        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const { rows } = await query('SELECT role_name FROM user_by_email($1)', [payload.email]);

        if (rows.length === 0) {
            return res.json({ isAdmin: false });
        }

        res.json({ isAdmin: rows[0].role_name === 'admin' });
    } catch (error) {
        res.json({ isAdmin: false });
    }
});

export default router;