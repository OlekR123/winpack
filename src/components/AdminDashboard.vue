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
            <div class="profile-menu-header">{{ authStore.userEmail }}</div>
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
          <img :src="img.settings" alt="" class="menu-icon" />
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

        <AdminCategories v-if="currentPage === 'categories'" />
        <AdminPrograms v-if="currentPage === 'programs'" />
        <AdminSettings v-if="currentPage === 'settings'" />
        <AdminUsers v-if="currentPage === 'users'" />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue';
import { images as img } from '../assets/images.js';
import { useAuthStore } from '../stores/auth.js';
import * as adminApi from '../api/admin.js';
import AdminCategories from './AdminCategories.vue';
import AdminPrograms from './AdminPrograms.vue';
import AdminSettings from './AdminSettings.vue';
import AdminUsers from './AdminUsers.vue';

const authStore = useAuthStore();

const isAdmin = ref(false);
const currentPage = ref('dashboard');
const profileMenuOpen = ref(false);

const settingsStats = ref([]);
const popularSettings = ref([]);
const recommendedForRemoval = ref([]);

const chartCanvas = ref(null);

function reloadPage() {
  window.location.reload();
}

function toggleProfileMenu() {
  profileMenuOpen.value = !profileMenuOpen.value;
}

function handleLogout() {
  authStore.logout();
  window.location.href = '/';
}

async function loadDashboardData() {
  try {
    const [stats, popular, removal] = await Promise.all([
      adminApi.fetchSettingsStats(),
      adminApi.fetchPopularSettings(),
      adminApi.fetchRecommendedRemoval()
    ]);

    settingsStats.value = stats;
    popularSettings.value = popular;
    recommendedForRemoval.value = removal;

    await nextTick();
    renderChart();
  } catch (e) {
    console.error('Dashboard load error:', e);
  }
}

