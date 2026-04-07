<template>
  <div class="admin-page">
    <div class="page-header">
      <h2 class="page-title">Управление программами</h2>
    </div>

    <div class="table-container">
      <table class="admin-table">
        <thead>
        <tr>
          <th>ID</th>
          <th>Название</th>
          <th>Категория</th>
          <th>Winget ID</th>
          <th>Действие</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="prog in programs" :key="prog.id">
          <td>{{ prog.id }}</td>
          <td>{{ prog.name }}</td>
          <td>{{ getCategoryTitle(prog.category_id) }}</td>
          <td>{{ prog.winget_id || '—' }}</td>
          <td>
            <div class="actions">
              <button class="btn-edit" @click="editProgram(prog)">Изменить</button>
              <button class="btn-delete" @click="deleteProgram(prog.id)">Удалить</button>
            </div>
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <button class="btn-add" @click="openAddModal">Добавить</button>

    <div v-if="showAddModal || showEditModal" class="modal-overlay" @mousedown.self="closeModals">
      <div class="modal" @click.stop>
        <h3 class="modal-title">{{ showEditModal ? 'Изменить программу' : 'Добавить программу' }}</h3>

        <div class="modal-form">
          <div class="winget-search-section">
            <label class="form-label">Найти в Winget</label>
            <div class="winget-search-input-group">
              <input v-model="wingetSearchQuery" type="text" placeholder="Введите название программы..." class="form-input" @input="searchWingetDebounced" />
              <button v-if="wingetSearchQuery" class="btn-clear-search" @click="clearWingetSearch" title="Очистить">✕</button>
            </div>

            <div v-if="wingetResults.length > 0" class="winget-results">
              <div v-for="result in wingetResults" :key="result.id" class="winget-result-item" @click="selectWingetProgram(result)">
                <div class="winget-result-name">{{ result.name }}</div>
                <div class="winget-result-id">{{ result.id }}</div>
                <div class="winget-result-desc">{{ result.description }}</div>
              </div>
            </div>

            <div v-if="wingetSearching" class="winget-searching">Поиск...</div>
            <div v-if="wingetSearchQuery && wingetResults.length === 0 && !wingetSearching" class="winget-no-results">Ничего не найдено</div>
          </div>

          <label class="form-label">Название программы *</label>
          <input v-model="formData.name" type="text" placeholder="Например: Google Chrome" class="form-input" />

          <label class="form-label">Winget ID * (обязательно для установки)</label>
          <input v-model="formData.winget_id" type="text" placeholder="Например: Google.Chrome" class="form-input" required />
          <p class="form-hint form-hint-important">
            Найдите ID программы на <a href="https://winget.run" target="_blank" class="link-winget">winget.run</a> или используйте поиск выше
          </p>

          <label class="form-label">Категория *</label>
          <select v-model.number="formData.category_id" class="form-input">
            <option value="">Выберите категорию</option>
            <option v-for="cat in programCategories" :key="cat.id" :value="cat.id">{{ cat.title }}</option>
          </select>

          <label class="form-label">Описание *</label>
          <textarea v-model="formData.description" placeholder="Введите описание программы" class="form-textarea" rows="3"></textarea>

          <label class="form-label">URL главной страницы</label>
          <input v-model="formData.homepage_url" type="url" placeholder="https://example.com" class="form-input" />

          <label class="form-label">URL иконки</label>
          <div class="icon-url-group">
            <input v-model="formData.icon_url" type="url" placeholder="https://i.postimg.cc/..." class="form-input icon-input" />
            <a href="https://postimages.org/" target="_blank" class="btn-upload-icon" title="Загрузить изображение на Postimages">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              Загрузить
            </a>
          </div>
          <p class="form-hint">
            Загрузите изображение на <a href="https://postimages.org/" target="_blank" class="link-postimages">Postimages</a>, затем скопируйте прямую ссылку и вставьте выше
          </p>

          <button class="form-btn-submit" @click="saveProgram">{{ showEditModal ? 'Сохранить' : 'Добавить' }}</button>
          <button class="form-btn-cancel" @click="closeModals">Отмена</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, computed } from 'vue';
import * as adminApi from '../api/admin.js';

const programs = ref([]);
const categories = ref([]);
const showAddModal = ref(false);
const showEditModal = ref(false);
const editingId = ref(null);

