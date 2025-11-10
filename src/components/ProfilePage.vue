<template>
  <div>
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
            <button class="profile-menu-logout" @click="confirmLogout">
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
          <p class="subtitle">Быстрый способ превратить чистую Windows<br />в удобную систему</p>
        </div>
        <img class="decor-hero-right-bottom" :src="img.decorHeroRightBottom" alt="" aria-hidden="true" />
      </div>
    </header>

    <div v-if="showWelcomeToast" class="welcome-toast">
      Приветствуем! Теперь вы можете выбирать настройки
    </div>

    <main class="container">
      <section class="section">
        <h2 class="section-title">Драйверы</h2>
        <div class="cards-3">
          <a v-for="d in drivers" :key="d.name" :href="d.url" target="_blank" rel="noopener" class="card link-card">
            <img :src="d.img" :alt="d.name" class="card-img" />
            <div class="card-title">{{ d.name }}</div>
          </a>
        </div>
      </section>
    </main>

    <section
        v-for="(cat, idx) in categories"
        :key="cat.id"
        :class="['program-section', idx % 2 === 0 ? 'bg-gray' : 'bg-white']"
    >
      <div class="section-header">
        <h2 class="section-title">{{ cat.title }}</h2>
        <div class="section-arrows">
          <button
              class="section-arrow"
              :class="{ disabled: canScrollLeft(cat.id) === false }"
              @click="scrollCategory(cat.id, -1)"
              :disabled="canScrollLeft(cat.id) === false"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#1F2937" stroke-width="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <button
              class="section-arrow"
              :class="{ disabled: canScrollRight(cat.id) === false }"
              @click="scrollCategory(cat.id, 1)"
              :disabled="canScrollRight(cat.id) === false"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#1F2937" stroke-width="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>
      <div class="section-wrapper">
        <div class="section-track" :style="{ transform: `translateX(${categoryOffsets[cat.id] || 0}px)` }">
          <div v-for="p in categoryPrograms[cat.id]" :key="p.id" class="program-card">
            <img :src="p.icon_url" class="program-icon" />
            <p class="program-desc">{{ p.description }}</p>
            <a :href="p.homepage_url" target="_blank" class="program-more">Узнать больше...</a>
            <a :href="p.download_url" target="_blank" class="program-btn">Установить</a>
          </div>
        </div>
      </div>
    </section>

    <section class="warning-section">
      <div class="warning-middle">
        <img class="warning-decor-left" :src="img.warningDotsLeft" alt="" aria-hidden="true" />
        <div class="warning-center">
          <p class="warning-title">Все установочные файлы на сайте размещены с официальных источников.</p>
          <p class="warning-text">Администрация не несёт ответственности за последствия загрузки, корректность работы программ или за их актуальность и версии. Ссылки на официальные ресурсы размещены.</p>
          <p class="warning-footer">Все права защищены.</p>
        </div>
        <img class="warning-decor-right" :src="img.warningDotsRight" alt="" aria-hidden="true" />
      </div>
    </section>

    <main class="container">
      <section class="section">
        <h2 class="section-title">Настройки Windows</h2>

        <div v-for="setCat in settingCategories" :key="setCat.id" class="settings-block">
          <h3 class="settings-block-title">{{ setCat.title }}</h3>
          <div class="settings-list">
            <label v-for="setting in categorySettings[setCat.id]" :key="setting.id" class="setting-item">
              <input
                  v-model="selectedSettings[setting.id]"
                  type="checkbox"
                  class="setting-checkbox"
                  :value="setting.id"
              />
              <span class="setting-label">{{ setting.label }}</span>
            </label>
          </div>
        </div>

        <button class="config-button" @click="downloadConfig" :disabled="configLoading">
          {{ configLoading ? 'Создание конфига...' : 'Установить конфиг' }}
        </button>
      </section>
    </main>

    <section class="warning-section-2">
      <div class="warning-middle-2">
        <img class="warning-decor-left-2" :src="img.settingsDotsLeft" alt="" aria-hidden="true" />
        <div class="warning-center-2">
          <p class="warning-title-2">Будьте внимательны при выборе параметров настройки Windows.</p>
          <p class="warning-text-2">Изменение некоторых из них может повлиять на работу системы. Если вы не уверены, что делает настройка — лучше не включайте её.</p>
          <p class="warning-footer-2">Администрация сайта не несёт ответственность за ваш выбор.</p>
        </div>
        <img class="warning-decor-right-2" :src="img.settingsDotsRight" alt="" aria-hidden="true" />
      </div>
    </section>

    <section class="feedback-section">
      <div class="feedback-container">
        <img class="feedback-qr" :src="img.qrcode" alt="QR-код" />
        <div class="feedback-content">
          <h2 class="feedback-title">Хотите что-то предложить или обсудить?</h2>
          <p class="feedback-text">Просто отсканируйте QR-код, чтобы быстро связаться с нами<br />и поделиться своими идеями или отзывами.</p>
          <p class="feedback-footer">Мы всегда рады помочь и обсудить новые идеи, чтобы сделать проект ещё полезнее для вас.</p>
        </div>
      </div>
    </section>

    <footer class="footer">
      <div class="footer-content">
        <p class="footer-title">Наши соцсети</p>
        <nav class="footer-links">
          <a href="https://vk.com/darouuuu" target="_blank" rel="noopener" class="footer-link">VK</a>
          <a href="https://t.me/ouleck" target="_blank" rel="noopener" class="footer-link">Telegram</a>
          <a href="https://discord.com/users/870059133745897484" target="_blank" rel="noopener" class="footer-link">Discord</a>
        </nav>
      </div>
    </footer>

    <div v-if="showConfigGuide" class="auth-overlay" @click.self="closeConfigGuide">
      <div class="auth-modal config-modal-wide" @click.stop>
        <h3 class="auth-title">Конфиг скачан успешно</h3>
        <div class="config-guide">
          <p class="guide-text">Файл <strong>WinPackConfig.ps1</strong> загружен в папку Downloads.</p>

          <div class="guide-step">
            <p class="guide-step-label">Шаг 1: Откройте PowerShell от администратора</p>
            <p class="guide-step-desc">Нажмите Win + X и выберите "Windows PowerShell (администратор)"</p>
          </div>

          <div class="guide-step">
            <p class="guide-step-label">Шаг 2: Перейдите в папку Downloads</p>
            <p class="guide-step-desc">Выполните команду:</p>
            <code class="guide-code">cd $env:USERPROFILE\Downloads</code>
          </div>

          <div class="guide-step">
            <p class="guide-step-label">Шаг 3: Запустите скрипт</p>
            <p class="guide-step-desc">Выполните команду:</p>
            <code class="guide-code">.\WinPackConfig.ps1</code>
          </div>

          <div class="guide-step">
            <p class="guide-step-label">Важно: применение некоторых настроек требует перезагрузки системы</p>
          </div>
        </div>

        <button class="guide-button-close" @click="closeConfigGuide">Закрыть</button>
      </div>
    </div>

    <div v-if="showLogoutConfirm" class="auth-overlay" @click.self="closeLogoutModal">
      <div class="auth-modal" @click.stop>
        <h3 class="auth-title">Подтверждение выхода</h3>
        <div class="auth-form">
          <p class="logout-confirm-text">Вы уверены что хотите выйти из аккаунта?</p>
          <button class="auth-btn" @click="handleLogout">Выйти</button>
          <button class="auth-link-like" @click="closeLogoutModal">Отмена</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';

