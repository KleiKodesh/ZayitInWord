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

        <transition name="slide">
          <div v-if="isDropdownOpen"
               class="dropdown-menu">

            <!-- Diacritics toggle dropdown item -->
            <DiacriticsDropdown />

            <!-- Line display toggle dropdown item -->
            <div v-if="tabStore.activeTab?.currentPage === 'bookview'"
                 @click.stop="handleLineDisplayClick"
                 class="flex-row flex-center-start hover-bg c-pointer dropdown-item"
                 title="החלף תצוגת שורות">
              <align-left-icon v-if="isLineDisplayInline" />
              <align-justify-icon v-else />
              <span class="dropdown-label">{{ isLineDisplayInline ? 'תצוגת בלוק'
                :
                'תצוגת שורה' }}</span>
            </div>

            <div @click.stop="handleThemeClick"
                 class="flex-row flex-center-start hover-bg c-pointer dropdown-item"
                 title="ערכת נושא">
              <theme-icon class="theme-icon" />
              <span class="dropdown-label">ערכת נושא</span>
            </div>

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

            <!-- PDF viewer - available in both dev and C# modes -->
            <div @click.stop="handleOpenPdfClick"
                 class="flex-row flex-center-start hover-bg c-pointer dropdown-item"
                 title="פתח PDF">
              <pdf-file-icon />
              <span class="dropdown-label">פתח PDF</span>
            </div>

            <!-- Popout toggle - only available in C# WebView -->
            <div v-if="isWebViewAvailable"
                 @click.stop="handlePopoutClick"
                 class="flex-row flex-center-start hover-bg c-pointer dropdown-item"
                 :title="popoutTitle">
              <popout-icon />
              <span class="dropdown-label">{{ popoutLabel }}</span>
            </div>
          </div>
        </transition>
      </div>

      <button v-if="tabStore.activeTab?.currentPage === 'bookview' && !isTocVisible"
              @click.stop="handleButtonClick(openSearch)"
              class="flex-center c-pointer"
              title="חיפוש (Ctrl+F)">
        <search-icon />
      </button>

      <button v-if="tabStore.activeTab?.currentPage === 'bookview' && hasConnections && !isTocVisible"
              @click.stop="handleButtonClick(toggleSplitPane)"
              class="flex-center c-pointer"
              title="פאנל תחתון">
        <split-pane-icon />
      </button>

      <button v-if="tabStore.activeTab?.currentPage === 'bookview'"
              @click.stop="handleButtonClick(goToToc)"
              class="flex-center c-pointer"
              title="תוכן עניינים">
        <tree-icon class="rtl-flip" />
      </button>


    </div>
    <span class="center-text bold ellipsis">{{ tabStore.activeTab?.title
      }}</span>
    <div class="flex-row justify-end">
      <button @click.stop="handleButtonClick(resetTab)"
              class="flex-center c-pointer"
              title="דף הבית">
        <home-icon />
      </button>
      <button @click.stop="handleButtonClick(newTab)"
              class="flex-center c-pointer">+</button>
      <button @click.stop="handleButtonClick(closeTab)"
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
import SearchIcon from './icons/SearchIcon.vue';
import SettingsIcon from './icons/SettingsIcon.vue';
import AboutIcon from './icons/AboutIcon.vue';
import MoreVerticalIcon from './icons/MoreVerticalIcon.vue';
import AlignLeftIcon from './icons/AlignLeftIcon.vue';
import AlignJustifyIcon from './icons/AlignJustifyIcon.vue';
import PdfFileIcon from './icons/PdfFileIcon.vue';
import PopoutIcon from './icons/PopoutIcon.vue';
import DiacriticsDropdown from './TabHeaderDiacriticsDropdown.vue';
import { useTabStore } from '../stores/tabStore';
import { toggleTheme } from '../utils/theme';
import { dbManager } from '../data/dbManager';

const tabStore = useTabStore();
const isDropdownOpen = ref(false);
const isPopoutMode = ref(false);

const emit = defineEmits<{
  'close-tab-dropdown': []
}>();

// Check if WebView is available for popout functionality
const isWebViewAvailable = computed(() => {
  return (window as any).chrome?.webview?.postMessage !== undefined;
});



// Line display state
const isLineDisplayInline = computed(() => {
  return tabStore.activeTab?.bookState?.isLineDisplayInline || false;
});

const hasConnections = computed(() => {
  const bookState = tabStore.activeTab?.bookState;
  if (!bookState) return false;
  return bookState.hasConnections || false;
});

const isTocVisible = computed(() => {
  const bookState = tabStore.activeTab?.bookState;
  if (!bookState) return false;
  return bookState.isTocOpen || false;
});

const popoutTitle = computed(() => {
  return isPopoutMode.value ? 'חזור לפאנל צד' : 'פתח בחלון נפרד';
});

const popoutLabel = computed(() => {
  return isPopoutMode.value ? 'פאנל צד' : 'חלון נפרד';
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

const openSearch = () => {
  tabStore.toggleBookSearch(true);
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

const handleButtonClick = (action: () => void) => {
  action();
  emit('close-tab-dropdown');
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

const handleOpenPdfClick = async () => {
  try {
    // Try C# file picker first if WebView is available
    console.log('Opening PDF file picker...');
    const result = await dbManager.openPdfFilePicker();
    console.log('PDF picker result:', result);

    if (result.filePath && result.fileName && result.dataUrl) {
      console.log('Converting base64 to blob URL, size:', result.dataUrl.length);

      // Convert base64 string to blob URL for PDF.js
      const binaryString = atob(result.dataUrl);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);

      console.log('Created blob URL:', blobUrl);

      // C# file picker succeeded - create tab with both file path (persistence) and blob URL (viewing)
      tabStore.openPdfWithFilePathAndBlobUrl(result.fileName, result.filePath, blobUrl);
    } else {
      // Fallback to browser file picker
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf';
      input.onchange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file && file.type === 'application/pdf') {
          const fileUrl = URL.createObjectURL(file);
          // Open PDF viewer with blob URL (no persistence across sessions)
          tabStore.openPdfWithFile(file.name, fileUrl);
        }
      };
      input.click();
    }
  } catch (error) {
    console.error('Failed to open C# file picker, falling back to browser:', error);
    // Fallback to browser file picker
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file && file.type === 'application/pdf') {
        const fileUrl = URL.createObjectURL(file);
        tabStore.openPdfWithFile(file.name, fileUrl);
      }
    };
    input.click();
  }

  isDropdownOpen.value = false;
};

const handlePopoutClick = () => {
  if (isWebViewAvailable.value) {
    (window as any).chrome.webview.postMessage({
      command: 'TogglePopOut',
      args: []
    });
    // Toggle the local state
    isPopoutMode.value = !isPopoutMode.value;
  }
  isDropdownOpen.value = false;
};

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.dropdown-container')) {
    isDropdownOpen.value = false;
  }
};

const handleWindowBlur = () => {
  if (isDropdownOpen.value) {
    isDropdownOpen.value = false;
  }
};

const handleVisibilityChange = () => {
  if (document.hidden && isDropdownOpen.value) {
    isDropdownOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('blur', handleWindowBlur);
  document.addEventListener('visibilitychange', handleVisibilityChange);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('blur', handleWindowBlur);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
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

.dropdown-item .theme-icon {
  width: 18px;
  height: 18px;
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