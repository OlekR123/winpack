import { ref, reactive } from 'vue';
import { fetchSettingCategories, fetchSettingsByCategory } from '../api/home.js';

export function useSettings() {
    const settingCategories = ref([]);
    const categorySettings = reactive({});
    const selectedSettings = reactive({});

    async function loadSettings() {
        try {
            settingCategories.value = await fetchSettingCategories();

            for (const cat of settingCategories.value) {
                categorySettings[cat.id] = await fetchSettingsByCategory(cat.id);
            }
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