const img = {
  logo: 'https://res.cloudinary.com/dzvnjlguu/image/upload/v1760280445/Icon_yj8axe.png',
  profile: 'https://res.cloudinary.com/dzvnjlguu/image/upload/v1760280444/Profile_izx49u.png',
  logout: 'https://res.cloudinary.com/dzvnjlguu/image/upload/v1761996213/Exit_jcglqc.png',
  decorHeroLeftTop: 'https://res.cloudinary.com/dzvnjlguu/image/upload/v1760465453/left_dots_header_rxpnff.png',
  decorHeroRightBottom: 'https://res.cloudinary.com/dzvnjlguu/image/upload/v1760291982/right_dots_header_tw0x84.png',
  warningDotsLeft: 'https://res.cloudinary.com/dzvnjlguu/image/upload/v1761480927/left_dots_wor_poyo2a.png',
  warningDotsRight: 'https://res.cloudinary.com/dzvnjlguu/image/upload/v1761480928/right_dots_wor_yilb62.png',
  settingsDotsLeft: 'https://res.cloudinary.com/dzvnjlguu/image/upload/v1761487521/left_dots_wor_set_fypkut.png',
  settingsDotsRight: 'https://res.cloudinary.com/dzvnjlguu/image/upload/v1761487524/right_dots_wor_set_vcuwui.png',
  qrcode: 'https://res.cloudinary.com/dzvnjlguu/image/upload/v1761491399/qrcode_fqmbqt.png'
};

