<template>
  <div v-if="isAdmin">
    <header class="hero">
      <div class="hero-row">
        <button class="logo-btn" @click="reloadPage">
          <img :src="img.logo" alt="WinPack" />
        </button>

        <div class="profile-info">
          <button class="profile-btn" @click="toggleProfileMenu">
            <img :src="img.profile" alt="Профиль" class="profile-icon" />
          </button>

          <div v-if="profileMenuOpen" class="profile-menu" @click.stop>
            <div class="profile-menu-header">{{ userEmail }}</div>
            <button class="profile-menu-logout" @click="handleLogout">
              <img :src="img.logout" alt="" class="profile-menu-icon" />
              Выход
            </button>
          </div>
        </div>
      </div>

      <div class="hero-middle">
        <img class="decor-hero-left-top" :src="img.decorHeroLeftTop" alt="" aria-hidden="true" />
        <div class="hero-center">
          <h1 class="title">WinPack</h1>
          <p class="subtitle">Приветствуем, администратор!</p>
        </div>
        <img class="decor-hero-right-bottom" :src="img.decorHeroRightBottom" alt="" aria-hidden="true" />
      </div>
    </header>

    <div class="admin-wrapper">
      <aside class="admin-menu">
        <button class="menu-btn" :class="{ active: currentPage === 'dashboard' }" @click="currentPage = 'dashboard'">
          <img :src="img.stats" alt="" class="menu-icon" />
          <span class="menu-text">Статистика</span>
        </button>
        <button class="menu-btn" :class="{ active: currentPage === 'categories' }" @click="currentPage = 'categories'">
          <img :src="img.category" alt="" class="menu-icon" />
          <span class="menu-text">Категории</span>
        </button>
        <button class="menu-btn" :class="{ active: currentPage === 'programs' }" @click="currentPage = 'programs'">
          <img :src="img.program" alt="" class="menu-icon" />
          <span class="menu-text">Программы</span>
        </button>
        <button class="menu-btn" :class="{ active: currentPage === 'settings' }" @click="currentPage = 'settings'">
          <img :src="img.settingsIcon" alt="" class="menu-icon" />
          <span class="menu-text">Настройки</span>
        </button>
        <button class="menu-btn" :class="{ active: currentPage === 'users' }" @click="currentPage = 'users'">
          <img :src="img.user" alt="" class="menu-icon" />
          <span class="menu-text">Пользователи</span>
        </button>
      </aside>

      <main class="admin-content">
        <div v-show="currentPage === 'dashboard'" class="dashboard-page">
          <section class="program-section bg-white">
            <div class="section-header">
              <h2 class="section-title">Статистика настроек</h2>
            </div>

            <div class="chart-wrapper">
              <canvas ref="chartCanvas" width="800" height="400"></canvas>
            </div>
          </section>

          <div class="settings-block">
            <h3 class="settings-block-title">Популярные настройки</h3>
            <div class="settings-list">
              <p v-for="setting in popularSettings" :key="setting.id" class="setting-text">
                {{ setting.label }}
              </p>
              <p v-if="popularSettings.length === 0" class="setting-text-empty">Нет данных</p>
            </div>
          </div>

          <div class="settings-block">
            <h3 class="settings-block-title">Рекомендуемые к удалению</h3>
            <div class="settings-list">
              <p v-for="setting in recommendedForRemoval" :key="setting.id" class="setting-text">
                {{ setting.label }}
              </p>
              <p v-if="recommendedForRemoval.length === 0" class="setting-text-empty">Нет данных</p>
            </div>
          </div>
        </div>

        <div v-show="currentPage === 'categories'">
          <AdminCategories />
        </div>
        <div v-show="currentPage === 'programs'">
          <AdminPrograms />
        </div>
        <div v-show="currentPage === 'settings'">
          <AdminSettings />
        </div>
        <div v-show="currentPage === 'users'">
          <AdminUsers />
        </div>
      </main>
    </div>
  </div>

  <div v-else class="not-authorized">
    <p>У вас нет доступа к админ-панели</p>
    <button @click="goHome">Вернуться на главную</button>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, onBeforeUnmount } from 'vue';
