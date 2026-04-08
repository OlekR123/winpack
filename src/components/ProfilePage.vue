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
            <div class="profile-menu-header">{{ authStore.userEmail }}</div>
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
          <button class="section-arrow" :class="{ disabled: !canScrollLeft(cat.id) }" @click="scrollCategory(cat.id, -1)" :disabled="!canScrollLeft(cat.id)">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#1F2937" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <button class="section-arrow" :class="{ disabled: !canScrollRight(cat.id) }" @click="scrollCategory(cat.id, 1)" :disabled="!canScrollRight(cat.id)">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#1F2937" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      </div>
      <div class="section-wrapper">
        <div class="section-track" :style="{ transform: `translateX(${categoryOffsets[cat.id] || 0}px)` }">
          <div v-for="p in categoryPrograms[cat.id]" :key="p.id" class="program-card">
            <div class="program-checkbox-wrapper">
              <input type="checkbox" :id="`prog-${p.id}`" :checked="selectedPrograms[p.id]" @change="toggleProgramSelection(p.id)" class="program-checkbox-input" />
              <label :for="`prog-${p.id}`" class="program-checkbox-label"></label>
            </div>
            <img :src="p.icon_url" class="program-icon" />
            <p class="program-name">{{ p.name }}</p>
            <p class="program-desc">{{ p.description }}</p>
            <a :href="p.homepage_url" target="_blank" class="program-more">Узнать больше...</a>
          </div>
        </div>
      </div>
    </section>

    <div class="programs-action-wrapper">
      <button class="programs-generate-btn" @click="handleDownloadPrograms">Сформировать скрипт установки программ</button>
      <button class="guide-open-link" @click="openProgramsGuide">Открыть инструкцию по установке</button>
    </div>

    <section class="warning-section">
      <div class="warning-middle">
        <img class="warning-decor-left" :src="img.warningDotsLeft" alt="" aria-hidden="true" />
        <div class="warning-center">
          <p class="warning-title">Программы устанавливаются через официальный пакетный менеджер Windows — Winget.</p>
          <p class="warning-text">Администрация не несёт ответственности за корректность работы программ или за их актуальность и версии. Установка производится напрямую из репозитория Winget.</p>
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
              <input v-model="selectedSettings[setting.id]" type="checkbox" class="setting-checkbox" :value="setting.id" />
              <span class="setting-label">{{ setting.label }}</span>
            </label>
          </div>
        </div>

        <button class="config-button" @click="downloadConfig" :disabled="configLoading">
          {{ configLoading ? 'Создание конфига...' : 'Установить конфиг' }}
        </button>
        <button class="guide-open-link" @click="openConfigGuide">Открыть инструкцию по применению конфига</button>
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

    <!-- Programs guide modal -->
    <div v-if="showProgramsGuide" class="auth-overlay" @mousedown.self="closeProgramsGuide">
      <div class="auth-modal config-modal-wide" @click.stop>
        <h3 class="auth-title">Инструкция по установке программ</h3>
        <div class="config-guide">
          <div class="guide-step">
            <p class="guide-step-label">Шаг 1: Откройте PowerShell от имени администратора</p>
            <p class="guide-step-desc">Нажмите Win+X и выберите "Windows PowerShell (Администратор)"</p>
          </div>
          <div class="guide-step">
            <p class="guide-step-label">Шаг 2: Перейдите в папку Downloads</p>
            <p class="guide-step-desc">Выполните команду:</p>
            <code class="guide-code">cd $env:USERPROFILE\Downloads</code>
          </div>
          <div class="guide-step">
            <p class="guide-step-label">Шаг 3: Разрешите выполнение скриптов (если требуется)</p>
            <p class="guide-step-desc">Выполните команду:</p>
            <code class="guide-code">Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass</code>
          </div>
          <div class="guide-step">
            <p class="guide-step-label">Шаг 4: Запустите скрипт установки</p>
            <p class="guide-step-desc">Выполните команду:</p>
            <code class="guide-code">.\WinPackInstaller.ps1</code>
          </div>
          <div class="guide-step">
            <p class="guide-step-label">Важно: для работы необходим установленный Winget</p>
            <p class="guide-step-desc">Если Winget не установлен, скачайте его по ссылке: <a href="https://aka.ms/getwinget" target="_blank" class="guide-link">https://aka.ms/getwinget</a></p>
          </div>
        </div>
        <button class="guide-button-close" @click="closeProgramsGuide">Закрыть</button>
      </div>
    </div>

    <!-- Config guide modal -->
    <div v-if="showConfigGuide" class="auth-overlay" @mousedown.self="closeConfigGuide">
      <div class="auth-modal config-modal-wide" @click.stop>
        <h3 class="auth-title">Инструкция по применению конфига</h3>
        <div class="config-guide">
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

    <!-- Logout confirm modal -->
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
import { ref, onMounted, onUnmounted } from 'vue';
import { images as img, drivers } from '../assets/images.js';
import { useAuthStore } from '../stores/auth.js';
import { usePrograms } from '../composables/usePrograms.js';
import { useSettings } from '../composables/useSettings.js';
import * as homeApi from '../api/home.js';

