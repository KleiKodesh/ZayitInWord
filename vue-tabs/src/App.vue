<template>
  <div class="tab-container" @click="handleOutsideClick" @touchend="handleOutsideTouch">
    <TabHeader 
      :isDropdownOpen="isDropdownOpen"
      @toggleDropdown="toggleDropdown"
    />
    
    <TabDropdown 
      :isOpen="isDropdownOpen"
      @close="closeDropdown"
    />

    <div class="tab-content">
      <div class="tab-pane">
        <KeepAlive :max="10">
          <LandingPage 
            v-if="tabsStore.activeTab && tabsStore.activeTab.type === 'search'"
            :key="`search-${tabsStore.activeTab.id}`"
          />
          <BookViewer 
            v-else-if="tabsStore.activeTab && tabsStore.activeTab.type === 'book'"
            :key="`book-${tabsStore.activeTab.id}`"
            :tab-id="tabsStore.activeTab.id"
          />
        </KeepAlive>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTabsStore } from './stores/tabs'
import TabHeader from './components/TabHeader.vue'
import TabDropdown from './components/TabDropdown.vue'
import LandingPage from './components/LandingPage.vue'
import BookViewer from './components/BookViewer.vue'

const tabsStore = useTabsStore()
const isDropdownOpen = ref(false)

const toggleDropdown = () => isDropdownOpen.value = !isDropdownOpen.value
const closeDropdown = () => isDropdownOpen.value = false

function handleOutsideClick(e: MouseEvent) {
  if (!(e.target as HTMLElement).closest('.tab-header, .dropdown')) closeDropdown()
}

function handleOutsideTouch(e: TouchEvent) {
  if (!(e.target as HTMLElement).closest('.tab-header, .dropdown')) closeDropdown()
}

onMounted(() => {
  // Restore theme from localStorage
  const savedTheme = localStorage.getItem('zayit-theme')
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark')
  }
  
  // Restore tabs from localStorage or create default tab
  tabsStore.restoreTabs()
})

// Save theme when it changes
function saveTheme(isDark: boolean) {
  localStorage.setItem('zayit-theme', isDark ? 'dark' : 'light')
}

// Expose theme toggle for debugging (can be called from C# or console)
;(window as any).toggleTheme = () => {
  const isDark = document.documentElement.classList.toggle('dark')
  saveTheme(isDark)
}
</script>

<style>
:root {
  /* VS Code Light Theme */
  --bg-primary: #ffffff;
  --bg-primary-rgb: 255, 255, 255;
  --bg-secondary: #f3f3f3;
  --bg-secondary-rgb: 243, 243, 243;
  --text-primary: #3b3b3b;
  --text-secondary: #6c6c6c;
  --border-color: #e5e5e5;
  --border-color-rgb: 229, 229, 229;
  --hover-bg: rgba(90, 93, 94, 0.1);
  --hover-bg-rgb: 90, 93, 94;
  --active-bg: rgba(90, 93, 94, 0.15);
  --accent-color: #007acc;
  --accent-color-rgb: 0, 122, 204;
  --accent-bg: rgba(0, 122, 204, 0.1);
}

:root.dark {
  /* VS Code Dark Theme */
  --bg-primary: #1e1e1e;
  --bg-primary-rgb: 30, 30, 30;
  --bg-secondary: #252526;
  --bg-secondary-rgb: 37, 37, 38;
  --text-primary: #cccccc;
  --text-secondary: #858585;
  --border-color: #3e3e42;
  --border-color-rgb: 62, 62, 66;
  --hover-bg: rgba(90, 93, 94, 0.31);
  --hover-bg-rgb: 90, 93, 94;
  --active-bg: rgba(90, 93, 94, 0.5);
  --accent-color: #0e639c;
  --accent-color-rgb: 14, 99, 156;
  --accent-bg: rgba(14, 99, 156, 0.3);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: 'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif;
}

/* Scrollbar color theming only */
* {
  scrollbar-color: var(--border-color) var(--bg-primary);
}

html, body {
  height: 100%;
  overflow: hidden;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
}

#app {
  height: 100vh;
}

.tab-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background: var(--bg-primary);
  position: relative;
}

.tab-content {
  flex: 1;
  overflow: hidden;
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
}

.tab-pane {
  height: 100%;
  width: 100%;
  overflow-y: auto;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
