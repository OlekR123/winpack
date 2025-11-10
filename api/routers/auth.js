import { Router } from 'express';
import pool from '../db.js';
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
    return password.length >= 8 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /[0-9]/.test(password);
}

function signToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

const sendCodeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: { error: 'Слишком много попыток. Попробуйте позже.' },
    standardHeaders: true,
    legacyHeaders: false
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Слишком много попыток входа. Попробуйте позже.' },
    standardHeaders: true,
    legacyHeaders: false
});

router.post('/send-code', sendCodeLimiter, async (req, res, next) => {
    try {
        const { email, password, password2 } = req.body || {};

        if (!email) {
            return res.status(400).json({ error: 'Укажите адрес электронной почты' });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({ error: 'Введите корректный email адрес' });
        }

        if (!password || !password2) {
            return res.status(400).json({ error: 'Укажите пароль и подтверждение' });
        }

        if (password !== password2) {
            return res.status(400).json({ error: 'Пароли не совпадают' });
        }

        if (!isValidPassword(password)) {
            return res.status(400).json({
                error: 'Пароль должен содержать минимум 8 символов, включая заглавные, строчные буквы и цифры'
            });
        }

        const { rows: existing } = await pool.query('select * from user_by_email($1)', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Этот email уже зарегистрирован' });
        }

        const code = generateCode();
        saveCode(email, code);
        await sendVerificationCode(email, code);

        res.json({ ok: true, message: 'Код отправлен на почту' });
    } catch (e) {
        next(e);
    }
});

router.post('/register', async (req, res, next) => {
    try {
        const { email, password, password2, code } = req.body || {};

        if (!email || !password || !password2 || !code) {
            return res.status(400).json({ error: 'Заполните все поля' });
        }

        if (!verifyCode(email, code)) {
            return res.status(400).json({ error: 'Неверный или истекший код подтверждения' });
        }

        const hash = await bcrypt.hash(password, 12);
        const { rows } = await pool.query('select * from users_register($1, $2)', [email, hash]);
        const user = rows[0];
        const token = signToken({ id: user.id, email: user.email, role: user.role_name });

        res.json({
            user: {
                id: user.id,
                email: user.email,
                role_name: user.role_name
            },
            token
        });
    } catch (e) {
        next(e);
    }
});

router.post('/login', loginLimiter, async (req, res, next) => {
    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({ error: 'Заполните все поля' });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({ error: 'Введите корректный email адрес' });
        }

        const { rows } = await pool.query('select * from user_by_email($1)', [email]);

        if (rows.length === 0) {
            return res.status(400).json({ error: 'Неверный email или пароль' });
        }

        const user = rows[0];
        const ok = await bcrypt.compare(password, user.password_hash);

        if (!ok) {
            return res.status(400).json({ error: 'Неверный email или пароль' });
        }

        const token = signToken({ id: user.id, email: user.email, role: user.role_name });
        res.json({
            user: {
                id: user.id,
                email: user.email,
                role_name: user.role_name
            },
            token
        });
    } catch (e) {
        next(e);
    }
});

router.get('/profile', async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const { rows } = await pool.query('select * from user_by_email($1)', [payload.email]);

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
            return res.status(401).json({ error: 'Неверный или истекший токен' });
        }
        next(e);
    }
});

router.get('/check-admin', async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const isAdmin = payload.role === 'admin';

        res.json({ isAdmin });
    } catch (e) {
        if (e.name === 'JsonWebTokenError' || e.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Неверный или истекший токен' });
        }
        next(e);
    }
});

export default router;
