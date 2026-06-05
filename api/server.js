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

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
// Доверяем ровно одному прокси (Render): иначе X-Forwarded-For можно подделать и обойти rate-limit.
app.set('trust proxy', 1);

const PORT = Number(process.env.PORT ?? 3000);
const distPath = path.join(__dirname, '..', 'dist');

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(express.json({ limit: '10mb' }));

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://winpack.onrender.com',
    'https://winpack.site',
    'https://www.winpack.site'
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

app.use('/api', helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false
}));

app.use('/api/home', homeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRouter);
app.use('/api/winget', wingetRouter);

app.get('/api/health', (_req, res) => res.json({
    ok: true,
    version: '3.0',
    env: {
        RESEND_API_KEY: process.env.RESEND_API_KEY ? 'set' : 'MISSING',
        JWT_SECRET: process.env.JWT_SECRET ? 'set' : 'MISSING',
        PGHOST: process.env.PGHOST ? 'set' : 'MISSING',
        NODE_ENV: process.env.NODE_ENV || 'not set'
    }
}));

app.use(express.static(distPath));

app.get('/{*path}', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

app.use((err, _req, res, _next) => {
    console.error('Server error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`API listening http://localhost:${PORT}`);
});