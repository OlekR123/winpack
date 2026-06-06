import { Router } from 'express';
import axios from 'axios';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/search', requireAuth, requireAdmin, async (req, res) => {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) return res.json({ data: [] });

    try {
        const response = await axios.get('https://api.winget.run/v2/packages', {
            params: {
                query: q,
                ensureContains: true, // отсекаем фонетические совпадения нужна реальная подстрока запроса
                partialMatch: false,
                take: 10
            },
            timeout: 10000,
            headers: { 'User-Agent': 'WinPack/1.0', 'Accept': 'application/json' }
        });

        let packages = [];
        if (Array.isArray(response.data)) packages = response.data;
        else if (Array.isArray(response.data?.data)) packages = response.data.data;
        else if (Array.isArray(response.data?.Packages)) packages = response.data.Packages;

        const qLower = q.toLowerCase();
        const results = packages
            // подстраховка на стороне сервера, если что-то лишнее проскочит
            .filter(pkg => {
                const id = String(pkg.Id || pkg.id || pkg.PackageIdentifier || '').toLowerCase();
                const name = String(pkg.Name || pkg.name || pkg.PackageName || '').toLowerCase();
                return id.includes(qLower) || name.includes(qLower);
            })
            .slice(0, 10)
            .map(pkg => ({
                id: pkg.Id || pkg.id || pkg.PackageIdentifier,
                name: pkg.Name || pkg.name || pkg.PackageName || pkg.Id || pkg.id,
                description: pkg.Description || pkg.description || pkg.ShortDescription || 'Нет описания',
                homepage: pkg.Homepage || pkg.homepage || pkg.PublisherUrl || ''
            }));

        res.json({ data: results });
    } catch (e) {
        console.error('Winget search error:', e.message);
        res.json({ data: [] });
    }
});

router.get('/info/:wingetId', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const wingetId = req.params.wingetId;

        const response = await axios.get(
            `https://api.winget.run/v2/packages/${encodeURIComponent(wingetId)}`,
            {
                timeout: 10000,
                headers: { 'User-Agent': 'WinPack/1.0', 'Accept': 'application/json' }
            }
        );

        if (response.status !== 200) {
            return res.status(404).json({ error: 'Программа не найдена' });
        }

        const data = response.data;
        const latest = data.Latest || {};

        res.json({
            id: data.Id,
            name: data.Name,
            publisher: data.Publisher,
            description: latest.ShortDescription || latest.Description || '',
            homepage: latest.Homepage || data.Homepage || '',
            version: latest.Version || '',
            downloadUrl: latest.InstallerUrl || ''
        });
    } catch (e) {
        console.error('Winget info error:', e.message);
        next(e);
    }
});

export default router;