const authStore = useAuthStore();

const {
  categories, categoryPrograms, categoryOffsets, selectedPrograms,
  showProgramsGuide, loadCategories, scrollCategory, canScrollLeft,
  canScrollRight, toggleProgramSelection, getSelectedProgramIds,
  openProgramsGuide, closeProgramsGuide, downloadProgramsScript, handleResize
} = usePrograms();

const {
  settingCategories, categorySettings, selectedSettings,
  loadSettings, getSelectedSettingIds, restoreSettings
} = useSettings();

const configLoading = ref(false);
const showLogoutConfirm = ref(false);
const showConfigGuide = ref(false);
const profileMenuOpen = ref(false);
const showWelcomeToast = ref(false);

let resizeTimeout;

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
  authStore.logout();
  document.body.style.overflow = 'auto';
  window.location.href = '/';
}

function openConfigGuide() {
  showConfigGuide.value = true;
  document.body.style.overflow = 'hidden';
}

function closeConfigGuide() {
  showConfigGuide.value = false;
  document.body.style.overflow = 'auto';
}

async function loadUserSettings() {
  if (!authStore.userId) return;
  try {
    const userSettings = await homeApi.fetchUserSettings(authStore.userId, authStore.getAuthHeaders());
    restoreSettings(userSettings);
  } catch (e) {
    // Ignore
  }
}

async function loadUserPrograms() {
  if (!authStore.userId) return;
  try {
    const userPrograms = await homeApi.fetchUserPrograms(authStore.userId, authStore.getAuthHeaders());
    for (const key in selectedPrograms) {
      delete selectedPrograms[key];
    }
    for (const prog of userPrograms) {
      if (prog.selected) {
        selectedPrograms[prog.id] = true;
      }
    }
  } catch (e) {
    // Ignore
  }
}

async function saveUserProgramsBeforeDownload(selectedIds) {
  if (!authStore.userId) return;
  try {
    await homeApi.saveUserPrograms(authStore.userId, selectedIds, authStore.getAuthHeaders());
  } catch (e) {
    // Ignore
  }
}

function handleDownloadPrograms() {
  downloadProgramsScript(saveUserProgramsBeforeDownload);
}

async function downloadConfig() {
  const selectedIds = getSelectedSettingIds();

  if (selectedIds.length === 0) {
    alert('Выберите хотя бы одну настройку');
    return;
  }

  configLoading.value = true;

  try {
    const saveRes = await homeApi.saveUserSettings(authStore.userId, selectedIds, authStore.getAuthHeaders());

    if (!saveRes.ok) {
      const errorData = await saveRes.json();
      throw new Error(errorData.error || 'Не удалось сохранить настройки');
    }

    const scriptRes = await homeApi.fetchUserScript(authStore.userId, authStore.token);

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

const debouncedResize = () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(handleResize, 150);
};

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    window.location.href = '/';
    return;
  }

  await loadCategories();
  await loadUserPrograms();
  await loadSettings();
  await loadUserSettings();

  window.addEventListener('resize', debouncedResize);
  document.addEventListener('click', closeProfileMenu);

  showWelcomeToast.value = true;
  setTimeout(() => { showWelcomeToast.value = false; }, 4000);
});