const drivers = [
  {
    name: 'Nvidia',
    url: 'https://www.nvidia.com/Download/index.aspx',
    img: 'https://res.cloudinary.com/dzvnjlguu/image/upload/v1760468625/Nvidia_dejwaz.png'
  },
  {
    name: 'AMD',
    url: 'https://www.amd.com/en/support',
    img: 'https://res.cloudinary.com/dzvnjlguu/image/upload/v1760468624/AMD_lecgqy.png'
  },
  {
    name: 'Intel',
    url: 'https://www.intel.com/content/www/us/en/download-center/home.html',
    img: 'https://res.cloudinary.com/dzvnjlguu/image/upload/v1760468623/Intel_jwg3mj.png'
  }
];

const userEmail = ref('');
const userId = ref(null);
const categories = ref([]);
const categoryPrograms = reactive({});
const categoryOffsets = reactive({});
const categoryIndexes = reactive({});

const settingCategories = ref([]);
const categorySettings = reactive({});
const selectedSettings = reactive({});
const configLoading = ref(false);
const showLogoutConfirm = ref(false);
const showConfigGuide = ref(false);
const profileMenuOpen = ref(false);
const showWelcomeToast = ref(false);

let resizeTimeout;

onMounted(() => {
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
      userId.value = parsed.id;
    } catch (e) {
      userEmail.value = 'Неизвестный пользователь';
      window.location.href = '/';
    }
  }

  loadCategories();
  loadSettings();
  window.addEventListener('resize', handleResize);
  document.addEventListener('click', closeProfileMenu);

  showWelcomeToast.value = true;
  setTimeout(() => {
    showWelcomeToast.value = false;
  }, 4000);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  document.removeEventListener('click', closeProfileMenu);
});

function reloadPage() {
  window.location.reload();
}

function toggleProfileMenu() {
  profileMenuOpen.value = !profileMenuOpen.value;
}

function closeProfileMenu(e) {
  if (!e.target.closest('.profile-info')) {
    profileMenuOpen.value = false;
  }
}

function confirmLogout() {
  profileMenuOpen.value = false;
  showLogoutConfirm.value = true;
  document.body.style.overflow = 'hidden';
}

function closeLogoutModal() {
  showLogoutConfirm.value = false;
  document.body.style.overflow = 'auto';
}

function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userInfo');
  document.body.style.overflow = 'auto';
  window.location.href = '/';
}

function closeConfigGuide() {
  showConfigGuide.value = false;
  document.body.style.overflow = 'auto';
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

async function loadCategories() {
  try {
    const res = await fetch('/api/home/program-categories');
    categories.value = await res.json();

    for (const cat of categories.value) {
      const url = new URL('/api/home/programs', window.location.origin);
      url.searchParams.set('categoryId', cat.id);
      const progRes = await fetch(url);
      categoryPrograms[cat.id] = await progRes.json();
      categoryOffsets[cat.id] = 0;
      categoryIndexes[cat.id] = 0;
    }
  } catch (e) {
    categories.value = [];
  }
}

async function loadSettings() {
  try {
    const res = await fetch('/api/home/setting-categories');
    settingCategories.value = await res.json();

    for (const cat of settingCategories.value) {
      const url = new URL('/api/home/settings', window.location.origin);
      url.searchParams.set('categoryId', cat.id);
      const setRes = await fetch(url);
      categorySettings[cat.id] = await setRes.json();
    }

    await loadUserSettings();
  } catch (e) {
    settingCategories.value = [];
  }
}

async function loadUserSettings() {
  if (!userId.value) return;

  try {
    const res = await fetch(`/api/home/user-settings/${userId.value}`, {
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      return;
    }

    const userSettings = await res.json();

    for (const key in selectedSettings) {
      delete selectedSettings[key];
    }

    for (const setting of userSettings) {
      if (setting.enabled) {
        selectedSettings[setting.id] = true;
      }
    }
  } catch (e) {
    // Игнорируем ошибку загрузки пользовательских настроек
  }
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

const handleResize = () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    for (const catId of Object.keys(categoryOffsets)) {
      const { cardWidth, gap } = getScrollParams();
      const step = cardWidth + gap;
      categoryOffsets[catId] = -(categoryIndexes[catId] || 0) * step;
    }
  }, 150);
};