import AdminCategories from './AdminCategories.vue';
import AdminPrograms from './AdminPrograms.vue';
import AdminSettings from './AdminSettings.vue';
import AdminUsers from './AdminUsers.vue';

const img = {
  logo: 'https://res.cloudinary.com/dzvnjlguu/image/upload/v1760280445/Icon_yj8axe.png',
  profile: 'https://res.cloudinary.com/dzvnjlguu/image/upload/v1760280444/Profile_izx49u.png',
  logout: 'https://res.cloudinary.com/dzvnjlguu/image/upload/v1761996213/Exit_jcglqc.png',
  decorHeroLeftTop: 'https://res.cloudinary.com/dzvnjlguu/image/upload/v1760465453/left_dots_header_rxpnff.png',
  decorHeroRightBottom: 'https://res.cloudinary.com/dzvnjlguu/image/upload/v1760291982/right_dots_header_tw0x84.png',
  stats: 'https://res.cloudinary.com/dzvnjlguu/image/upload/v1762605630/stats_clkije.png',
  category: 'https://res.cloudinary.com/dzvnjlguu/image/upload/v1762605630/category_uehcbq.png',
  program: 'https://res.cloudinary.com/dzvnjlguu/image/upload/v1762605630/program_l1f4gc.png',
  settingsIcon: 'https://res.cloudinary.com/dzvnjlguu/image/upload/v1762605630/settings_glkmf7.png',
  user: 'https://res.cloudinary.com/dzvnjlguu/image/upload/v1762605630/user_yvunvg.png'
};

const isAdmin = ref(false);
const currentPage = ref('dashboard');
const userEmail = ref('');
const profileMenuOpen = ref(false);

const chartCanvas = ref(null);
const statsData = ref([]);
const popularSettings = ref([]);
const recommendedForRemoval = ref([]);

onMounted(async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/';
    return;
  }

  const userInfo = localStorage.getItem('userInfo');
  if (userInfo) {
    try {
      const parsed = JSON.parse(userInfo);
      userEmail.value = parsed.email;
    } catch (e) {
      userEmail.value = 'Неизвестный пользователь';
    }
  }

  try {
    const res = await fetch('/api/auth/check-admin', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      window.location.href = '/';
      return;
    }

    const data = await res.json();
    isAdmin.value = data.isAdmin;

    if (!isAdmin.value) {
      window.location.href = '/';
      return;
    }

    await loadDashboardData();
  } catch (e) {
    window.location.href = '/';
  }

  document.addEventListener('click', closeProfileMenu);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', closeProfileMenu);
});

async function loadDashboardData() {
  await Promise.all([
    loadSettingsStats(),
    loadPopularSettings(),
    loadRecommendedSettings()
  ]);
}

async function loadSettingsStats() {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/admin/settings-stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      throw new Error('Не удалось загрузить статистику');
    }

    const data = await res.json();
    statsData.value = data;

    await nextTick();
    await nextTick();

    setTimeout(() => {
      if (chartCanvas.value) {
        drawChart();
      }
    }, 200);
  } catch (e) {
    statsData.value = [];
  }
}

async function loadPopularSettings() {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/admin/popular-settings?limit=3', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Не удалось загрузить популярные настройки');
    const data = await res.json();
    popularSettings.value = data;
  } catch (e) {
    popularSettings.value = [];
  }
}

async function loadRecommendedSettings() {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/admin/recommended-removal?limit=3', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Не удалось загрузить рекомендуемые к удалению');
    const data = await res.json();
    recommendedForRemoval.value = data;
  } catch (e) {
    recommendedForRemoval.value = [];
  }
}

