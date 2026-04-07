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

dotenv.config({ path: './api/.env' });

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(helmet({ contentSecurityPolicy: false }));

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000'
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

app.use('/api/home', homeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRouter);
app.use('/api/winget', wingetRouter);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Отдаём собранный фронтенд
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// Все остальные маршруты — на index.html (для Vue Router)
app.get('/{*path}', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

app.use((err, _req, res, _next) => {
    console.error('Server error:', err.message);

    if (process.env.NODE_ENV === 'production') {
        res.status(500).json({ error: 'Internal server error' });
    } else {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`API listening http://localhost:${PORT}`);
});