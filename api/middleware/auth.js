import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload;
        next();
    } catch (e) {
        if (e.name === 'JsonWebTokenError' || e.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Неверный или истекший токен' });
        }
        next(e);
    }
}

export function requireOwnership(req, res, next) {
    const userId = parseInt(req.params.userId, 10);

    if (isNaN(userId)) {
        return res.status(400).json({ error: 'Некорректный ID пользователя' });
    }

    if (req.user.id !== userId) {
        return res.status(403).json({ error: 'Доступ запрещён' });
    }

    next();
}


export function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Доступ запрещён. Требуется роль администратора' });
    }
    next();
}