function drawChart() {
  const canvas = chartCanvas.value;
  if (!canvas) {
    return;
  }

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  if (!statsData.value || statsData.value.length === 0) {
    ctx.fillStyle = '#6B7280';
    ctx.font = '18px "Zen Kurenaido"';
    ctx.textAlign = 'center';
    ctx.fillText('Нет данных для отображения', width / 2, height / 2);
    return;
  }

  const padding = 60;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const labels = statsData.value.map(item => item.category_title);
  const values = statsData.value.map(item => parseFloat(item.usage_percentage));
  const maxValue = Math.max(...values, 10);

  const colors = [
    { fill: 'rgba(139, 92, 246, 0.8)', border: 'rgb(139, 92, 246)' },
    { fill: 'rgba(245, 158, 11, 0.8)', border: 'rgb(245, 158, 11)' },
    { fill: 'rgba(16, 185, 129, 0.8)', border: 'rgb(16, 185, 129)' }
  ];

  ctx.strokeStyle = '#E5E7EB';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();

  const barWidth = Math.min((chartWidth / labels.length) - 40, 100);
  const barSpacing = (chartWidth - barWidth * labels.length) / (labels.length + 1);

  labels.forEach((label, index) => {
    const value = values[index];
    const barHeight = (value / maxValue) * chartHeight * 0.8;
    const x = padding + barSpacing * (index + 1) + barWidth * index;
    const y = height - padding - barHeight;

    const color = colors[index % colors.length];

    ctx.fillStyle = color.fill;
    ctx.fillRect(x, y, barWidth, barHeight);

    ctx.strokeStyle = color.border;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, barWidth, barHeight);

    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 20px "Zen Kurenaido"';
    ctx.textAlign = 'center';
    ctx.fillText(`${value.toFixed(0)}%`, x + barWidth / 2, y - 12);

    ctx.font = '14px "Zen Kurenaido"';
    ctx.fillStyle = '#6B7280';

    const words = label.split(' ');
    let line = '';
    let lineY = height - padding + 20;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);

      if (metrics.width > barWidth + 20 && i > 0) {
        ctx.fillText(line.trim(), x + barWidth / 2, lineY);
        line = words[i] + ' ';
        lineY += 16;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), x + barWidth / 2, lineY);
  });
}

watch(currentPage, (newPage) => {
  if (newPage === 'dashboard') {
    nextTick(() => {
      setTimeout(() => {
        if (chartCanvas.value && statsData.value.length > 0) {
          drawChart();
        }
      }, 100);
    });
  }
});

function reloadPage() {
  window.location.reload();
}

function goHome() {
  window.location.href = '/';
}

function toggleProfileMenu() {
  profileMenuOpen.value = !profileMenuOpen.value;
}

function closeProfileMenu(e) {
  if (!e.target.closest('.profile-info')) {
    profileMenuOpen.value = false;
  }
}

function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userInfo');
  window.location.href = '/';
}
</script>

<style scoped>
* { box-sizing: border-box; }

.hero {
  background: #1f2937;
  color: #fff;
  border-bottom-left-radius: 1.25vw;
  border-bottom-right-radius: 1.25vw;
  padding-bottom: 3.125vw;
  position: relative;
}

.hero-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5208vw 1.9271vw;
}

.logo-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: filter 0.15s ease;
}

.logo-btn:hover { filter: drop-shadow(0 0 8px rgba(250, 204, 21, 0.6)); }

.logo-btn img { width: 2.0833vw; height: 2.8125vw; object-fit: contain; }

.profile-info {
  display: flex;
  align-items: center;
  gap: 0.7813vw;
  position: relative;
}

.profile-btn {
  width: 2.0833vw;
  height: 2.0833vw;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: filter 0.15s ease;
}

.profile-btn:hover { filter: drop-shadow(0 0 8px rgba(250, 204, 21, 0.6)); }

.profile-icon { width: 100%; height: 100%; object-fit: contain; }

.profile-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: #fff;
  border-radius: 0.5vw;
  min-width: 12vw;
  box-shadow: 0 0.3125vw 0.8333vw rgba(0,0,0,0.15);
  margin-top: 0.5vw;
  overflow: hidden;
  animation: menuSlideIn 0.15s ease;
  z-index: 10001;
}

@keyframes menuSlideIn {
  from { opacity: 0; transform: translateY(-0.5vw); }
  to { opacity: 1; transform: translateY(0); }
}

.profile-menu-header {
  padding: 0.65vw 1vw;
  background: #f7f7f7;
  color: #1f2937;
  font-size: 0.8333vw;
  line-height: 1.2;
  border-bottom: 1px solid #e5e7eb;
  word-break: break-all;
}

.profile-menu-logout {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5vw;
  padding: 0.65vw 1vw;
  background: transparent;
  border: none;
  color: #1f2937;
  font-size: 1vw;
  font-weight: 400;
  font-family: inherit;
  cursor: pointer;
  transition: color 0.15s ease, opacity 0.15s ease;
  line-height: 1.2;
  text-align: left;
}