async function downloadConfig() {
  const selectedIds = Object.keys(selectedSettings)
      .filter(key => selectedSettings[key])
      .map(key => parseInt(key));

  if (selectedIds.length === 0) {
    alert('Выберите хотя бы одну настройку');
    return;
  }

  configLoading.value = true;

  try {
    const saveRes = await fetch(`/api/home/save-user-settings/${userId.value}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ settingIds: selectedIds })
    });

    if (!saveRes.ok) {
      const errorData = await saveRes.json();
      throw new Error(errorData.error || 'Не удалось сохранить настройки');
    }

    const scriptRes = await fetch(`/api/home/user-script/${userId.value}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!scriptRes.ok) {
      const errorData = await scriptRes.json();
      throw new Error(errorData.error || 'Не удалось создать скрипт');
    }

    const scriptText = await scriptRes.text();
    const blob = new Blob([scriptText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'WinPackConfig.ps1';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showConfigGuide.value = true;
    document.body.style.overflow = 'hidden';
  } catch (e) {
    alert(`Ошибка: ${e.message}`);
  } finally {
    configLoading.value = false;
  }
}

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}
</script>

<style scoped>
* { box-sizing: border-box; }

.container { max-width: 100vw; margin: 0 auto; }

.section { margin: 3.125vw 17.4479vw; }

.section-title {
  font-size: 2.0833vw;
  line-height: 1.1;
  color: #1f2937;
}

.hero {
  background: #1f2937; color: #fff;
  border-bottom-left-radius: 1.25vw; border-bottom-right-radius: 1.25vw;
  padding-bottom: 3.125vw;
  position: relative;
}

.hero-row { display: flex; align-items: center; justify-content: space-between; padding: 0.5208vw 1.9271vw; }

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

.profile-info { display: flex; align-items: center; gap: 0.7813vw; position: relative; }

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

.profile-menu-header { padding: 0.65vw 1vw; background: #f7f7f7; color: #1f2937; font-size: 0.8333vw; line-height: 1.2; border-bottom: 1px solid #e5e7eb; word-break: break-all; }

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

.hero-middle { display: flex; align-items: center; justify-content: space-between; margin: 1.5vw 17.4479vw 0; }

.hero-center { flex: 1; text-align: center; color: #facc15; padding: 3.125vw 0; }

.title { font-size: 2.7083vw; margin: 0; line-height: 1.1; }

.subtitle { color: #fff; font-size: 1.25vw; margin: 0.4167vw 0 0; line-height: 1.3; }

.decor-hero-left-top,
.decor-hero-right-bottom { height: 2.6042vw; pointer-events: none; }

.decor-hero-left-top { align-self: flex-start; }

.decor-hero-right-bottom { align-self: flex-end; }

.welcome-toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #facc15;
  color: #1f2937;
  padding: 14px 28px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  z-index: 9999;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

.cards-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3vw; margin-top: 3.125vw; }

.card { display: block; text-decoration: none; }

.card-img {
  width: 100%;
  border-radius: 1.0417vw;
  transition: transform .18s ease, box-shadow .18s ease;
  box-shadow: 0 0 0 rgba(0,0,0,0);
  will-change: transform, box-shadow;
}

.card:hover .card-img { transform: translateY(-0.3125vw); box-shadow: 0 .5208vw .9375vw rgba(0,0,0,.12); }

.card-title { margin-top: .5208vw; color: #1f2937; font-size: 1.25vw; line-height: 1.2; }

.program-section { padding: 3.125vw 0; }

.program-section.bg-gray { background: #f7f7f7; border-radius: 1.25vw; }

.program-section.bg-white { background: #ffffff; }

.section-header { display: flex; align-items: center; justify-content: space-between; margin: 0 17.4479vw 3.125vw; }

.section-arrows { display: flex; gap: 0.625vw; }

.section-arrow {
  width: 2.5vw;
  height: 2.5vw;
  border-radius: 50%;
  background: #facc15;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform .15s ease, box-shadow .15s ease, opacity .2s ease;
}

.section-arrow:hover:not(.disabled) { transform: translateY(-0.1042vw); box-shadow: 0 .4167vw .8333vw rgba(0,0,0,.12); }

.section-arrow.disabled { opacity: 0.4; cursor: not-allowed; }

.section-wrapper { margin: 0 17.4479vw; overflow: hidden; width: calc(20vw * 3 + 2.15vw * 2); }

.section-track { display: flex; gap: 2.15vw; transition: transform .6s cubic-bezier(0.4, 0.0, 0.2, 1); }

.program-card {
  flex: 0 0 20vw;
  width: 20vw;
  background: #fff;
  border-radius: 0.8333vw;
  padding: 2vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 25vw;
}

.program-section.bg-white .program-card { background: #f7f7f7; }

.program-icon { width: auto; height: 3.5vw; margin-bottom: 2.1vw; object-fit: contain; }

.program-desc { color: #1f2937; text-align: center; font-size: 1.25vw; line-height: 1.4; margin: 0 0 auto; }

.program-more { color: #1f2937; font-size: 1.25vw; text-decoration: none; margin: 1.2vw 0 0.6vw; transition: color .15s, opacity .15s; line-height: 1.2; }

.program-more:hover { color: #4b5563; opacity: .9; }

.program-btn {
  width: 70%;
  padding: 0.5vw 0.8vw;
  background: #facc15;
  color: #1f2937;
  border-radius: 0.4vw;
  text-decoration: none;
  font-weight: 500;
  font-size: 1.25vw;
  text-align: center;
  line-height: 1.2;
  display: inline-block;
  transition: transform .15s ease, box-shadow .15s ease;
  box-shadow: 0 0 0 rgba(0,0,0,0);
}

.program-btn:hover { transform: translateY(-0.0625vw); box-shadow: 0 .2083vw .4167vw rgba(0,0,0,.1); }

.warning-section,
.warning-section-2 { border-radius: 1.25vw; padding: 3.125vw 0; }

.warning-section { background: #facc15; }

.warning-section-2 { background: #f7f7f7; }

.warning-middle,
.warning-middle-2 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 17.4479vw;
  position: relative;
}

.warning-center,
.warning-center-2 { flex: 1; text-align: center; padding: 3.125vw 0; }

.warning-decor-left,
.warning-decor-right,
.warning-decor-left-2,
.warning-decor-right-2 { height: 2.6042vw; pointer-events: none; }

.warning-decor-left { align-self: flex-start; }

.warning-decor-right { align-self: flex-end; }

.warning-decor-left-2 { align-self: flex-end; }

.warning-decor-right-2 { align-self: flex-start; }

.warning-title,
.warning-title-2 {
  color: #1f2937;
  font-size: 1.25vw;
  line-height: 1.4;
  margin: 0 0 1.0417vw 0;
  font-weight: 400;
}

.warning-text,
.warning-text-2 {
  color: #1f2937;
  font-size: 1.0417vw;
  line-height: 1.5;
  margin: 0 0 1.0417vw 0;
  font-weight: 300;
}

.warning-footer,
.warning-footer-2 { color: #1f2937; font-size: 1.0417vw; line-height: 1.4; margin: 0; font-weight: 300; }

.settings-block { background: #f7f7f7; border-radius: 0.8333vw; padding: 1.5625vw; margin-top: 3.125vw; }

.settings-block-title { font-size: 1.25vw; color: #1f2937; margin: 0 0 1.0417vw 0; font-weight: 400; line-height: 1.4; }

.settings-list { display: flex; flex-direction: column; gap: 0.7813vw; }

.setting-item { display: flex; align-items: center; gap: 0.625vw; cursor: pointer; }

.setting-checkbox { width: 1.0417vw; height: 1.0417vw; cursor: pointer; accent-color: #facc15; }

.setting-label { font-size: 1.0417vw; color: #1f2937; line-height: 1.4; }

.config-button {
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
  opacity: 1;
  line-height: 1.2;
  margin-top: 1.5625vw;
}

.feedback-section {
  background: #ffffff;
  border-bottom-left-radius: 1.25vw;
  border-bottom-right-radius: 1.25vw;
  padding: 3.125vw 0;
  position: relative;
  z-index: 1;
}

.feedback-container { display: flex; align-items: center; justify-content: space-between; gap: 3.125vw; margin: 0 17.4479vw; }

.feedback-qr { width: 13.5417vw; height: 13.5417vw; flex-shrink: 0; }

.feedback-content { flex: 1; }

.feedback-title { color: #1f2937; font-size: 1.25vw; line-height: 1.4; margin: 0 0 1.0417vw 0; font-weight: 400; }

.feedback-text { color: #1f2937; font-size: 1.0417vw; line-height: 1.5; margin: 0 0 1.0417vw 0; font-weight: 300; }

.feedback-footer { color: #1f2937; font-size: 1.0417vw; line-height: 1.5; margin: 0; font-weight: 300; }

.footer { background: #1f2937; margin-top: -1.25vw; padding: 4.375vw 0 3.125vw; }

.footer-content { text-align: center; }

.footer-title { color: #ffffff; font-size: 1.0417vw; line-height: 1.4; margin: 0 0 0.7813vw 0; font-weight: 400; }

.footer-links { display: flex; flex-direction: column; align-items: center; gap: 0.5208vw; }

.footer-link { color: #ffffff; font-size: 1.0417vw; text-decoration: none; transition: color .15s, opacity .15s; line-height: 1.2; }

.footer-link:hover { color: #facc15; opacity: .85; }

.auth-overlay { position: fixed; inset: 0; background: rgba(31,41,55,0.55); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; z-index: 10000; }

.auth-modal {
  width: 25vw;
  max-width: 560px;
  min-width: 320px;
  background: #fff;
  border-radius: 0.5vw;
  padding: 3vw;
  box-shadow: 0 1.25vw 2.5vw rgba(0,0,0,.18);
  animation: authPop .18s ease;
}

.config-modal-wide { width: 50vw; max-width: 900px; }

@keyframes authPop {
  from { transform: translateY(8px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.auth-title { color: #1f2937; font-size: 2vw; font-weight: 400; text-align: center; font-family: inherit; padding-bottom: 3vw; margin: 0; }

.auth-form { display: flex; flex-direction: column; gap: 0.2vw; }

.auth-btn {
  width: 100%;
  padding: 0.65vw 1vw;
  background: #facc15;
  color: #1f2937;
  border: none;
  border-radius: 0.4vw;
  font-size: 1.25vw;
  font-weight: 400;
  font-family: inherit;
  line-height: 1.2;
  cursor: pointer;
  transition: transform .15s ease, box-shadow .15s ease;
  box-shadow: 0 0 0 rgba(0,0,0,0);
  margin-top: 0.3vw;
  height: 2.5vw;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-btn:hover { transform: translateY(-0.0625vw); box-shadow: 0 .2083vw .4167vw rgba(0,0,0,.1); }

.auth-link-like {
  align-self: center;
  background: transparent;
  border: none;
  color: #1f2937;
  font-size: 1.0417vw;
  font-weight: 400;
  font-family: inherit;
  line-height: 1.2;
  text-decoration: none;
  cursor: pointer;
  transition: color .15s, opacity .15s;
  margin-top: 0.8vw;
}

.auth-link-like:hover { color: #4b5563; opacity: .9; }

.logout-confirm-text { color: #1f2937; font-size: 1.25vw; font-family: inherit; font-weight: 400; margin: 0 0 1vw 0; text-align: center; line-height: 1.4; }

.config-guide {
  text-align: left;
  background: #ffffff;
  padding: 0;
  border-radius: 0;
  margin: 1.5vw 0;
}

.guide-text { color: #1f2937; font-size: 1vw; margin: 0 0 1.5vw 0; line-height: 1.5; padding: 0 0 1.5vw 0; border-bottom: 1px solid #e5e7eb; }

.guide-step { padding: 1vw 0; border-bottom: 1px solid #e5e7eb; }

.guide-step:last-child { border-bottom: none; }

.guide-step-label { color: #1f2937; font-size: 0.95vw; font-weight: 500; margin: 0 0 0.5vw 0; line-height: 1.3; }

.guide-step-desc { color: #1f2937; font-size: 0.9vw; margin: 0 0 0.5vw 0; line-height: 1.4; }

.guide-code {
  background: #1f2937;
  color: #facc15;
  padding: 0.6vw 0.8vw;
  border-radius: 0.3vw;
  font-family: 'Courier New', monospace;
  font-size: 0.85vw;
  display: block;
  margin: 0.6vw 0 0 0;
  word-break: break-all;
  line-height: 1.5;
}

.guide-button-close {
  width: 100%;
  padding: 0.65vw 1vw;
  background: #facc15;
  color: #1f2937;
  border: none;
  border-radius: 0.4vw;
  font-size: 1.1vw;
  font-weight: 400;
  font-family: inherit;
  line-height: 1.2;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  height: 2.5vw;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1.5vw;
}

.guide-button-close:hover { transform: translateY(-0.0625vw); box-shadow: 0 0.2083vw 0.4167vw rgba(0, 0, 0, 0.1); }

@media (max-width: 1200px) {
  .section { margin: 40px 60px; }
  .section-title { font-size: 28px; }
  .hero-row { padding: 10px 30px; }
  .logo-btn img { width: 36px; height: 48px; }
  .profile-info { gap: 12px; }
  .profile-btn { width: 36px; height: 36px; }
  .profile-menu { min-width: 160px; border-radius: 8px; margin-top: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
  .profile-menu-header { padding: 10px 16px; font-size: 14px; }
  .profile-menu-logout { padding: 10px 16px; font-size: 16px; gap: 8px; }
  .profile-menu-icon { width: 16px; height: 16px; }
  .hero-middle { margin: 24px 60px 0; }
  .hero-center { padding: 40px 0; }
  .title { font-size: 36px; }
  .subtitle { font-size: 18px; }
  .decor-hero-left-top, .decor-hero-right-bottom { height: 32px; }
  .cards-3 { gap: 24px; margin-top: 30px; }
  .card-title { font-size: 16px; margin-top: 8px; }
  .section-header { margin: 0 60px 30px; }
  .section-arrow { width: 40px; height: 40px; }
  .section-wrapper { margin: 0 60px; width: calc(42vw * 2 + 3vw); }
  .section-track { gap: 3vw; }
  .program-card { flex: 0 0 42vw; width: 42vw; height: 52vw; padding: 3vw; }
  .program-icon { height: 6vw; margin-bottom: 3vw; }
  .program-desc { font-size: 2.2vw; }
  .program-more { font-size: 18px; margin: 20px 0 12px; }
  .program-btn { font-size: 18px; padding: 12px 16px; }
  .warning-section, .warning-section-2 { border-radius: 20px; padding: 40px 0; }
  .warning-middle, .warning-middle-2 { margin: 0 60px; }
  .warning-center, .warning-center-2 { padding: 40px 0; }
  .warning-decor-left, .warning-decor-right, .warning-decor-left-2, .warning-decor-right-2 { height: 32px; }
  .warning-title, .warning-title-2 { font-size: 20px; margin-bottom: 16px; }
  .warning-text, .warning-text-2 { font-size: 16px; margin-bottom: 16px; }
  .warning-footer, .warning-footer-2 { font-size: 16px; }
  .settings-block { border-radius: 12px; padding: 24px; margin-top: 40px; }
  .settings-block-title { font-size: 20px; margin-bottom: 16px; }
  .settings-list { gap: 12px; }
  .setting-checkbox { width: 18px; height: 18px; }
  .setting-label { font-size: 16px; }
  .config-button { font-size: 18px; padding: 12px 16px; height: 48px; }
  .config-modal-wide { width: 70vw; }
  .feedback-section { border-bottom-left-radius: 20px; border-bottom-right-radius: 20px; padding: 40px 0; }
  .feedback-container { margin: 0 60px; gap: 40px; }
  .feedback-qr { width: 200px; height: 200px; }
  .feedback-title { font-size: 20px; margin-bottom: 16px; }
  .feedback-text { font-size: 16px; margin-bottom: 16px; }
  .feedback-footer { font-size: 16px; }
  .footer { padding: 40px 0; margin-top: -20px; padding-top: 60px; }
  .footer-title { font-size: 16px; margin-bottom: 12px; }
  .footer-links { gap: 10px; }
  .footer-link { font-size: 16px; }
  .auth-modal { width: 560px; border-radius: 8px; padding: 32px; }
  .auth-title { font-size: 28px; padding-bottom: 32px; }
  .auth-form { gap: 4px; }
  .auth-btn { font-size: 18px; padding: 12px 16px; height: 48px; border-radius: 8px; }
  .auth-link-like { font-size: 18px; margin-top: 8px; }
  .config-guide { margin: 2vw 0; }
  .guide-text { font-size: 14px; margin-bottom: 14px; padding-bottom: 14px; }
  .guide-step { padding: 12px 0; }
  .guide-step-label { font-size: 13px; margin-bottom: 6px; }
  .guide-step-desc { font-size: 12px; margin-bottom: 6px; }
  .guide-code { padding: 8px 10px; font-size: 11px; margin: 8px 0 0 0; }
  .guide-button-close { font-size: 14px; padding: 10px 14px; height: 40px; margin-top: 14px; }
}

@media (max-width: 768px) {
  .section { margin: 32px 24px; }
  .section-title { font-size: 24px; }
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
  .subtitle { font-size: 15px; line-height: 1.4; }
  .decor-hero-left-top { width: 80px; height: auto; }
  .decor-hero-right-bottom { width: 70px; height: auto; }
  .cards-3 { grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 24px; }
  .card-img { border-radius: 12px; }
  .card-title { font-size: 14px; margin-top: 8px; }
  .program-section { padding: 32px 0; border-radius: 0; }
  .program-section.bg-gray { border-radius: 0; }
  .section-header { margin: 0 24px 24px; flex-wrap: wrap; gap: 16px; }
  .section-arrows { gap: 12px; }
  .section-arrow { width: 44px; height: 44px; }
  .section-wrapper { margin: 0 24px; width: calc(100vw - 48px); }
  .section-track { gap: 16px; }
  .program-card { flex: 0 0 calc(100vw - 48px); width: calc(100vw - 48px); height: auto; min-height: 340px; padding: 24px; }
  .program-icon { height: 56px; margin-bottom: 20px; }
  .program-desc { font-size: 15px; line-height: 1.5; }
  .program-more { font-size: 15px; margin: 16px 0 10px; }
  .program-btn { font-size: 15px; padding: 10px 16px; width: 80%; }
  .warning-section, .warning-section-2 { border-radius: 0; padding: 32px 0; }
  .warning-middle, .warning-middle-2 { margin: 0 24px; }
  .warning-center, .warning-center-2 { padding: 32px 0; }
  .warning-decor-left, .warning-decor-left-2 { width: 80px; height: auto; }
  .warning-decor-right, .warning-decor-right-2 { width: 70px; height: auto; }
  .warning-decor-left { align-self: flex-start; }
  .warning-decor-left-2 { align-self: flex-end; }
  .warning-decor-right { align-self: flex-end; }
  .warning-decor-right-2 { align-self: flex-start; }
  .warning-title, .warning-title-2 { font-size: 16px; margin-bottom: 12px; line-height: 1.4; }
  .warning-text, .warning-text-2 { font-size: 14px; margin-bottom: 12px; line-height: 1.6; }
  .warning-footer, .warning-footer-2 { font-size: 14px; }
  .settings-block { border-radius: 8px; padding: 20px; margin-top: 32px; }
  .settings-block-title { font-size: 18px; margin-bottom: 12px; }
  .settings-list { gap: 10px; }
  .setting-checkbox { width: 16px; height: 16px; }
  .setting-label { font-size: 14px; }
  .config-button { font-size: 16px; padding: 10px 14px; height: 44px; margin-top: 20px; }
  .config-modal-wide { width: calc(100vw - 48px); }
  .feedback-section { border-radius: 0; padding: 32px 0; }
  .feedback-container { flex-direction: column; margin: 0 24px; gap: 24px; text-align: center; }
  .feedback-qr { width: 180px; height: 180px; }
  .feedback-title { font-size: 16px; margin-bottom: 12px; }
  .feedback-text { font-size: 14px; margin-bottom: 12px; }
  .feedback-footer { font-size: 14px; }
  .footer { padding: 32px 0; margin-top: -16px; padding-top: 48px; }
  .footer-title { font-size: 14px; margin-bottom: 10px; }
  .footer-links { gap: 8px; }
  .footer-link { font-size: 14px; }
  .auth-modal { width: calc(100vw - 48px); border-radius: 6px; padding: 24px; }
  .auth-title { font-size: 22px; padding-bottom: 24px; }
  .auth-form { gap: 3px; }
  .auth-btn { font-size: 16px; padding: 11px 16px; height: 44px; border-radius: 6px; }
  .auth-link-like { font-size: 16px; margin-top: 6px; }
  .config-guide { margin: 2vw 0; }
  .guide-text { font-size: 13px; margin-bottom: 12px; padding-bottom: 12px; }
  .guide-step { padding: 10px 0; }
  .guide-step-label { font-size: 12px; margin-bottom: 4px; }
  .guide-step-desc { font-size: 11px; margin-bottom: 4px; }
  .guide-code { padding: 6px 8px; font-size: 10px; margin: 6px 0 0 0; }
  .guide-button-close { font-size: 12px; padding: 8px 10px; height: 36px; margin-top: 12px; }
}
</style>
