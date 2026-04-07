import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth, requireOwnership } from '../middleware/auth.js';

const router = Router();

// Программы по категории
router.get('/programs', async (req, res) => {
    try {
        const categoryId = parseInt(String(req.query.categoryId), 10);
        if (!Number.isFinite(categoryId)) {
            return res.status(400).json({ error: 'categoryId must be integer' });
        }

        const { rows } = await query(
            'SELECT * FROM get_programs_by_category($1)',
            [categoryId]
        );

        res.json(rows);
    } catch (e) {
        console.error('Error /programs:', e.message);
        res.status(500).json({ error: 'Database error' });
    }
});

// Категории программ
router.get('/program-categories', async (req, res) => {
    try {
        const { rows } = await query('SELECT * FROM program_categories()');
        res.json(rows);
    } catch (e) {
        console.error('Error /program-categories:', e.message);
        res.status(500).json({ error: 'Database error' });
    }
});

// Категории настроек
router.get('/setting-categories', async (req, res) => {
    try {
        const { rows } = await query('SELECT * FROM setting_categories()');
        res.json(rows);
    } catch (e) {
        console.error('Error /setting-categories:', e.message);
        res.status(500).json({ error: 'Database error' });
    }
});

// Настройки по категории
router.get('/settings', async (req, res) => {
    try {
        const categoryId = parseInt(String(req.query.categoryId), 10);
        if (!Number.isFinite(categoryId)) {
            return res.status(400).json({ error: 'categoryId must be integer' });
        }

        const { rows } = await query(
            'SELECT * FROM settings_by_category($1)',
            [categoryId]
        );

        res.json(rows);
    } catch (e) {
        console.error('Error /settings:', e.message);
        res.status(500).json({ error: 'Database error' });
    }
});

// Настройки пользователя
router.get('/user-settings/:userId', requireAuth, requireOwnership, async (req, res) => {
    try {
        const userId = parseInt(String(req.params.userId), 10);
        const { rows } = await query('SELECT * FROM get_user_settings($1)', [userId]);
        res.json(rows);
    } catch (e) {
        console.error('Error /user-settings:', e.message);
        res.status(500).json({ error: 'Database error' });
    }
});

// Сохранение настроек пользователя
router.post('/save-user-settings/:userId', requireAuth, requireOwnership, async (req, res) => {
    try {
        const userId = parseInt(String(req.params.userId), 10);
        const { settingIds } = req.body || {};

        if (!Array.isArray(settingIds)) {
            return res.status(400).json({ error: 'settingIds must be array' });
        }

        const { rows } = await query(
            'SELECT * FROM save_user_settings($1, $2)',
            [userId, settingIds]
        );

        res.json({ ok: rows[0].save_user_settings });
    } catch (e) {
        console.error('Error /save-user-settings:', e.message);
        res.status(500).json({ error: 'Database error' });
    }
});

// Программы пользователя
router.get('/user-programs/:userId', requireAuth, requireOwnership, async (req, res) => {
    try {
        const userId = parseInt(String(req.params.userId), 10);
        const { rows } = await query('SELECT * FROM get_user_programs($1)', [userId]);
        res.json(rows);
    } catch (e) {
        console.error('Error /user-programs:', e.message);
        res.status(500).json({ error: 'Database error' });
    }
});

// Сохранение программ пользователя
router.post('/save-user-programs/:userId', requireAuth, requireOwnership, async (req, res) => {
    try {
        const userId = parseInt(String(req.params.userId), 10);
        const { programIds } = req.body || {};

        if (!Array.isArray(programIds)) {
            return res.status(400).json({ error: 'programIds must be array' });
        }

        const { rows } = await query(
            'SELECT * FROM save_user_programs($1, $2)',
            [userId, programIds]
        );

        res.json({ ok: rows[0].save_user_programs });
    } catch (e) {
        console.error('Error /save-user-programs:', e.message);
        res.status(500).json({ error: 'Database error' });
    }
});

// Скрипт настроек пользователя
router.get('/user-script/:userId', requireAuth, requireOwnership, async (req, res) => {
    try {
        const userId = parseInt(String(req.params.userId), 10);
        const { rows } = await query('SELECT * FROM get_user_script($1)', [userId]);

        if (rows.length === 0 || !rows[0].script_commands) {
            return res.status(400).json({ error: 'no_settings_selected' });
        }

        const scripts = rows[0].script_commands.toString();
        const fullScript = `# WinPack Configuration Script\n${scripts}\n`;

        res.setHeader('Content-Type', 'application/octet-stream; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="WinPackConfig.ps1"');
        res.end(Buffer.from(fullScript, 'utf8'));
    } catch (e) {
        console.error('Error /user-script:', e.message);
        res.status(500).json({ error: 'Database error' });
    }
});

// Скрипт установки программ
router.post('/programs-script', async (req, res) => {
    try {
        const { programIds } = req.body || {};

        if (!Array.isArray(programIds) || programIds.length === 0) {
            return res.status(400).json({ error: 'Select at least one program' });
        }

        const { rows } = await query(
            'SELECT get_programs_install_script($1) AS script',
            [programIds]
        );

        if (!rows[0]?.script) {
            return res.status(400).json({ error: 'Failed to generate script' });
        }

        const script = rows[0].script;
        const bom = '\uFEFF';
        const fullScript = bom + script;

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="WinPackInstaller.ps1"');
        res.end(Buffer.from(fullScript, 'utf8'));
    } catch (e) {
        console.error('Error /programs-script:', e.message);
        res.status(500).json({ error: 'Database error' });
    }
});

export default router;