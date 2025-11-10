import { Router } from 'express';
import pool from '../db.js';
import bcrypt from 'bcryptjs';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/categories', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const { rows } = await pool.query('select * from program_categories()');
        res.json(rows);
    } catch (e) {
        next(e);
    }
});

router.post('/categories', requireAuth, requireAdmin, async (req, res, next) => {
    const { type, title } = req.body;

    if (!type || !title) {
        return res.status(400).json({ error: 'type и title обязательны' });
    }

    try {
        const { rows } = await pool.query(
            'select * from create_category($1, $2)',
            [type, title]
        );
        res.status(201).json(rows[0]);
    } catch (e) {
        if (e.code === '23505') {
            return res.status(409).json({ error: 'Категория с таким названием уже существует' });
        }
        next(e);
    }
});

router.put('/categories/:id', requireAuth, requireAdmin, async (req, res, next) => {
    const id = parseInt(req.params.id, 10);
    const { type, title } = req.body;

    if (!type || !title) {
        return res.status(400).json({ error: 'type и title обязательны' });
    }

    try {
        const { rows } = await pool.query(
            'select * from update_category($1, $2, $3)',
            [id, type, title]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Категория не найдена' });
        }

        res.json(rows[0]);
    } catch (e) {
        if (e.code === '23505') {
            return res.status(409).json({ error: 'Категория с таким названием уже существует' });
        }
        next(e);
    }
});

router.delete('/categories/:id', requireAuth, requireAdmin, async (req, res, next) => {
    const id = parseInt(req.params.id, 10);

    try {
        const { rows } = await pool.query('select delete_category($1)', [id]);

        if (rows.length === 0 || rows[0].delete_category === null) {
            return res.status(404).json({ error: 'Категория не найдена' });
        }

        res.json({ message: 'Категория удалена' });
    } catch (e) {
        if (e.code === '23503') {
            return res.status(409).json({ error: 'Невозможно удалить, категория используется' });
        }
        next(e);
    }
});

router.get('/programs', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const { rows } = await pool.query(
            'select id, category_id, description, homepage_url, icon_url, download_url, created_at from programs order by id desc'
        );
        res.json(rows);
    } catch (e) {
        next(e);
    }
});

router.post('/programs', requireAuth, requireAdmin, async (req, res, next) => {
    const { category_id, description, homepage_url, icon_url, download_url } = req.body;

    if (!category_id || !description) {
        return res.status(400).json({ error: 'category_id и description обязательны' });
    }

    try {
        const { rows } = await pool.query(
            'select * from create_program($1, $2, $3, $4, $5)',
            [category_id, description, homepage_url || null, icon_url || null, download_url || null]
        );
        res.status(201).json(rows[0]);
    } catch (e) {
        next(e);
    }
});

router.put('/programs/:id', requireAuth, requireAdmin, async (req, res, next) => {
    const id = parseInt(req.params.id, 10);
    const { category_id, description, homepage_url, icon_url, download_url } = req.body;

    if (!category_id || !description) {
        return res.status(400).json({ error: 'category_id и description обязательны' });
    }

    try {
        const { rows } = await pool.query(
            'select * from update_program($1, $2, $3, $4, $5, $6)',
            [id, category_id, description, homepage_url || null, icon_url || null, download_url || null]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Программа не найдена' });
        }

        res.json(rows[0]);
    } catch (e) {
        next(e);
    }
});

router.delete('/programs/:id', requireAuth, requireAdmin, async (req, res, next) => {
    const id = parseInt(req.params.id, 10);

    try {
        const { rows } = await pool.query('select delete_program($1)', [id]);

        if (rows.length === 0 || rows[0].delete_program === null) {
            return res.status(404).json({ error: 'Программа не найдена' });
        }

        res.json({ message: 'Программа удалена' });
    } catch (e) {
        next(e);
    }
});

router.get('/settings', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const { rows } = await pool.query(
            'select id, category_id, label, ps_command from settings order by id desc'
        );
        res.json(rows);
    } catch (e) {
        next(e);
    }
});