function renderChart() {
  const canvas = chartCanvas.value;
  if (!canvas || settingsStats.value.length === 0) return;

  const ctx = canvas.getContext('2d');
  const data = settingsStats.value;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;
  const padding = { top: 30, right: 30, bottom: 80, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  ctx.clearRect(0, 0, width, height);

  const maxVal = Math.max(...data.map(d => d.usage_percentage), 1);
  const barWidth = Math.min(chartWidth / data.length * 0.6, 60);
  const gap = (chartWidth - barWidth * data.length) / (data.length + 1);

  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = padding.top + chartHeight - (chartHeight * i / 5);
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`${(maxVal * i / 5).toFixed(0)}%`, padding.left - 10, y + 4);
  }

  data.forEach((item, i) => {
    const x = padding.left + gap + i * (barWidth + gap);
    const barHeight = (item.usage_percentage / maxVal) * chartHeight;
    const y = padding.top + chartHeight - barHeight;

    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    const radius = 4;
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + barWidth - radius, y);
    ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
    ctx.lineTo(x + barWidth, padding.top + chartHeight);
    ctx.lineTo(x, padding.top + chartHeight);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.fill();

    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${item.usage_percentage.toFixed(1)}%`, x + barWidth / 2, y - 8);

    ctx.fillStyle = '#1f2937';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';

    const label = item.category_title;
    const maxLabelWidth = barWidth + gap * 0.8;
    let displayLabel = label;
    while (ctx.measureText(displayLabel).width > maxLabelWidth && displayLabel.length > 3) {
      displayLabel = displayLabel.slice(0, -1);
    }
    if (displayLabel !== label) displayLabel += '...';

    ctx.save();
    ctx.translate(x + barWidth / 2, padding.top + chartHeight + 15);
    ctx.rotate(-Math.PI / 6);
    ctx.fillText(displayLabel, 0, 0);
    ctx.restore();
  });
}

watch(currentPage, (val) => {
  if (val === 'dashboard') {
    loadDashboardData();
  }
});

onMounted(async () => {
  if (!authStore.isAdmin) {
    window.location.href = '/';
    return;
  }

  isAdmin.value = true;
  await loadDashboardData();

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.profile-info')) {
      profileMenuOpen.value = false;
    }
  });
});
</script>

<style scoped>
.hero {
  background: #1f2937; color: #fff;
  border-bottom-left-radius: 1.25vw; border-bottom-right-radius: 1.25vw;
  padding-bottom: 3.125vw;
  position: relative;
}

.hero-row { display: flex; align-items: center; justify-content: space-between; padding: 0.5208vw 1.9271vw; }

.logo-btn { background: transparent; border: none; cursor: pointer; padding: 0; display: flex; align-items: center; justify-content: center; transition: filter 0.15s ease; }
.logo-btn:hover { filter: drop-shadow(0 0 8px rgba(250, 204, 21, 0.6)); }
.logo-btn img { width: 2.0833vw; height: 2.8125vw; object-fit: contain; }

.profile-info { display: flex; align-items: center; gap: 0.7813vw; position: relative; }

.profile-btn { width: 2.0833vw; height: 2.0833vw; background: transparent; border: none; padding: 0; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: filter 0.15s ease; }
.profile-btn:hover { filter: drop-shadow(0 0 8px rgba(250, 204, 21, 0.6)); }
.profile-icon { width: 100%; height: 100%; object-fit: contain; }

.profile-menu { position: absolute; top: 100%; right: 0; background: #fff; border-radius: 0.5vw; min-width: 12vw; box-shadow: 0 0.3125vw 0.8333vw rgba(0,0,0,0.15); margin-top: 0.5vw; overflow: hidden; animation: menuSlideIn 0.15s ease; z-index: 10001; }
@keyframes menuSlideIn { from { opacity: 0; transform: translateY(-0.5vw); } to { opacity: 1; transform: translateY(0); } }
.profile-menu-header { padding: 0.65vw 1vw; background: #f7f7f7; color: #1f2937; font-size: 0.8333vw; line-height: 1.2; border-bottom: 1px solid #e5e7eb; word-break: break-all; }
.profile-menu-logout { width: 100%; display: flex; align-items: center; gap: 0.5vw; padding: 0.65vw 1vw; background: transparent; border: none; color: #1f2937; font-size: 1vw; font-weight: 400; font-family: inherit; cursor: pointer; transition: color 0.15s ease, opacity 0.15s ease; line-height: 1.2; text-align: left; }
.profile-menu-logout:hover { color: #4b5563; opacity: 0.9; }
.profile-menu-icon { width: 1vw; height: 1vw; object-fit: contain; }

.hero-middle { display: flex; align-items: center; justify-content: space-between; margin: 1.5vw 17.4479vw 0; }
.hero-center { flex: 1; text-align: center; color: #facc15; padding: 3.125vw 0; }
.title { font-size: 2.7083vw; margin: 0; line-height: 1.1; }
.subtitle { color: #fff; font-size: 1.25vw; margin: 0.4167vw 0 0; line-height: 1.3; }
.decor-hero-left-top, .decor-hero-right-bottom { height: 2.6042vw; pointer-events: none; }
.decor-hero-left-top { align-self: flex-start; }
.decor-hero-right-bottom { align-self: flex-end; }

.admin-wrapper { display: flex; margin: 3.125vw 17.4479vw; gap: 3.125vw; min-height: 60vh; }

.admin-menu { display: flex; flex-direction: column; gap: 0.5208vw; width: 14.5833vw; flex-shrink: 0; }

.menu-btn { display: flex; align-items: center; gap: 0.7813vw; padding: 0.7813vw 1.0417vw; background: #f7f7f7; border: none; border-radius: 0.5208vw; cursor: pointer; transition: background 0.15s ease, transform 0.15s ease; font-family: inherit; }
.menu-btn:hover { background: #e5e7eb; }
.menu-btn.active { background: #facc15; }
.menu-icon { width: 1.25vw; height: 1.25vw; object-fit: contain; }
.menu-text { font-size: 1.0417vw; color: #1f2937; font-weight: 400; line-height: 1.2; }

.admin-content { flex: 1; min-width: 0; }

.dashboard-page { width: 100%; }

.program-section { padding: 0; }
.program-section.bg-white { background: #ffffff; }
.section-header { margin: 0 0 1.5625vw 0; }
.section-title { font-size: 2.0833vw; line-height: 1.1; color: #1f2937; margin: 0; font-weight: 400; }

.chart-wrapper { background: #ffffff; border-radius: 1.25vw; padding: 1.5625vw; margin-bottom: 3.125vw; }
.chart-wrapper canvas { width: 100%; height: 25vw; display: block; }

.settings-block { background: #f7f7f7; border-radius: 0.8333vw; padding: 1.5625vw; margin-bottom: 1.5625vw; }
.settings-block-title { font-size: 1.25vw; color: #1f2937; margin: 0 0 1.0417vw 0; font-weight: 400; line-height: 1.4; }
.settings-list { display: flex; flex-direction: column; gap: 0.5208vw; }
.setting-text { font-size: 1.0417vw; color: #1f2937; margin: 0; line-height: 1.4; padding: 0.3906vw 0; }
.setting-text-empty { font-size: 1.0417vw; color: #9ca3af; margin: 0; line-height: 1.4; font-style: italic; }

@media (max-width: 1200px) {
  .hero-row { padding: 10px 30px; }
  .logo-btn img { width: 36px; height: 48px; }
  .profile-info { gap: 12px; }
  .profile-btn { width: 36px; height: 36px; }
  .profile-menu { min-width: 160px; border-radius: 8px; margin-top: 8px; }
  .profile-menu-header { padding: 10px 16px; font-size: 14px; }
  .profile-menu-logout { padding: 10px 16px; font-size: 16px; gap: 8px; }
  .profile-menu-icon { width: 16px; height: 16px; }
  .hero-middle { margin: 24px 60px 0; }
  .hero-center { padding: 40px 0; }
  .title { font-size: 36px; }
  .subtitle { font-size: 18px; }
  .decor-hero-left-top, .decor-hero-right-bottom { height: 32px; }
  .admin-wrapper { margin: 40px 60px; gap: 30px; }
  .admin-menu { width: 200px; gap: 8px; }
  .menu-btn { padding: 12px 16px; gap: 12px; border-radius: 8px; }
  .menu-icon { width: 20px; height: 20px; }
  .menu-text { font-size: 16px; }
  .section-title { font-size: 28px; }
  .chart-wrapper { border-radius: 16px; padding: 24px; margin-bottom: 30px; }
  .chart-wrapper canvas { height: 300px; }
  .settings-block { border-radius: 12px; padding: 24px; margin-bottom: 20px; }
  .settings-block-title { font-size: 20px; margin-bottom: 16px; }
  .setting-text { font-size: 16px; padding: 6px 0; }
  .setting-text-empty { font-size: 16px; }
}

@media (max-width: 768px) {
  .hero { border-radius: 0; }
  .hero-row { padding: 12px 24px; }
  .logo-btn img { width: 32px; height: 42px; }
  .profile-info { gap: 10px; }
  .profile-btn { width: 32px; height: 32px; }
  .profile-menu { min-width: 140px; border-radius: 6px; margin-top: 6px; }
  .profile-menu-header { padding: 8px 12px; font-size: 12px; }
  .profile-menu-logout { padding: 8px 12px; font-size: 14px; gap: 6px; }
  .profile-menu-icon { width: 14px; height: 14px; }
  .hero-middle { margin: 20px 24px 0; }
  .hero-center { padding: 32px 0; }
  .title { font-size: 28px; }
  .subtitle { font-size: 15px; }
  .decor-hero-left-top { width: 80px; height: auto; }
  .decor-hero-right-bottom { width: 70px; height: auto; }
  .admin-wrapper { margin: 24px; gap: 20px; flex-direction: column; }
  .admin-menu { width: 100%; flex-direction: row; overflow-x: auto; gap: 6px; }
  .menu-btn { padding: 10px 14px; gap: 8px; border-radius: 6px; white-space: nowrap; }
  .menu-icon { width: 18px; height: 18px; }
  .menu-text { font-size: 14px; }
  .section-title { font-size: 24px; }
  .chart-wrapper { border-radius: 12px; padding: 16px; margin-bottom: 24px; }
  .chart-wrapper canvas { height: 250px; }
  .settings-block { border-radius: 8px; padding: 20px; margin-bottom: 16px; }
  .settings-block-title { font-size: 18px; margin-bottom: 12px; }
  .setting-text { font-size: 14px; padding: 4px 0; }
  .setting-text-empty { font-size: 14px; }
}
</style>