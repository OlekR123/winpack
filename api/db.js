import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

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

export async function query(text, params) {
    const client = new pg.Client(dbConfig);

    try {
        await client.connect();
        const result = await client.query(text, params);
        return result;
    } catch (err) {
        console.error('Database query error:', err.message);
        throw err;
    } finally {
        try {
            await client.end();
        } catch (endErr) {
            // Ignore close errors
        }
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
                err.message.includes('timeout') ||
                err.message.includes('terminated') ||
                err.message.includes('ECONNREFUSED') ||
                err.message.includes('connect');

            if (isConnectionError && attempt < maxRetries) {
                const delay = attempt * 300;
                await new Promise(r => setTimeout(r, delay));
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

export default {
    query: queryWithRetry,
    on: () => {},
    end: async () => {},
    totalCount: 0,
    idleCount: 0,
    waitingCount: 0
};