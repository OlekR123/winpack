<template>
  <div class="admin-page">
    <div class="page-header">
      <h2 class="page-title">Управление настройками</h2>
    </div>

    <div class="table-container">
      <table class="admin-table">
        <thead>
        <tr>
          <th>ID</th>
          <th>Категория</th>
          <th>Название</th>
          <th>PowerShell команда</th>
          <th>Действие</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="sett in settings" :key="sett.id">
          <td>{{ sett.id }}</td>
          <td>{{ getCategoryTitle(sett.category_id) }}</td>
          <td>{{ sett.label }}</td>
          <td class="ps-command">
            <span class="ps-text">{{ sett.ps_command }}</span>
          </td>
          <td>
            <div class="actions">
              <button class="btn-edit" @click="editSetting(sett)">Изменить</button>
              <button class="btn-delete" @click="deleteSetting(sett.id)">Удалить</button>
            </div>
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <button class="btn-add" @click="openAddModal">Добавить</button>

    <div v-if="showAddModal || showEditModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal" @click.stop>
        <h3 class="modal-title">{{ showEditModal ? 'Изменить настройку' : 'Добавить настройку' }}</h3>

        <div class="modal-form">
          <label class="form-label">Категория</label>
          <select v-model.number="formData.category_id" class="form-input">
            <option value="">Выберите категорию</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ cat.title }}
            </option>
          </select>

          <label class="form-label">Название</label>
          <input v-model="formData.label" type="text" placeholder="Название настройки" class="form-input" />

          <label class="form-label">PowerShell команда</label>
          <textarea v-model="formData.ps_command" placeholder="PowerShell команда" class="form-input"></textarea>

          <button class="form-btn-submit" @click="saveSetting">
            {{ showEditModal ? 'Сохранить' : 'Добавить' }}
          </button>
          <button class="form-btn-cancel" @click="closeModals">Отмена</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';

const settings = ref([]);
const categories = ref([]);
const showAddModal = ref(false);
const showEditModal = ref(false);
const editingId = ref(null);
const formData = ref({
  category_id: '',
  label: '',
  ps_command: ''
});

const token = localStorage.getItem('token');

onMounted(async () => {
  await loadCategories();
  await loadSettings();
});

watch([showAddModal, showEditModal], ([isAddOpen, isEditOpen]) => {
  if (isAddOpen || isEditOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});

async function loadCategories() {
  try {
    const res = await fetch('/api/home/setting-categories', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    categories.value = await res.json();
  } catch (e) {
    categories.value = [];
  }
}

async function loadSettings() {
  try {
    const res = await fetch('/api/admin/settings', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    settings.value = await res.json();
  } catch (e) {
    settings.value = [];
    alert('Ошибка загрузки настроек');
  }
}

function getCategoryTitle(categoryId) {
  if (!categoryId) {
    return 'Не указана';
  }

  const numId = parseInt(categoryId);

  if (isNaN(numId)) {
    return 'Некорректная';
  }

  const cat = categories.value.find(c => c.id === numId);
  return cat ? cat.title : `ID ${numId}`;
}

function openAddModal() {
  formData.value = {
    category_id: '',
    label: '',
    ps_command: ''
  };
  showAddModal.value = true;
}

async function editSetting(sett) {
  editingId.value = sett.id;
  await nextTick();

  let catId = sett.category_id;
  if (!catId || catId === '' || catId === 'undefined') {
    catId = '';
  } else {
    const parsed = parseInt(catId);
    catId = isNaN(parsed) ? '' : parsed;
  }

  formData.value = {
    category_id: catId,
    label: sett.label || '',
    ps_command: sett.ps_command || ''
  };

  showEditModal.value = true;
}

function closeModals() {
  showAddModal.value = false;
  showEditModal.value = false;
  editingId.value = null;
  formData.value = {
    category_id: '',
    label: '',
    ps_command: ''
  };
}

async function saveSetting() {
  if (!formData.value.category_id || !formData.value.label || !formData.value.ps_command) {
    alert('Заполните все поля');
    return;
  }

  try {
    const method = showEditModal.value ? 'PUT' : 'POST';
    const url = showEditModal.value
        ? `/api/admin/settings/${editingId.value}`
        : '/api/admin/settings';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData.value)
    });

    if (!res.ok) {
      const error = await res.json();
      alert(error.error || 'Ошибка сохранения');
      return;
    }

    await loadSettings();
    closeModals();
    alert(showEditModal.value ? 'Настройка обновлена' : 'Настройка добавлена');
  } catch (e) {
    alert('Ошибка сохранения');
  }
}

