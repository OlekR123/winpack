import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import homeRoutes from './routers/home.js';
import authRoutes from './routers/auth.js';
import adminRouter from './routers/admin.js';
import wingetRouter from './routers/winget.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Загрузка .env — пробуем оба пути
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: './api/.env' });

const app = express();
app.set('trust proxy', true);

const PORT = Number(process.env.PORT ?? 3000);
const distPath = path.join(__dirname, '..', 'dist');

// ====== ПОРЯДОК MIDDLEWARE ВАЖЕН ======

// 1. Логирование — самое первое, чтобы видеть ВСЕ запросы
app.use(morgan('dev'));

// 2. Body parser — ГЛОБАЛЬНО, до роутов
app.use(express.json({ limit: '10mb' }));

// 3. CORS — для /api
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://winpack.onrender.com'
];

app.use('/api', cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log('[CORS] Blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// 4. Helmet — после CORS
app.use('/api', helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false
}));

// 5. API роуты — ДО статики, чтобы /api точно обрабатывался Express
app.use('/api/home', homeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRouter);
app.use('/api/winget', wingetRouter);

// 6. Health check
app.get('/api/health', (_req, res) => res.json({
    ok: true,
    version: '2.0',
    env: {
        EMAIL_USER: process.env.EMAIL_USER ? 'set' : 'MISSING',
        EMAIL_PASS: process.env.EMAIL_PASS ? 'set' : 'MISSING',
        JWT_SECRET: process.env.JWT_SECRET ? 'set' : 'MISSING',
        PGHOST: process.env.PGHOST ? 'set' : 'MISSING',
        NODE_ENV: process.env.NODE_ENV || 'not set'
    }
}));

// 7. Статика фронтенда — ПОСЛЕ API роутов
app.use(express.static(distPath));

// 8. SPA fallback — самое последнее
app.get('/{*path}', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

// 9. Обработка ошибок
app.use((err, _req, res, _next) => {
    console.error('Server error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`API listening http://localhost:${PORT}`);
    console.log(`EMAIL_USER: ${process.env.EMAIL_USER ? 'set' : 'MISSING'}`);
    console.log(`EMAIL_PASS: ${process.env.EMAIL_PASS ? 'set' : 'MISSING'}`);
});