const wingetSearchQuery = ref('');
const wingetResults = ref([]);
const wingetSearching = ref(false);
let wingetSearchTimeout = null;

const formData = ref({
  name: '', winget_id: '', category_id: '', description: '', homepage_url: '', icon_url: ''
});

const programCategories = computed(() => {
  return categories.value.filter(cat => cat.type === 'program');
});

onMounted(async () => {
  await loadCategories();
  await loadPrograms();
});

watch([showAddModal, showEditModal], ([isAddOpen, isEditOpen]) => {
  document.body.style.overflow = (isAddOpen || isEditOpen) ? 'hidden' : '';
});

async function loadCategories() {
  try {
    const programCats = await (await fetch('/api/home/program-categories')).json();
    const settingsRes = await fetch('/api/home/setting-categories');
    const settingsCats = settingsRes.ok ? await settingsRes.json() : [];

    const settingsWithType = settingsCats.map(cat => ({ id: cat.id, title: cat.title, type: 'setting' }));
    const programsWithType = programCats.map(cat => ({ id: cat.id, title: cat.title, type: 'program' }));

    categories.value = [...settingsWithType, ...programsWithType].sort((a, b) => a.id - b.id);
  } catch (e) {
    categories.value = [];
    alert('Не удалось загрузить категории. Обновите страницу.');
  }
}

async function loadPrograms() {
  try {
    programs.value = await adminApi.fetchPrograms();
  } catch (e) {
    programs.value = [];
    alert('Не удалось загрузить программы');
  }
}

function getCategoryTitle(categoryId) {
  if (!categoryId) return 'Не указана';
  const numId = parseInt(categoryId);
  if (isNaN(numId)) return 'Некорректная';
  const cat = categories.value.find(c => c.id === numId);
  return cat ? cat.title : `ID ${numId}`;
}

function openAddModal() {
  formData.value = { name: '', winget_id: '', category_id: '', description: '', homepage_url: '', icon_url: '' };
  wingetSearchQuery.value = '';
  wingetResults.value = [];
  showAddModal.value = true;
}

async function editProgram(prog) {
  editingId.value = prog.id;
  await nextTick();

  let catId = prog.category_id;
  if (!catId || catId === '' || catId === 'undefined') {
    catId = '';
  } else {
    const parsed = parseInt(catId);
    catId = isNaN(parsed) ? '' : parsed;
  }

  formData.value = {
    name: prog.name || '', winget_id: prog.winget_id || '', category_id: catId,
    description: prog.description || '', homepage_url: prog.homepage_url || '', icon_url: prog.icon_url || ''
  };

  wingetSearchQuery.value = '';
  wingetResults.value = [];
  showEditModal.value = true;
}

function closeModals() {
  showAddModal.value = false;
  showEditModal.value = false;
  editingId.value = null;
  wingetSearchQuery.value = '';
  wingetResults.value = [];
  formData.value = { name: '', winget_id: '', category_id: '', description: '', homepage_url: '', icon_url: '' };
}

function searchWingetDebounced() {
  clearTimeout(wingetSearchTimeout);
  if (wingetSearchQuery.value.trim().length < 2) {
    wingetResults.value = [];
    return;
  }
  wingetSearchTimeout = setTimeout(() => { searchWinget(); }, 500);
}

async function searchWinget() {
  if (!wingetSearchQuery.value.trim()) {
    wingetResults.value = [];
    return;
  }

  wingetSearching.value = true;
  try {
    const data = await adminApi.searchWinget(wingetSearchQuery.value);
    wingetResults.value = data.data || [];
  } catch (e) {
    wingetResults.value = [];
  } finally {
    wingetSearching.value = false;
  }
}

function clearWingetSearch() {
  wingetSearchQuery.value = '';
  wingetResults.value = [];
}

function selectWingetProgram(result) {
  formData.value.name = result.name || '';
  formData.value.winget_id = result.id || '';
  formData.value.description = result.description || '';
  formData.value.homepage_url = result.homepage || '';
  wingetSearchQuery.value = '';
  wingetResults.value = [];
  alert(`Программа "${formData.value.name}" выбрана из Winget. Проверьте заполненные поля и добавьте категорию.`);
}