async function deleteSetting(id) {
  if (!confirm('Вы уверены?')) return;

  try {
    const res = await fetch(`/api/admin/settings/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      alert('Ошибка удаления');
      return;
    }

    await loadSettings();
    alert('Настройка удалена');
  } catch (e) {
    alert('Ошибка удаления');
  }
}
</script>

<style scoped>
.admin-page {
  width: 100%;
  padding: 3.125vw 0 3.125vw 3.125vw;
}

.page-header {
  margin-bottom: 3.125vw;
}

.page-title {
  font-size: 2.0833vw;
  line-height: 1.1;
  color: #1f2937;
  margin: 0;
  font-weight: 400;
}

.table-container {
  background: #ffffff;
  border-radius: 1.25vw;
  margin-bottom: 3.125vw;
  overflow: hidden;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
}

.admin-table thead {
  background: #f7f7f7;
}

.admin-table th {
  padding: 1.0417vw;
  text-align: left;
  font-weight: 400;
  color: #1f2937;
  font-size: 1.0417vw;
  border-bottom: 0.1042vw solid #e5e7eb;
}

.admin-table td {
  padding: 1.0417vw;
  color: #1f2937;
  font-size: 1.0417vw;
  border-bottom: 0.0521vw solid #e5e7eb;
}

.admin-table tbody tr:last-child td {
  border-bottom: none;
}

.admin-table tbody tr:hover {
  background: #f9fafb;
}

.ps-command {
  max-width: 20.8333vw;
}

.ps-text {
  display: block;
  font-family: 'Courier New', monospace;
  font-size: 0.8333vw;
  font-weight: 400;
  color: #6b7280;
  word-break: break-word;
  white-space: pre-wrap;
  line-height: 1.4;
}

.actions {
  display: flex;
  gap: 0.5208vw;
  align-items: center;
}

.btn-edit,
.btn-delete {
  padding: 0.5vw 0.8vw;
  border: none;
  border-radius: 0.4vw;
  font-size: 1.25vw;
  font-family: inherit;
  font-weight: 500;
  cursor: pointer;
  transition: transform .15s ease, box-shadow .15s ease;
  box-shadow: 0 0 0 rgba(0,0,0,0);
  line-height: 1.2;
  white-space: nowrap;
  flex-shrink: 0;
}

.btn-edit {
  background: #1f2937;
  color: #fff;
}

.btn-edit:hover {
  transform: translateY(-0.0625vw);
  box-shadow: 0 .2083vw .4167vw rgba(0,0,0,.1);
}

.btn-delete {
  background: #dc2626;
  color: #fff;
}

.btn-delete:hover {
  transform: translateY(-0.0625vw);
  box-shadow: 0 .2083vw .4167vw rgba(0,0,0,.1);
}

.btn-add {
  width: 100%;
  padding: 0.5vw 0.8vw;
  background: #facc15;
  color: #1f2937;
  border: none;
  border-radius: 0.4vw;
  font-size: 1.25vw;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  line-height: 1.2;
  transition: transform .15s ease, box-shadow .15s ease;
  box-shadow: 0 0 0 rgba(0,0,0,0);
}

.btn-add:hover {
  transform: translateY(-0.0625vw);
  box-shadow: 0 .2083vw .4167vw rgba(0,0,0,.1);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(0.2083vw);
}

.modal {
  background: #fff;
  padding: 2.6042vw 3.125vw;
  border-radius: 1.25vw;
  box-shadow: 0 0.5208vw 2.0833vw rgba(0, 0, 0, 0.15);
  width: 26.0417vw;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-title {
  margin: 0 0 2.0833vw 0;
  font-size: 1.5625vw;
  color: #1f2937;
  font-weight: 400;
  text-align: center;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 0.5208vw;
}

.form-label {
  font-size: 1.0417vw;
  font-weight: 400;
  color: #1f2937;
  margin-bottom: 0.2604vw;
  line-height: 1.2;
}

.form-input {
  width: auto;
  padding: 0.6510vw 0.7813vw;
  border: 0.0521vw solid #d1d5db;
  border-radius: 0.4167vw;
  font-size: 1.0417vw;
  font-family: inherit;
  line-height: 1.2;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  margin-bottom: 1.0417vw;
}

textarea.form-input {
  resize: vertical;
  min-height: 5.2083vw;
  font-family: monospace;
}

.form-input:focus {
  outline: none;
  border-color: #facc15;
  box-shadow: 0 0 0 0.1563vw rgba(250, 204, 21, 0.25);
}

.form-btn-submit {
  width: 100%;
  padding: 0.6510vw 0;
  background: #facc15;
  color: #1f2937;
  border: none;
  border-radius: 0.4167vw;
  font-size: 1.25vw;
  font-weight: 400;
  font-family: inherit;
  cursor: pointer;
  line-height: 1.2;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 0 0 rgba(0,0,0,0);
  margin-top: 0.5208vw;
}

.form-btn-submit:hover {
  transform: translateY(-0.1042vw);
  box-shadow: 0 0.2083vw 0.4167vw rgba(0, 0, 0, 0.1);
}

.form-btn-cancel {
  width: 100%;
  padding: 0.6510vw 0;
  background: transparent;
  color: #1f2937;
  border: none;
  font-size: 1.0417vw;
  font-weight: 400;
  font-family: inherit;
  line-height: 1.2;
  cursor: pointer;
  transition: color 0.15s, opacity 0.15s;
  text-align: center;
  margin-top: 0.5208vw;
}

.form-btn-cancel:hover {
  color: #4b5563;
  opacity: 0.9;
}
</style>
