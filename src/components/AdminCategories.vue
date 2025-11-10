<template>
  <div class="admin-page">
    <div class="page-header">
      <h2 class="page-title">Управление категориями</h2>
    </div>

    <div class="table-container">
      <table class="admin-table">
        <thead>
        <tr>
          <th>ID</th>
          <th>Тип</th>
          <th>Название</th>
          <th>Действие</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="cat in categories" :key="cat.id">
          <td>{{ cat.id }}</td>
          <td>{{ cat.type }}</td>
          <td>{{ cat.title }}</td>
          <td>
            <div class="actions">
              <button class="btn-edit" @click="editCategory(cat)">Изменить</button>
              <button class="btn-delete" @click="deleteCategory(cat.id)">Удалить</button>
            </div>
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <button class="btn-add" @click="openAddModal">Добавить</button>

    <div v-if="showAddModal || showEditModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal" @click.stop>
        <h3 class="modal-title">{{ showEditModal ? 'Изменить категорию' : 'Добавить категорию' }}</h3>

        <div class="modal-form">
          <label class="form-label">Тип</label>
          <select v-model="formData.type" class="form-input">
            <option value="setting">Setting</option>
            <option value="program">Program</option>
          </select>

          <label class="form-label">Название</label>
          <input v-model="formData.title" type="text" placeholder="Введите название" class="form-input" />

          <button class="form-btn-submit" @click="saveCategory">
            {{ showEditModal ? 'Сохранить' : 'Добавить' }}
          </button>
          <button class="form-btn-cancel" @click="closeModals">Отмена</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';

const categories = ref([]);
const showAddModal = ref(false);
const showEditModal = ref(false);
const editingId = ref(null);
const formData = ref({ type: 'program', title: '' });

const token = localStorage.getItem('token');

onMounted(async () => {
  await loadCategories();
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
    const [settingsRes, programsRes] = await Promise.all([
      fetch('/api/home/setting-categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch('/api/home/program-categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    ]);

    const settings = await settingsRes.json();
    const programs = await programsRes.json();

    const settingsWithType = settings.map(cat => ({ ...cat, type: 'setting' }));
    const programsWithType = programs.map(cat => ({ ...cat, type: 'program' }));

    categories.value = [...settingsWithType, ...programsWithType].sort((a, b) => a.id - b.id);

  } catch (e) {
    alert('Ошибка загрузки категорий');
  }
}

function openAddModal() {
  showAddModal.value = true;
}

function editCategory(cat) {
  editingId.value = cat.id;
  formData.value = {
    type: cat.type || 'program',
    title: cat.title || ''
  };
  showEditModal.value = true;
}

function closeModals() {
  showAddModal.value = false;
  showEditModal.value = false;
  editingId.value = null;
  formData.value = { type: 'program', title: '' };
}

async function saveCategory() {
  if (!formData.value.title.trim()) {
    alert('Введите название');
    return;
  }

  try {
    const method = showEditModal.value ? 'PUT' : 'POST';
    const url = showEditModal.value ? `/api/admin/categories/${editingId.value}` : '/api/admin/categories';

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

    await loadCategories();
    closeModals();
    alert(showEditModal.value ? 'Категория обновлена' : 'Категория добавлена');
  } catch (e) {
    alert('Ошибка сохранения');
  }
}

async function deleteCategory(id) {
  if (!confirm('Вы уверены?')) return;

  try {
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      alert('Ошибка удаления');
      return;
    }

    await loadCategories();
    alert('Категория удалена');
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
  max-height: 85vh;
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
