<template>
  <div class="bar c-pointer tab-header">
    <div class="flex-row">
      <!-- Dropdown menu -->
      <div class="dropdown-container">
        <button @click.stop="toggleDropdown"
                class="flex-center c-pointer dropdown-toggle"
                title="אפשרויות">
          <more-vertical-icon />
        </button>

        <div v-if="isDropdownOpen"
             class="dropdown-menu">
          <div @click.stop="handleSettingsClick"
               class="flex-row flex-center-start hover-bg c-pointer dropdown-item"
               title="הגדרות">
            <settings-icon />
            <span class="dropdown-label">הגדרות</span>
          </div>

          <div @click.stop="handleAboutClick"
               class="flex-row flex-center-start hover-bg c-pointer dropdown-item"
               title="אודות">
            <about-icon />
            <span class="dropdown-label">אודות</span>
          </div>

          <div @click.stop="handleThemeClick"
               class="flex-row flex-center-start hover-bg c-pointer dropdown-item"
               title="ערכת נושא">
            <theme-icon />
            <span class="dropdown-label">ערכת נושא</span>
          </div>
        </div>
      </div>

      <button v-if="tabStore.activeTab?.currentPage === 'bookview' && hasConnections"
              @click.stop="toggleSplitPane"
              class="flex-center c-pointer"
              title="פאנל תחתון">
        <split-pane-icon />
      </button>

      <!-- Diacritics toggle button -->
      <DiacriticsToggle />

      <!-- Line display toggle button -->
      <button v-if="tabStore.activeTab?.currentPage === 'bookview'"
              @click.stop="handleLineDisplayClick"
              class="flex-center c-pointer"
              title="החלף תצוגת שורות">
        <align-left-icon v-if="isLineDisplayInline" />
        <align-justify-icon v-else />
      </button>
    </div>
    <span class="center-text bold ellipsis">{{ tabStore.activeTab?.title
      }}</span>
    <div class="flex-row justify-end">
      <button @click.stop="resetTab"
              class="flex-center c-pointer"
              title="דף הבית">
        <home-icon />
      </button>
      <button v-if="tabStore.activeTab?.currentPage === 'bookview'"
              @click.stop="goToToc"
              class="flex-center c-pointer"
              title="תוכן עניינים">
        <tree-icon class="rtl-flip" />
      </button>
      <button @click.stop="newTab"
              class="flex-center c-pointer">+</button>
      <button @click.stop="closeTab"
              class="flex-center c-pointer">×</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import ThemeIcon from './icons/ThemeIcon.vue';
import HomeIcon from './icons/HomeIcon.vue';
import TreeIcon from './icons/TreeIcon.vue';
import SplitPaneIcon from './icons/SplitPaneIcon.vue';
import SettingsIcon from './icons/SettingsIcon.vue';
import AboutIcon from './icons/AboutIcon.vue';
import MoreVerticalIcon from './icons/MoreVerticalIcon.vue';
import AlignLeftIcon from './icons/AlignLeftIcon.vue';
import AlignJustifyIcon from './icons/AlignJustifyIcon.vue';
import DiacriticsToggle from './TabHeaderDiacriticsToggle.vue';
import { useTabStore } from '../stores/tabStore';
import { toggleTheme } from '../utils/theme';

const tabStore = useTabStore();
const isDropdownOpen = ref(false);



// Line display state
const isLineDisplayInline = computed(() => {
  return tabStore.activeTab?.bookState?.isLineDisplayInline || false;
});

const hasConnections = computed(() => {
  const bookState = tabStore.activeTab?.bookState;
  if (!bookState) return false;
  return bookState.hasConnections || false;
});

const goToToc = () => {
  const tab = tabStore.activeTab;
  if (tab?.bookState) {
    if (tab.bookState.isTocOpen) {
      tabStore.closeToc();
    } else {
      tabStore.openBookToc(tab.title, tab.bookState.bookId);
    }
  }
};

const toggleSplitPane = () => {
  tabStore.toggleSplitPane();
};

const resetTab = () => {
  tabStore.resetTab();
};

const newTab = () => {
  tabStore.addTab();
};

const closeTab = () => {
  tabStore.closeTab();
};

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const handleSettingsClick = () => {
  tabStore.openSettings();
  isDropdownOpen.value = false;
};

const handleAboutClick = () => {
  tabStore.openAbout();
  isDropdownOpen.value = false;
};

const handleThemeClick = () => {
  toggleTheme();
};



const handleLineDisplayClick = () => {
  tabStore.toggleLineDisplay();
};

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.dropdown-container')) {
    isDropdownOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.tab-header {
  width: 100%;
  display: flex;
  align-items: center;
}

.tab-header>div {
  flex: 1 1 0;
}

.dropdown-container {
  position: relative;
  z-index: 9999;
}

.dropdown-toggle {
  padding: 6px;
  background: transparent;
  border: none;
  border-radius: 4px;
  width: 32px;
  height: 32px;
}

.dropdown-toggle:hover {
  background: var(--hover-bg);
  transform: scale(1.05);
}

.dropdown-toggle svg {
  color: var(--text-primary);
  opacity: 0.7;
}

.dropdown-toggle:hover svg {
  opacity: 1;
}

.dropdown-menu {
  position: fixed;
  top: 48px;
  right: 0;
  background: var(--bg-secondary);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-left: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  border-radius: 0 0 0 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  z-index: 9999;
  overflow: hidden;
}

.dropdown-item {
  gap: 12px;
  width: 100%;
  padding: 10px 16px;
  background: transparent;
  border: none;
  text-align: right;
  direction: rtl;
}

.dropdown-item svg {
  flex-shrink: 0;
  opacity: 0.7;
  width: 20px;
  height: 20px;
}

.dropdown-item:hover svg {
  opacity: 1;
}

.dropdown-label {
  font-size: 14px;
  color: var(--text-primary);
  white-space: nowrap;
}

.dropdown-item :deep(.theme-toggle) {
  pointer-events: none;
}
</style>