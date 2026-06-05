import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, '.env') });

const dbConfig = {
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT ?? 5432),
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl: { rejectUnauthorized: false },
    application_name: 'WinPack-API',
    connectionTimeoutMillis: 5000,
    query_timeout: 10000,
    statement_timeout: 10000,
};

console.log(`[db] per-request client -> ${dbConfig.host}:${dbConfig.port}`);

export async function query(text, params) {
    const client = new pg.Client(dbConfig);

    try {
        await client.connect();
        return await client.query(text, params);
    } catch (err) {
        // Нарушения ограничений (класс 23xxx) — ожидаемые: роут вернёт понятный 4xx,
        // поэтому логируем только действительно неожиданные сбои.
        if (!String(err.code || '').startsWith('23')) {
            console.error('Database query error:', err.message);
        }
        throw err;
    } finally {
        await client.end().catch(() => {});
    }
}

export async function queryWithRetry(text, params, maxRetries = 3) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await query(text, params);
        } catch (err) {
            lastError = err;

            const isConnectionError =
                err.code === 'ECONNRESET' ||
                err.code === 'ECONNREFUSED' ||
                err.code === '57P01' ||
                /terminated|timeout|connect/i.test(err.message || '');

            if (isConnectionError && attempt < maxRetries) {
                await new Promise(r => setTimeout(r, attempt * 300));
            } else {
                throw err;
            }
        }
    }

    throw lastError;
}

export async function withTransaction(callback) {
    const client = new pg.Client(dbConfig);

    try {
        await client.connect();
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        throw err;
    } finally {
        await client.end().catch(() => {});
    }
}

export default { query: queryWithRetry };