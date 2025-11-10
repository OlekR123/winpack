import { Router } from 'express';
import pool from '../db.js';
import { requireAuth, requireOwnership } from '../middleware/auth.js';

const router = Router();

router.get('/program-categories', async (_req, res, next) => {
    try {
        const { rows } = await pool.query('select * from program_categories()');
        res.json(rows);
    } catch (e) { next(e); }
});

router.get('/programs', async (req, res, next) => {
    try {
        const categoryId = parseInt(String(req.query.categoryId), 10);
        if (!Number.isFinite(categoryId)) {
            return res.status(400).json({ error: 'categoryId must be integer' });
        }
        const { rows } = await pool.query(
            'select * from programs_by_category($1)',
            [categoryId]
        );
        res.json(rows);
    } catch (e) { next(e); }
});

router.get('/setting-categories', async (_req, res, next) => {
    try {
        const { rows } = await pool.query('select * from setting_categories()');
        res.json(rows);
    } catch (e) { next(e); }
});

router.get('/settings', async (req, res, next) => {
    try {
        const categoryId = parseInt(String(req.query.categoryId), 10);
        if (!Number.isFinite(categoryId)) {
            return res.status(400).json({ error: 'categoryId must be integer' });
        }
        const { rows } = await pool.query(
            'select * from settings_by_category($1)',
            [categoryId]
        );
        res.json(rows);
    } catch (e) { next(e); }
});

router.get('/user-settings/:userId', requireAuth, requireOwnership, async (req, res, next) => {
    try {
        const userId = parseInt(String(req.params.userId), 10);
        const { rows } = await pool.query(
            'select * from get_user_settings($1)',
            [userId]
        );
        res.json(rows);
    } catch (e) { next(e); }
});

router.post('/save-user-settings/:userId', requireAuth, requireOwnership, async (req, res, next) => {
    try {
        const userId = parseInt(String(req.params.userId), 10);
        const { settingIds } = req.body || {};

        if (!Array.isArray(settingIds)) {
            return res.status(400).json({ error: 'settingIds must be array' });
        }

        if (!settingIds.every(id => Number.isInteger(id))) {
            return res.status(400).json({ error: 'All settingIds must be integers' });
        }

        const { rows } = await pool.query(
            'select * from save_user_settings($1, $2)',
            [userId, settingIds]
        );

        res.json({ ok: rows[0] });
    } catch (e) { next(e); }
});

router.get('/user-script/:userId', requireAuth, requireOwnership, async (req, res, next) => {
    try {
        const userId = parseInt(String(req.params.userId), 10);

        const { rows } = await pool.query('select * from get_user_script($1)', [userId]);

        if (rows.length === 0 || !rows[0].script_commands) {
            return res.status(400).json({ error: 'no_settings_selected' });
        }

        const scripts = (rows[0].script_commands || '').toString();
        const fullScript = `# WinPack Configuration Script\n${scripts}\n`;

        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Content-Type', 'application/octet-stream; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="WinPackConfig.ps1"');

        const buffer = Buffer.from(fullScript, 'utf8');
        res.setHeader('Content-Length', buffer.length);
        res.end(buffer);
    } catch (e) {
        next(e);
    }
});

export default router;
