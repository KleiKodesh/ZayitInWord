<template>
  <div class="bar c-pointer tab-header">
    <div class="flex-row">
      <theme-toggle-button />
      <button @click.stop="openSettings"
              title="הגדרות">
        <settings-icon />
      </button>
      <button @click.stop="openAbout"
              title="אודות">
        <about-icon />
      </button>
      <button v-if="tabStore.activeTab?.currentPage === 'bookview' && hasConnections"
              @click.stop="toggleSplitPane"
              title="פאנל תחתון">
        <split-pane-icon />
      </button>
    </div>
    <span class="center-text bold ellipsis">{{
      tabStore.activeTab?.title }}</span>
    <div class="flex-row justify-end">
      <button @click.stop="resetTab"
              title="דף הבית">
        <home-icon />
      </button>
      <button v-if="tabStore.activeTab?.currentPage === 'bookview'"
              @click.stop="goToToc"
              title="תוכן עניינים">
        <tree-icon class="rtl-flip" />
      </button>
      <button @click.stop="newTab">+</button>
      <button @click.stop="closeTab">×</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import ThemeToggleButton from './ThemeToggleButton.vue';
import HomeIcon from './icons/HomeIcon.vue';
import TreeIcon from './icons/TreeIcon.vue';
import SplitPaneIcon from './icons/SplitPaneIcon.vue';
import SettingsIcon from './icons/SettingsIcon.vue';
import AboutIcon from './icons/AboutIcon.vue';
import { useTabStore } from '../stores/tabStore';

defineProps<{
  isDropdownOpen: boolean;
}>();

const tabStore = useTabStore();

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

const openSettings = () => {
  console.log('Settings button clicked');
  tabStore.openSettings();
  console.log('After openSettings, active tab:', tabStore.activeTab);
};

const openAbout = () => {
  console.log('About button clicked');
  tabStore.openAbout();
  console.log('After openAbout, active tab:', tabStore.activeTab);
};
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
</style>