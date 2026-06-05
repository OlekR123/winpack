import { ref, reactive } from 'vue';
import { fetchSettingCategories, fetchSettingsByCategory } from '../api/home.js';

export function useSettings() {
    const settingCategories = ref([]);
    const categorySettings = reactive({});
    const selectedSettings = reactive({});

    async function loadSettings() {
        try {
            settingCategories.value = await fetchSettingCategories();

            // Грузим настройки по всем категориям параллельно, а не водопадом.
            const lists = await Promise.all(
                settingCategories.value.map(cat => fetchSettingsByCategory(cat.id))
            );

            settingCategories.value.forEach((cat, i) => {
                categorySettings[cat.id] = lists[i];
            });
        } catch (e) {
            settingCategories.value = [];
        }
    }

    function getSelectedSettingIds() {
        return Object.keys(selectedSettings)
            .filter(key => selectedSettings[key])
            .map(key => parseInt(key));
    }

    function restoreSettings(userSettings) {
        for (const key in selectedSettings) {
            delete selectedSettings[key];
        }

        for (const setting of userSettings) {
            if (setting.enabled) {
                selectedSettings[setting.id] = true;
            }
        }
    }

    return {
        settingCategories,
        categorySettings,
        selectedSettings,
        loadSettings,
        getSelectedSettingIds,
        restoreSettings
    };
}