.profile-menu-logout:hover { color: #4b5563; opacity: 0.9; }

.profile-menu-icon { width: 1vw; height: 1vw; object-fit: contain; }

.hero-middle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 1.5vw 17.4479vw 0;
}

.hero-center {
  flex: 1;
  text-align: center;
  color: #facc15;
  padding: 3.125vw 0;
}

.title {
  font-size: 2.7083vw;
  margin: 0;
  line-height: 1.1;
}

.subtitle {
  color: #fff;
  font-size: 1.25vw;
  margin: 0.4167vw 0 0;
  line-height: 1.3;
}

.decor-hero-left-top,
.decor-hero-right-bottom {
  height: 2.6042vw;
  pointer-events: none;
}

.decor-hero-left-top { align-self: flex-start; }
.decor-hero-right-bottom { align-self: flex-end; }

.admin-wrapper {
  display: flex;
  flex: 1;
  max-width: 100%;
  width: 100%;
  gap: 1.5625vw;
  padding: 0 17.4479vw;
  margin-top: 3.125vw;
}

.admin-menu {
  display: flex;
  flex-direction: column;
  width: 14vw;
  gap: 1.5625vw;
  flex-shrink: 0;
  margin-bottom: 3.125vw;
}

.menu-btn {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.5vw;
  padding: 1.5vw 2vw 1.5vw 2vw;
  background: #f7f7f7;
  border: none;
  border-radius: 0.8333vw;
  cursor: pointer;
  transition: none;
  box-shadow: none;
  color: #1f2937;
  font-size: 1.25vw;
  font-weight: 400;
  font-family: inherit;
  text-align: left;
}

.menu-btn .menu-icon {
  width: 1.7vw;
  height: auto;
  object-fit: contain;
  flex-shrink: 0;
}

.menu-btn .menu-text {
  transition: color 0.15s ease, opacity 0.15s ease;
  position: relative;
}

.menu-btn:hover .menu-text {
  color: #4b5563;
  opacity: 0.9;
}

.menu-btn.active .menu-text {
  text-decoration: underline;
  text-decoration-color: #1f2937;
  text-decoration-thickness: 0.1042vw;
  text-underline-offset: 0.2083vw;
}

.admin-content {
  flex: 1;
}

.dashboard-page {
  width: 100%;
}

.program-section {
  padding: 3.125vw;
}

.program-section.bg-white {
  background: #ffffff;
  border-radius: 1.25vw;
}

.section-header {
  margin-bottom: 3.125vw;
}

.section-title {
  font-size: 2.0833vw;
  line-height: 1.1;
  color: #1f2937;
  margin: 0;
}

.chart-wrapper {
  background: #fff;
  border-radius: 1.0417vw;
  display: flex;
  justify-content: center;
  align-items: center;
}

canvas {
  max-width: 100%;
  height: auto;
}

.settings-block {
  background: #f7f7f7;
  border-radius: 0.8333vw;
  padding: 1.5625vw;
  margin-bottom: 3.125vw;
}

.settings-block-title {
  font-size: 1.25vw;
  color: #1f2937;
  margin: 0 0 1.0417vw 0;
  font-weight: 400;
  line-height: 1.4;
}

.settings-list {
  display: flex;
  flex-direction: column;
  gap: 0.7813vw;
}

.setting-text {
  font-size: 1.0417vw;
  color: #1f2937;
  line-height: 1.4;
  margin: 0;
}

.setting-text-empty {
  font-size: 1.0417vw;
  color: #6B7280;
  line-height: 1.4;
  margin: 0;
  font-style: italic;
}

.not-authorized {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f5f5f5;
  gap: 1.0417vw;
}

.not-authorized p {
  font-size: 1.25vw;
  color: #1f2937;
  margin: 0;
}

.not-authorized button {
  padding: 0.4167vw 0.8333vw;
  background: #facc15;
  color: #1f2937;
  border: none;
  border-radius: 0.2083vw;
  font-size: 1.0417vw;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.not-authorized button:hover {
  transform: translateY(-0.1042vw);
  box-shadow: 0 0.2083vw 0.4167vw rgba(0, 0, 0, 0.2);
}
</style>

