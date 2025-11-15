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
          <th>Категория</th>
          <th>Описание</th>
          <th>Действие</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="prog in programs" :key="prog.id">
          <td>{{ prog.id }}</td>
          <td>{{ getCategoryTitle(prog.category_id) }}</td>
          <td>{{ prog.description }}</td>
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

    <div v-if="showAddModal || showEditModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal" @click.stop>
        <h3 class="modal-title">{{ showEditModal ? 'Изменить программу' : 'Добавить программу' }}</h3>

        <div class="modal-form">
          <label class="form-label">Категория</label>
          <select v-model.number="formData.category_id" class="form-input">
            <option value="">Выберите категорию</option>
            <option v-for="cat in programCategories" :key="cat.id" :value="cat.id">
              {{ cat.title }}
            </option>
          </select>

          <label class="form-label">Описание</label>
          <input v-model="formData.description" type="text" placeholder="Введите описание" class="form-input" />

          <label class="form-label">URL главной страницы</label>
          <input v-model="formData.homepageurl" type="url" placeholder="https://example.com" class="form-input" />

          <label class="form-label">URL иконки</label>
          <div class="icon-url-group">
            <input
                v-model="formData.iconurl"
                type="url"
                placeholder="https://res.cloudinary.com/..."
                class="form-input icon-input"
            />
            <a
                href="https://cloudinary.com/"
                target="_blank"
                class="btn-cloudinary"
                title="Загрузить изображение на Cloudinary"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              Загрузить
            </a>
          </div>
          <p class="form-hint">
            Загрузите изображение на <a href="https://cloudinary.com/" target="_blank" class="link-cloudinary">Cloudinary</a>,
            затем скопируйте URL и вставьте выше
          </p>

          <label class="form-label">URL скачивания</label>
          <input v-model="formData.downloadurl" type="url" placeholder="https://..." class="form-input" />

          <button class="form-btn-submit" @click="saveProgram">
            {{ showEditModal ? 'Сохранить' : 'Добавить' }}
          </button>
          <button class="form-btn-cancel" @click="closeModals">Отмена</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, computed } from 'vue';

const programs = ref([]);
const categories = ref([]);
const showAddModal = ref(false);
const showEditModal = ref(false);
const editingId = ref(null);
const formData = ref({
  category_id: '',
  description: '',
  homepageurl: '',
  iconurl: '',
  downloadurl: ''
});

const token = localStorage.getItem('token');

const programCategories = computed(() => {
  return categories.value.filter(cat => cat.type === 'program');
});

onMounted(async () => {
  await loadCategories();
  await loadPrograms();
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
    const programCats = await programsRes.json();

    const settingsWithType = settings.map(cat => ({
      id: cat.id,
      title: cat.title,
      type: 'setting'
    }));

    const programsWithType = programCats.map(cat => ({
      id: cat.id,
      title: cat.title,
      type: 'program'
    }));

    categories.value = [...settingsWithType, ...programsWithType].sort((a, b) => a.id - b.id);

  } catch (e) {
    categories.value = [];
  }
}

async function loadPrograms() {
  try {
    const res = await fetch('/api/admin/programs', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    programs.value = await res.json();
  } catch (e) {
    programs.value = [];
    alert('Ошибка загрузки программ');
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

  if (!cat) {
    return `ID ${numId}`;
  }

  return cat.title;
}

function openAddModal() {
  formData.value = {
    category_id: '',
    description: '',
    homepageurl: '',
    iconurl: '',
    downloadurl: ''
  };
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
    category_id: catId,
    description: prog.description || '',
    homepageurl: prog.homepageurl || prog.homepage_url || '',
    iconurl: prog.iconurl || prog.icon_url || '',
    downloadurl: prog.downloadurl || prog.download_url || ''
  };

  showEditModal.value = true;
}

function closeModals() {
  showAddModal.value = false;
  showEditModal.value = false;
  editingId.value = null;
  formData.value = {
    category_id: '',
    description: '',
    homepageurl: '',
    iconurl: '',
    downloadurl: ''
  };
}

async function saveProgram() {
  if (!formData.value.category_id || !formData.value.description) {
    alert('Заполните обязательные поля (категория и описание)');
    return;
  }

  try {
    const method = showEditModal.value ? 'PUT' : 'POST';
    const url = showEditModal.value
        ? `/api/admin/programs/${editingId.value}`
        : '/api/admin/programs';

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

    await loadPrograms();
    closeModals();
    alert(showEditModal.value ? 'Программа обновлена' : 'Программа добавлена');
  } catch (e) {
    alert('Ошибка сохранения');
  }
}

async function deleteProgram(id) {
  if (!confirm('Вы уверены?')) return;

  try {
    const res = await fetch(`/api/admin/programs/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      alert('Ошибка удаления');
      return;
    }

    await loadPrograms();
    alert('Программа удалена');
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

.form-input:focus {
  outline: none;
  border-color: #facc15;
  box-shadow: 0 0 0 0.1563vw rgba(250, 204, 21, 0.25);
}

.icon-url-group {
  display: flex;
  gap: 0.5208vw;
  align-items: stretch;
  margin-bottom: 0.5208vw;
}

.icon-input {
  flex: 1;
  margin-bottom: 0 !important;
}

.btn-cloudinary {
  display: flex;
  align-items: center;
  gap: 0.3125vw;
  padding: 0.6510vw 0.9375vw;
  background: #1f2937;
  color: #fff;
  border: none;
  border-radius: 0.4167vw;
  font-size: 0.9375vw;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.15s ease, transform 0.15s ease;
  line-height: 1.2;
}

.btn-cloudinary:hover {
  transform: translateY(-0.0625vw);
}

.btn-cloudinary svg {
  width: 1.0417vw;
  height: 1.0417vw;
  flex-shrink: 0;
}

.form-hint {
  margin: 0 0 1.0417vw 0;
  font-size: 0.8333vw;
  color: #6b7280;
  line-height: 1.4;
}

.link-cloudinary {
  color: #3448C5;
  text-decoration: underline;
  transition: color 0.15s;
}

.link-cloudinary:hover {
  transform: translateY(-0.1042vw);
  box-shadow: 0 0.2083vw 0.4167vw rgba(0, 0, 0, 0.1);
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