onUnmounted(() => {
  window.removeEventListener('resize', debouncedResize);
  document.removeEventListener('click', closeProfileMenu);
});
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

.logo-btn { background: transparent; border: none; cursor: pointer; padding: 0; display: flex; align-items: center; justify-content: center; transition: filter 0.15s ease; }
.logo-btn:hover { filter: drop-shadow(0 0 8px rgba(250, 204, 21, 0.6)); }
.logo-btn img { width: 2.0833vw; height: 2.8125vw; object-fit: contain; }

.profile-info { display: flex; align-items: center; gap: 0.7813vw; position: relative; }

.profile-btn {
  width: 2.0833vw; height: 2.0833vw; background: transparent; border: none;
  padding: 0; cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: filter 0.15s ease;
}
.profile-btn:hover { filter: drop-shadow(0 0 8px rgba(250, 204, 21, 0.6)); }
.profile-icon { width: 100%; height: 100%; object-fit: contain; }

.profile-menu {
  position: absolute; top: 100%; right: 0; background: #fff; border-radius: 0.5vw;
  min-width: 12vw; box-shadow: 0 0.3125vw 0.8333vw rgba(0,0,0,0.15);
  margin-top: 0.5vw; overflow: hidden; animation: menuSlideIn 0.15s ease; z-index: 10001;
}
@keyframes menuSlideIn {
  from { opacity: 0; transform: translateY(-0.5vw); }
  to { opacity: 1; transform: translateY(0); }
}
.profile-menu-header { padding: 0.65vw 1vw; background: #f7f7f7; color: #1f2937; font-size: 0.8333vw; line-height: 1.2; border-bottom: 1px solid #e5e7eb; word-break: break-all; }
.profile-menu-logout {
  width: 100%; display: flex; align-items: center; gap: 0.5vw; padding: 0.65vw 1vw;
  background: transparent; border: none; color: #1f2937; font-size: 1vw; font-weight: 400;
  font-family: inherit; cursor: pointer; transition: color 0.15s ease, opacity 0.15s ease;
  line-height: 1.2; text-align: left;
}
.profile-menu-logout:hover { color: #4b5563; opacity: 0.9; }
.profile-menu-icon { width: 1vw; height: 1vw; object-fit: contain; }

.hero-middle { display: flex; align-items: center; justify-content: space-between; margin: 1.5vw 17.4479vw 0; }
.hero-center { flex: 1; text-align: center; color: #facc15; padding: 3.125vw 0; }
.title { font-size: 2.7083vw; margin: 0; line-height: 1.1; }
.subtitle { color: #fff; font-size: 1.25vw; margin: 0.4167vw 0 0; line-height: 1.3; }
.decor-hero-left-top, .decor-hero-right-bottom { height: 2.6042vw; pointer-events: none; }
.decor-hero-left-top { align-self: flex-start; }
.decor-hero-right-bottom { align-self: flex-end; }

.welcome-toast {
  position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
  background: #facc15; color: #1f2937; padding: 14px 28px; border-radius: 8px;
  font-size: 16px; font-weight: 500; z-index: 9999; animation: slideDown 0.3s ease;
}
@keyframes slideDown {
  from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

.cards-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3vw; margin-top: 3.125vw; }
.card { display: block; text-decoration: none; }
.card-img { width: 100%; border-radius: 1.0417vw; transition: transform .18s ease, box-shadow .18s ease; box-shadow: 0 0 0 rgba(0,0,0,0); will-change: transform, box-shadow; }
.card:hover .card-img { transform: translateY(-0.3125vw); box-shadow: 0 .5208vw .9375vw rgba(0,0,0,.12); }
.card-title { margin-top: .5208vw; color: #1f2937; font-size: 1.25vw; line-height: 1.2; }

.program-section { padding: 3.125vw 0; }
.program-section.bg-gray { background: #f7f7f7; border-radius: 1.25vw; }
.program-section.bg-white { background: #ffffff; }
.section-header { display: flex; align-items: center; justify-content: space-between; margin: 0 17.4479vw 3.125vw; }
.section-arrows { display: flex; gap: 0.625vw; }
.section-arrow { width: 2.5vw; height: 2.5vw; border-radius: 50%; background: #facc15; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform .15s ease, box-shadow .15s ease, opacity .2s ease; }
.section-arrow:hover:not(.disabled) { transform: translateY(-0.1042vw); box-shadow: 0 .4167vw .8333vw rgba(0,0,0,.12); }
.section-arrow.disabled { opacity: 0.4; cursor: not-allowed; }
.section-wrapper { margin: 0 17.4479vw; overflow: hidden; width: calc(20vw * 3 + 2.15vw * 2); }
.section-track { display: flex; gap: 2.15vw; transition: transform .6s cubic-bezier(0.4, 0.0, 0.2, 1); }

.program-card { flex: 0 0 20vw; width: 20vw; background: #fff; border-radius: 0.8333vw; padding: 2vw; display: flex; flex-direction: column; align-items: center; height: 25vw; position: relative; }
.program-section.bg-white .program-card { background: #f7f7f7; }
.program-name { color: #1f2937; text-align: center; font-size: 1.1vw; font-weight: 600; line-height: 1.3; margin: 0 0 0.5vw 0; }
.program-icon { width: auto; height: 3.5vw; margin-bottom: 2.1vw; object-fit: contain; }
.program-desc { color: #1f2937; text-align: center; font-size: 1.25vw; line-height: 1.4; margin: 0 0 auto; }
.program-more { color: #1f2937; font-size: 1.25vw; text-decoration: none; margin: 1.2vw 0 0.6vw; transition: color .15s, opacity .15s; line-height: 1.2; }
.program-more:hover { color: #4b5563; opacity: .9; }

.program-btn { width: 70%; padding: 0.5vw 0.8vw; background: #facc15; color: #1f2937; border-radius: 0.4vw; text-decoration: none; font-weight: 500; font-size: 1.25vw; text-align: center; line-height: 1.2; display: inline-block; transition: transform .15s ease, box-shadow .15s ease; box-shadow: 0 0 0 rgba(0,0,0,0); }
.program-btn:hover { transform: translateY(-0.0625vw); box-shadow: 0 .2083vw .4167vw rgba(0,0,0,.1); }

.warning-section, .warning-section-2 { border-radius: 1.25vw; padding: 3.125vw 0; }
.warning-section { background: #facc15; }
.warning-section-2 { background: #f7f7f7; }
.warning-middle, .warning-middle-2 { display: flex; align-items: center; justify-content: space-between; margin: 0 17.4479vw; position: relative; }
.warning-center, .warning-center-2 { flex: 1; text-align: center; padding: 3.125vw 0; }
.warning-decor-left, .warning-decor-right, .warning-decor-left-2, .warning-decor-right-2 { height: 2.6042vw; pointer-events: none; }
.warning-decor-left { align-self: flex-start; }
.warning-decor-right { align-self: flex-end; }
.warning-decor-left-2 { align-self: flex-end; }
.warning-decor-right-2 { align-self: flex-start; }
.warning-title, .warning-title-2 { color: #1f2937; font-size: 1.25vw; line-height: 1.4; margin: 0 0 1.0417vw 0; font-weight: 400; }
.warning-text, .warning-text-2 { color: #1f2937; font-size: 1.0417vw; line-height: 1.5; margin: 0 0 1.0417vw 0; font-weight: 300; }
.warning-footer, .warning-footer-2 { color: #1f2937; font-size: 1.0417vw; line-height: 1.4; margin: 0; font-weight: 300; }

.settings-block { background: #f7f7f7; border-radius: 0.8333vw; padding: 1.5625vw; margin-top: 3.125vw; }
.settings-block-title { font-size: 1.25vw; color: #1f2937; margin: 0 0 1.0417vw 0; font-weight: 400; line-height: 1.4; }
.settings-list { display: flex; flex-direction: column; gap: 0.7813vw; }
.setting-item { display: flex; align-items: center; gap: 0.625vw; cursor: pointer; }
.setting-checkbox { width: 1.0417vw; height: 1.0417vw; cursor: pointer; accent-color: #facc15; }
.setting-label { font-size: 1.0417vw; color: #1f2937; line-height: 1.4; }
.config-button { width: 100%; padding: 0.5vw 0.8vw; background: #facc15; color: #1f2937; border: none; border-radius: 0.4vw; font-size: 1.25vw; font-weight: 500; font-family: inherit; cursor: pointer; opacity: 1; line-height: 1.2; margin-top: 1.5625vw; }

.feedback-section { background: #ffffff; border-bottom-left-radius: 1.25vw; border-bottom-right-radius: 1.25vw; padding: 3.125vw 0; position: relative; z-index: 1; }
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
.auth-modal { width: 25vw; max-width: 560px; min-width: 320px; background: #fff; border-radius: 0.5vw; padding: 3vw; box-shadow: 0 1.25vw 2.5vw rgba(0,0,0,.18); animation: authPop .18s ease; }
.config-modal-wide { width: 50vw; max-width: 900px; max-height: 90vh; overflow-y: auto; }
@keyframes authPop { from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.auth-title { color: #1f2937; font-size: 2vw; font-weight: 400; text-align: center; font-family: inherit; padding-bottom: 3vw; margin: 0; }
.auth-form { display: flex; flex-direction: column; gap: 0.2vw; }
.auth-btn { width: 100%; padding: 0.65vw 1vw; background: #facc15; color: #1f2937; border: none; border-radius: 0.4vw; font-size: 1.25vw; font-weight: 400; font-family: inherit; line-height: 1.2; cursor: pointer; transition: transform .15s ease, box-shadow .15s ease; box-shadow: 0 0 0 rgba(0,0,0,0); margin-top: 0.3vw; height: 2.5vw; box-sizing: border-box; display: flex; align-items: center; justify-content: center; }
.auth-btn:hover { transform: translateY(-0.0625vw); box-shadow: 0 .2083vw .4167vw rgba(0,0,0,.1); }
.auth-link-like { align-self: center; background: transparent; border: none; color: #1f2937; font-size: 1.0417vw; font-weight: 400; font-family: inherit; line-height: 1.2; text-decoration: none; cursor: pointer; transition: color .15s, opacity .15s; margin-top: 0.8vw; }
.auth-link-like:hover { color: #4b5563; opacity: .9; }
.logout-confirm-text { color: #1f2937; font-size: 1.25vw; font-family: inherit; font-weight: 400; margin: 0 0 1vw 0; text-align: center; line-height: 1.4; }

.config-guide { text-align: left; background: #ffffff; padding: 0; border-radius: 0; margin: 1.5vw 0; }
.guide-step { padding: 1vw 0; border-bottom: 1px solid #e5e7eb; }
.guide-step:last-child { border-bottom: none; }
.guide-step-label { color: #1f2937; font-size: 0.95vw; font-weight: 500; margin: 0 0 0.5vw 0; line-height: 1.3; }
.guide-step-desc { color: #1f2937; font-size: 0.9vw; margin: 0 0 0.5vw 0; line-height: 1.4; }
.guide-code { background: #1f2937; color: #facc15; padding: 0.6vw 0.8vw; border-radius: 0.3vw; font-family: 'Courier New', monospace; font-size: 0.85vw; display: block; margin: 0.6vw 0 0 0; word-break: break-all; line-height: 1.5; }
.guide-button-close { width: 100%; padding: 0.65vw 1vw; background: #facc15; color: #1f2937; border: none; border-radius: 0.4vw; font-size: 1.1vw; font-weight: 400; font-family: inherit; line-height: 1.2; cursor: pointer; transition: transform 0.15s ease, box-shadow 0.15s ease; height: 2.5vw; display: flex; align-items: center; justify-content: center; margin-top: 1.5vw; }
.guide-button-close:hover { transform: translateY(-0.0625vw); box-shadow: 0 0.2083vw 0.4167vw rgba(0, 0, 0, 0.1); }
.guide-link { color: #3b82f6; text-decoration: none; transition: color 0.15s ease; word-break: break-all; }
.guide-link:hover { color: #2563eb; text-decoration: underline; }

.program-checkbox-wrapper { position: absolute; top: 1vw; right: 1vw; z-index: 10; }
.program-checkbox-input { position: absolute; opacity: 0; cursor: pointer; width: 0; height: 0; }
.program-checkbox-label { position: relative; cursor: pointer; width: 1.5vw; height: 1.5vw; background: #fff; border: 0.1042vw solid #d1d5db; border-radius: 0.2083vw; display: block; transition: all 0.15s ease; }
.program-checkbox-input:checked + .program-checkbox-label { background: #facc15; border-color: #facc15; }
.program-checkbox-input:checked + .program-checkbox-label::after { content: ''; position: absolute; left: 0.4vw; top: 0.15vw; width: 0.4vw; height: 0.7vw; border: solid #1f2937; border-width: 0 0.15vw 0.15vw 0; transform: rotate(45deg); }
.program-checkbox-label:hover { border-color: #facc15; box-shadow: 0 0 0 0.1563vw rgba(250, 204, 21, 0.25); }
.program-card { position: relative; }

.programs-action-wrapper { margin: 3.125vw 17.4479vw; }
.programs-generate-btn { width: 100%; padding: 0.65vw 1.3vw; background: #facc15; color: #1f2937; border: none; border-radius: 0.4vw; font-size: 1.25vw; font-weight: 500; font-family: inherit; cursor: pointer; line-height: 1.2; transition: transform 0.15s ease, box-shadow 0.15s ease; box-shadow: 0 0 0 rgba(0,0,0,0); }
.programs-generate-btn:hover { transform: translateY(-0.0625vw); box-shadow: 0 0.2083vw 0.4167vw rgba(0,0,0,0.1); }

.guide-open-link { display: block; width: fit-content; margin: 0.8vw auto 0; background: transparent; border: none; color: #1f2937; font-size: 1.0417vw; font-weight: 400; font-family: inherit; line-height: 1.2; cursor: pointer; transition: color .15s, opacity .15s; }
.guide-open-link:hover { color: #4b5563; opacity: .9; }

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
  .program-name { font-size: 16px; }
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
  .programs-action-wrapper { margin: 40px 60px; }
  .programs-generate-btn { padding: 14px 20px; font-size: 18px; border-radius: 8px; }
  .guide-open-link { font-size: 15px; margin-top: 12px; }
  .program-checkbox-wrapper { top: 12px; right: 12px; }
  .program-checkbox-label { width: 24px; height: 24px; border-width: 2px; border-radius: 4px; }
  .program-checkbox-input:checked + .program-checkbox-label::after { left: 7px; top: 3px; width: 6px; height: 11px; border-width: 0 2px 2px 0; }
  .config-guide { margin: 2vw 0; }
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
  .program-name { font-size: 14px; }
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
  .programs-action-wrapper { margin: 32px 24px; }
  .programs-generate-btn { padding: 12px 16px; font-size: 16px; border-radius: 6px; }
  .guide-open-link { font-size: 14px; margin-top: 10px; }
  .program-checkbox-wrapper { top: 12px; right: 12px; }
  .program-checkbox-label { width: 22px; height: 22px; border-width: 2px; border-radius: 3px; }
  .program-checkbox-input:checked + .program-checkbox-label::after { left: 6px; top: 2px; width: 5px; height: 10px; border-width: 0 2px 2px 0; }
  .config-guide { margin: 2vw 0; }
  .guide-step { padding: 10px 0; }
  .guide-step-label { font-size: 12px; margin-bottom: 4px; }
  .guide-step-desc { font-size: 11px; margin-bottom: 4px; }
  .guide-code { padding: 6px 8px; font-size: 10px; margin: 6px 0 0 0; }
  .guide-button-close { font-size: 12px; padding: 8px 10px; height: 36px; margin-top: 12px; }
}
</style>