async function saveProgram() {
  if (!formData.value.name || !formData.value.category_id || !formData.value.description) {
    alert('Заполните обязательные поля (название, категория и описание)');
    return;
  }
  if (!formData.value.winget_id || formData.value.winget_id.trim() === '') {
    alert('Winget ID обязателен для установки программ через Winget');
    return;
  }

  try {
    const isEditing = showEditModal.value;
    const payload = {
      name: formData.value.name, winget_id: formData.value.winget_id, category_id: formData.value.category_id,
      description: formData.value.description, homepage_url: formData.value.homepage_url || null, icon_url: formData.value.icon_url || null
    };

    let res;
    if (isEditing) {
      res = await adminApi.updateProgram(editingId.value, payload);
    } else {
      res = await adminApi.createProgram(payload);
    }

    if (!res.ok) {
      const error = await res.json();
      alert(error.error || 'Ошибка сохранения');
      return;
    }

    await loadPrograms();
    closeModals();
  } catch (e) {
    alert('Ошибка сохранения: ' + e.message);
  }
}

async function deleteProgram(id) {
  if (!confirm('Вы уверены?')) return;
  try {
    const res = await adminApi.deleteProgram(id);
    if (!res.ok) { alert('Ошибка удаления'); return; }
    await loadPrograms();
  } catch (e) {
    alert('Ошибка удаления');
  }
}
</script>

