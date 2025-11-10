<template>
  <div class="admin-page">
    <div class="page-header">
      <h2 class="page-title">Управление пользователями</h2>
    </div>

    <div class="table-container">
      <table class="admin-table">
        <thead>
        <tr>
          <th>ID</th>
          <th>Email</th>
          <th>Роль</th>
          <th>Дата создания</th>
          <th>Действие</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="user in users" :key="user.id">
          <td>{{ user.id }}</td>
          <td>{{ user.email }}</td>
          <td>{{ user.role_name }}</td>
          <td>{{ formatDate(user.created_at) }}</td>
          <td>
            <div class="actions">
              <button class="btn-edit" @click="editUser(user)">Изменить роль</button>
              <button class="btn-delete" @click="deleteUser(user.id)">Удалить</button>
            </div>
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <button class="btn-add" @click="openAddModal">Добавить</button>

    <!-- Модальное окно добавления -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal" @click.stop>
        <h3 class="modal-title">Добавить пользователя</h3>

        <div class="modal-form">
          <label class="form-label">Email</label>
          <input v-model="formData.email" type="email" placeholder="user@example.com" class="form-input" />

          <label class="form-label">Пароль</label>
          <input v-model="formData.password" type="password" placeholder="Введите пароль" class="form-input" />

          <label class="form-label">Роль</label>
          <select v-model="formData.role" class="form-input">
            <option value="user">Пользователь</option>
            <option value="admin">Администратор</option>
          </select>

          <button class="form-btn-submit" @click="addUser">Добавить</button>
          <button class="form-btn-cancel" @click="closeModals">Отмена</button>
        </div>
      </div>
    </div>

    <!-- Модальное окно редактирования роли -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal" @click.stop>
        <h3 class="modal-title">Изменить роль пользователя</h3>

        <div class="modal-form">
          <label class="form-label">Email (не изменяется)</label>
          <input :value="editingUser.email" type="email" disabled class="form-input disabled-input" />

          <label class="form-label">Роль</label>
          <select v-model="editingUser.role" class="form-input">
            <option value="user">Пользователь</option>
            <option value="admin">Администратор</option>
          </select>

          <button class="form-btn-submit" @click="updateUserRole">Сохранить</button>
          <button class="form-btn-cancel" @click="closeModals">Отмена</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';

const users = ref([]);
const showAddModal = ref(false);
const showEditModal = ref(false);
const formData = ref({
  email: '',
  password: '',
  role: 'user'
});
const editingUser = ref({
  id: null,
  email: '',
  role: ''
});

const token = localStorage.getItem('token');

onMounted(async () => {
  await loadUsers();
});

watch([showAddModal, showEditModal], ([isAddOpen, isEditOpen]) => {
  if (isAddOpen || isEditOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});

async function loadUsers() {
  try {
    const res = await fetch('/api/admin/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    users.value = await res.json();
  } catch (e) {
    users.value = [];
    alert('Ошибка загрузки пользователей');
  }
}

function openAddModal() {
  formData.value = {
    email: '',
    password: '',
    role: 'user'
  };
  showAddModal.value = true;
}

function editUser(user) {
  editingUser.value = {
    id: user.id,
    email: user.email,
    role: user.role || 'user'
  };
  showEditModal.value = true;
}

function closeModals() {
  showAddModal.value = false;
  showEditModal.value = false;
  formData.value = {
    email: '',
    password: '',
    role: 'user'
  };
  editingUser.value = {
    id: null,
    email: '',
    role: ''
  };
}

async function addUser() {
  if (!formData.value.email || !formData.value.password) {
    alert('Заполните все поля');
    return;
  }

  try {
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData.value)
    });

    if (!res.ok) {
      const error = await res.json();
      alert(error.error || 'Ошибка добавления');
      return;
    }

    await loadUsers();
    closeModals();
    alert('Пользователь добавлен');
  } catch (e) {
    alert('Ошибка добавления');
  }
}

async function updateUserRole() {
  if (!editingUser.value.role) {
    alert('Выберите роль');
    return;
  }

  try {
    const res = await fetch(`/api/admin/users/${editingUser.value.id}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ role: editingUser.value.role })
    });

    if (!res.ok) {
      const error = await res.json();
      alert(error.error || 'Ошибка обновления');
      return;
    }

    await loadUsers();
    closeModals();
    alert('Роль обновлена');
  } catch (e) {
    alert('Ошибка обновления');
  }
}

async function deleteUser(id) {
  if (!confirm('Вы уверены? Это действие необратимо.')) return;

  try {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      alert('Ошибка удаления');
      return;
    }

    await loadUsers();
    alert('Пользователь удалён');
  } catch (e) {
    alert('Ошибка удаления');
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
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

.disabled-input {
  background: #f3f4f6;
  color: #6b7280;
  cursor: not-allowed;
  opacity: 0.6;
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