router.post('/settings', requireAuth, requireAdmin, async (req, res, next) => {
    const { category_id, label, ps_command } = req.body;

    if (!category_id || !label || !ps_command) {
        return res.status(400).json({ error: 'category_id, label и ps_command обязательны' });
    }

    try {
        const { rows } = await pool.query(
            'select * from create_setting($1, $2, $3)',
            [category_id, label, ps_command]
        );
        res.status(201).json(rows[0]);
    } catch (e) {
        if (e.code === '23505') {
            return res.status(409).json({ error: 'Настройка с таким названием уже существует' });
        }
        next(e);
    }
});

router.put('/settings/:id', requireAuth, requireAdmin, async (req, res, next) => {
    const id = parseInt(req.params.id, 10);
    const { category_id, label, ps_command } = req.body;

    if (!category_id || !label || !ps_command) {
        return res.status(400).json({ error: 'category_id, label и ps_command обязательны' });
    }

    try {
        const { rows } = await pool.query(
            'select * from update_setting($1, $2, $3, $4)',
            [id, category_id, label, ps_command]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Настройка не найдена' });
        }

        res.json(rows[0]);
    } catch (e) {
        if (e.code === '23505') {
            return res.status(409).json({ error: 'Настройка с таким названием уже существует' });
        }
        next(e);
    }
});

router.delete('/settings/:id', requireAuth, requireAdmin, async (req, res, next) => {
    const id = parseInt(req.params.id, 10);

    try {
        const { rows } = await pool.query('select delete_setting($1)', [id]);

        if (rows.length === 0 || rows[0].delete_setting === null) {
            return res.status(404).json({ error: 'Настройка не найдена' });
        }

        res.json({ message: 'Настройка удалена' });
    } catch (e) {
        if (e.code === '23503') {
            return res.status(409).json({ error: 'Невозможно удалить, настройка используется' });
        }
        next(e);
    }
});

router.get('/users', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const { rows } = await pool.query('select * from get_all_users()');
        res.json(rows);
    } catch (e) {
        next(e);
    }
});

router.post('/users', requireAuth, requireAdmin, async (req, res, next) => {
    const { email, password, role } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'email и password обязательны' });
    }

    try {
        const passwordHash = await bcrypt.hash(password, 10);

        const { rows } = await pool.query(
            'select * from create_user_admin($1, $2, $3)',
            [email, passwordHash, role || 'user']
        );

        if (rows.length === 0) {
            return res.status(500).json({ error: 'Ошибка создания пользователя' });
        }

        res.status(201).json({
            id: rows[0].id,
            email: rows[0].email,
            role_name: rows[0].role_name,
            created_at: rows[0].created_at
        });
    } catch (e) {
        if (e.code === '23505') {
            return res.status(409).json({ error: 'Email уже зарегистрирован' });
        }
        next(e);
    }
});

router.delete('/users/:id', requireAuth, requireAdmin, async (req, res, next) => {
    const id = parseInt(req.params.id, 10);

    try {
        const { rows } = await pool.query('select delete_user_admin($1)', [id]);

        if (rows.length === 0 || rows[0].delete_user_admin === null) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        res.json({ message: 'Пользователь удалён' });
    } catch (e) {
        next(e);
    }
});

router.get('/settings-stats', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const { rows } = await pool.query('select * from get_settings_stats()');
        res.json(rows);
    } catch (e) {
        next(e);
    }
});

router.get('/popular-settings', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const { rows } = await pool.query('select * from get_popular_settings($1)', [limit]);
        res.json(rows);
    } catch (e) {
        next(e);
    }
});

router.get('/recommended-removal', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const { rows } = await pool.query('select * from get_recommended_removal($1)', [limit]);
        res.json(rows);
    } catch (e) {
        next(e);
    }
});

router.get('/dashboard-overview', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const { rows } = await pool.query('select * from get_dashboard_overview()');
        res.json(rows[0]);
    } catch (e) {
        next(e);
    }
});

router.put('/users/:id/role', requireAuth, requireAdmin, async (req, res, next) => {
    const id = parseInt(req.params.id, 10);
    const { role } = req.body;

    if (!role || (role !== 'admin' && role !== 'user')) {
        return res.status(400).json({ error: 'role обязательна и должна быть admin или user' });
    }

    try {
        const { rows } = await pool.query(
            'select * from update_user_role($1, $2)',
            [id, role]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        res.json(rows[0]);
    } catch (e) {
        next(e);
    }
});

export default router;
