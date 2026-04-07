import { ref, reactive } from 'vue';
import { fetchProgramCategories, fetchProgramsByCategory, fetchProgramsScript } from '../api/home.js';

export function usePrograms() {
    const categories = ref([]);
    const categoryPrograms = reactive({});
    const categoryOffsets = reactive({});
    const categoryIndexes = reactive({});
    const selectedPrograms = reactive({});
    const showProgramsGuide = ref(false);

    async function loadCategories() {
        try {
            categories.value = await fetchProgramCategories();

            for (const cat of categories.value) {
                categoryPrograms[cat.id] = await fetchProgramsByCategory(cat.id);
                categoryOffsets[cat.id] = 0;
                categoryIndexes[cat.id] = 0;
            }
        } catch (e) {
            categories.value = [];
        }
    }

    function getVisibleCards() {
        const width = window.innerWidth;
        if (width <= 768) return 1;
        if (width <= 1200) return 2;
        return 3;
    }

    function getScrollParams() {
        const width = window.innerWidth;
        if (width <= 768) {
            return { cardWidth: width - 48, gap: 16 };
        }
        if (width <= 1200) {
            const vw = width / 100;
            return { cardWidth: 42 * vw, gap: 3 * vw };
        }
        const vw = width / 100;
        return { cardWidth: 20 * vw, gap: 2.15 * vw };
    }

    function scrollCategory(catId, dir) {
        const programs = categoryPrograms[catId] || [];
        const visibleCards = getVisibleCards();
        const max = Math.max(0, programs.length - visibleCards);

        categoryIndexes[catId] = Math.max(0, Math.min((categoryIndexes[catId] || 0) + dir, max));

        const { cardWidth, gap } = getScrollParams();
        const step = cardWidth + gap;
        categoryOffsets[catId] = -categoryIndexes[catId] * step;
    }

    function canScrollLeft(catId) {
        return (categoryIndexes[catId] || 0) > 0;
    }

    function canScrollRight(catId) {
        const programs = categoryPrograms[catId] || [];
        const visibleCards = getVisibleCards();
        const max = Math.max(0, programs.length - visibleCards);
        return (categoryIndexes[catId] || 0) < max;
    }

    function toggleProgramSelection(programId) {
        if (selectedPrograms[programId]) {
            delete selectedPrograms[programId];
        } else {
            selectedPrograms[programId] = true;
        }
    }

    function getSelectedProgramIds() {
        return Object.keys(selectedPrograms)
            .filter(id => selectedPrograms[id])
            .map(id => parseInt(id));
    }

    function openProgramsGuide() {
        showProgramsGuide.value = true;
        document.body.style.overflow = 'hidden';
    }

    function closeProgramsGuide() {
        showProgramsGuide.value = false;
        document.body.style.overflow = 'auto';
    }

    async function downloadProgramsScript(beforeDownload) {
        const selectedIds = getSelectedProgramIds();

        if (selectedIds.length === 0) {
            alert('Выберите хотя бы одну программу');
            return;
        }

        if (beforeDownload) {
            await beforeDownload(selectedIds);
        }

        try {
            const res = await fetchProgramsScript(selectedIds);

            if (!res.ok) {
                const error = await res.json();
                alert(error.error || 'Ошибка генерации скрипта');
                return;
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'WinPackInstaller.ps1';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            openProgramsGuide();
        } catch (e) {
            alert('Ошибка скачивания скрипта');
        }
    }

    function handleResize() {
        for (const catId of Object.keys(categoryOffsets)) {
            const { cardWidth, gap } = getScrollParams();
            const step = cardWidth + gap;
            categoryOffsets[catId] = -(categoryIndexes[catId] || 0) * step;
        }
    }

    return {
        categories,
        categoryPrograms,
        categoryOffsets,
        categoryIndexes,
        selectedPrograms,
        showProgramsGuide,
        loadCategories,
        scrollCategory,
        canScrollLeft,
        canScrollRight,
        toggleProgramSelection,
        getSelectedProgramIds,
        openProgramsGuide,
        closeProgramsGuide,
        downloadProgramsScript,
        handleResize
    };
}