<style scoped>
.admin-page { width: 100%; padding: 3.125vw 0 3.125vw 3.125vw; }
.page-header { margin-bottom: 3.125vw; }
.page-title { font-size: 2.0833vw; line-height: 1.1; color: #1f2937; margin: 0; font-weight: 400; }
.table-container { background: #ffffff; border-radius: 1.25vw; margin-bottom: 3.125vw; overflow: hidden; }
.admin-table { width: 100%; border-collapse: collapse; }
.admin-table thead { background: #f7f7f7; }
.admin-table th { padding: 1.0417vw; text-align: left; font-weight: 400; color: #1f2937; font-size: 1.0417vw; border-bottom: 0.1042vw solid #e5e7eb; }
.admin-table td { padding: 1.0417vw; color: #1f2937; font-size: 1.0417vw; border-bottom: 0.0521vw solid #e5e7eb; }
.admin-table tbody tr:last-child td { border-bottom: none; }
.admin-table tbody tr:hover { background: #f9fafb; }
.actions { display: flex; gap: 0.5208vw; align-items: center; }
.btn-edit, .btn-delete { padding: 0.5vw 0.8vw; border: none; border-radius: 0.4vw; font-size: 1.25vw; font-family: inherit; font-weight: 500; cursor: pointer; transition: transform .15s ease, box-shadow .15s ease; box-shadow: 0 0 0 rgba(0,0,0,0); line-height: 1.2; white-space: nowrap; flex-shrink: 0; }
.btn-edit { background: #1f2937; color: #fff; }
.btn-edit:hover { transform: translateY(-0.0625vw); box-shadow: 0 .2083vw .4167vw rgba(0,0,0,.1); }
.btn-delete { background: #dc2626; color: #fff; }
.btn-delete:hover { transform: translateY(-0.0625vw); box-shadow: 0 .2083vw .4167vw rgba(0,0,0,.1); }
.btn-add { width: 100%; padding: 0.5vw 0.8vw; background: #facc15; color: #1f2937; border: none; border-radius: 0.4vw; font-size: 1.25vw; font-weight: 500; font-family: inherit; cursor: pointer; line-height: 1.2; transition: transform .15s ease, box-shadow .15s ease; box-shadow: 0 0 0 rgba(0,0,0,0); }
.btn-add:hover { transform: translateY(-0.0625vw); box-shadow: 0 .2083vw .4167vw rgba(0,0,0,.1); }
.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(0.2083vw); }
.modal { background: #fff; padding: 2.6042vw 3.125vw; border-radius: 1.25vw; box-shadow: 0 0.5208vw 2.0833vw rgba(0, 0, 0, 0.15); width: 26.0417vw; max-width: 90vw; max-height: 80vh; overflow-y: auto; }
.modal-title { margin: 0 0 2.0833vw 0; font-size: 1.5625vw; color: #1f2937; font-weight: 400; text-align: center; }
.modal-form { display: flex; flex-direction: column; gap: 0.5208vw; }
.form-label { font-size: 1.0417vw; font-weight: 400; color: #1f2937; margin-bottom: 0.2604vw; line-height: 1.2; }
.form-input { width: 100%; padding: 0.6510vw 0.7813vw; border: 0.0521vw solid #d1d5db; border-radius: 0.4167vw; font-size: 1.0417vw; font-family: inherit; line-height: 1.2; transition: border-color 0.15s ease, box-shadow 0.15s ease; margin-bottom: 1.0417vw; box-sizing: border-box; }
.form-input:focus { outline: none; border-color: #facc15; box-shadow: 0 0 0 0.1563vw rgba(250, 204, 21, 0.25); }
.icon-url-group { display: flex; gap: 0.5208vw; align-items: stretch; margin-bottom: 0.5208vw; }
.icon-input { flex: 1; margin-bottom: 0 !important; }
.btn-upload-icon { display: flex; align-items: center; gap: 0.3125vw; padding: 0.6510vw 0.9375vw; background: #1f2937; color: #fff; border: none; border-radius: 0.4167vw; font-size: 0.9375vw; font-weight: 500; font-family: inherit; cursor: pointer; text-decoration: none; white-space: nowrap; transition: background 0.15s ease, transform 0.15s ease; line-height: 1.2; }
.btn-upload-icon:hover { transform: translateY(-0.0625vw); }
.btn-upload-icon svg { width: 1.0417vw; height: 1.0417vw; flex-shrink: 0; }
.form-hint { margin: 0 0 1.0417vw 0; font-size: 0.8333vw; color: #6b7280; line-height: 1.4; }
.link-postimages { color: #3448C5; text-decoration: underline; transition: color 0.15s; }
.link-postimages:hover { color: #2a3aa0; }
.form-btn-submit { width: 100%; padding: 0.6510vw 0; background: #facc15; color: #1f2937; border: none; border-radius: 0.4167vw; font-size: 1.25vw; font-weight: 400; font-family: inherit; cursor: pointer; line-height: 1.2; transition: transform 0.15s ease, box-shadow 0.15s ease; box-shadow: 0 0 0 rgba(0,0,0,0); margin-top: 0.5208vw; }
.form-btn-submit:hover { transform: translateY(-0.1042vw); box-shadow: 0 0.2083vw 0.4167vw rgba(0, 0, 0, 0.1); }
.form-btn-cancel { width: 100%; padding: 0.6510vw 0; background: transparent; color: #1f2937; border: none; font-size: 1.0417vw; font-weight: 400; font-family: inherit; line-height: 1.2; cursor: pointer; transition: color 0.15s, opacity 0.15s; text-align: center; margin-top: 0.5208vw; }
.form-btn-cancel:hover { color: #4b5563; opacity: 0.9; }
.winget-search-section { margin-bottom: 1.0417vw; padding-bottom: 1.0417vw; border-bottom: 0.1042vw solid #e5e7eb; display: flex; flex-direction: column; gap: 0.5208vw; }
.winget-search-input-group { position: relative; display: flex; align-items: center; }
.btn-clear-search { position: absolute; right: 12px; background: transparent; border: none; color: #6b7280; font-size: 18px; cursor: pointer; padding: 4px 8px; border-radius: 4px; transition: all 0.2s; }
.btn-clear-search:hover { background: #f3f4f6; color: #1f2937; }
.winget-results { margin-top: 12px; border: 1px solid #e5e7eb; border-radius: 8px; max-height: 300px; overflow-y: auto; background: #ffffff; }
.winget-result-item { padding: 12px 16px; border-bottom: 1px solid #f3f4f6; cursor: pointer; transition: background 0.2s; }
.winget-result-item:last-child { border-bottom: none; }
.winget-result-item:hover { background: #f9fafb; }
.winget-result-name { font-weight: 600; color: #1f2937; margin-bottom: 4px; }
.winget-result-id { font-size: 13px; color: #6b7280; font-family: 'Courier New', monospace; margin-bottom: 4px; }
.winget-result-desc { font-size: 13px; color: #6b7280; line-height: 1.4; }
.winget-searching, .winget-no-results { margin-top: 12px; padding: 16px; text-align: center; color: #6b7280; font-size: 14px; background: #f9fafb; border-radius: 8px; }
.form-textarea { width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; font-family: inherit; resize: vertical; transition: border-color 0.2s; }
.form-textarea:focus { outline: none; border-color: #facc15; }
.form-hint-important { color: #d97706; font-weight: 500; margin-top: 0.2604vw; margin-bottom: 1.0417vw; }
.link-winget { color: #3b82f6; text-decoration: underline; transition: color 0.15s; }
.link-winget:hover { color: #2563eb; }
</style>