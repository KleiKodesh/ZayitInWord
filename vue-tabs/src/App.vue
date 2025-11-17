<template>
  <div class="tab-container" @click="handleOutsideClick">
    <TabHeader 
      :isDropdownOpen="isDropdownOpen"
      @toggleDropdown="toggleDropdown"
    />
    
    <TabDropdown 
      :isOpen="isDropdownOpen"
      @close="closeDropdown"
    />

    <div class="tab-content">
      <div
        v-for="tab in tabsStore.tabs"
        :key="tab.id"
        v-show="tab.id === tabsStore.activeTabId"
        class="tab-pane"
        :data-tab-id="tab.id"
      >
        <LandingPage v-if="tab.type === 'search'" :key="`search-${tab.id}`" />
        <BookViewer v-else-if="tab.type === 'book'" :key="`book-${tab.id}-${tab.bookId}`" :tab-id="tab.id" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
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

// Save scroll position when switching away from a tab
watch(() => tabsStore.activeTabId, async (newTabId, oldTabId) => {
  // Save scroll position of the old tab
  if (oldTabId) {
    const oldPane = document.querySelector(`.tab-pane[data-tab-id="${oldTabId}"]`) as HTMLElement
    if (oldPane) {
      tabsStore.saveScrollPosition(oldTabId, oldPane.scrollTop)
    }
  }
  
  // Restore scroll position of the new tab
  if (newTabId) {
    await nextTick()
    const newPane = document.querySelector(`.tab-pane[data-tab-id="${newTabId}"]`) as HTMLElement
    const tab = tabsStore.tabs.find(t => t.id === newTabId)
    if (newPane && tab?.scrollPosition !== undefined) {
      newPane.scrollTop = tab.scrollPosition
    }
  }
})

onMounted(() => {
  // Restore theme from localStorage
  const savedTheme = localStorage.getItem('zayit-theme')
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark')
  }
  
  // Restore tabs from localStorage or create default tab
  tabsStore.restoreTabs()
  
  // Set up scroll listeners for all tab panes
  const observer = new MutationObserver(() => {
    document.querySelectorAll('.tab-pane').forEach((pane) => {
      const tabId = (pane as HTMLElement).dataset.tabId
      if (tabId && !(pane as any).__scrollListenerAdded) {
        pane.addEventListener('scroll', () => {
          if (tabsStore.activeTabId === tabId) {
            tabsStore.saveScrollPosition(tabId, (pane as HTMLElement).scrollTop)
          }
        })
        ;(pane as any).__scrollListenerAdded = true
      }
    })
  })
  
  observer.observe(document.querySelector('.tab-content')!, {
    childList: true,
    subtree: true
  })
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
  --bg-secondary: #f3f3f3;
  --text-primary: #3b3b3b;
  --text-secondary: #6c6c6c;
  --border-color: #e5e5e5;
  --hover-bg: rgba(90, 93, 94, 0.1);
  --active-bg: rgba(90, 93, 94, 0.15);
  --accent-color: #007acc;
  --accent-color-rgb: 0, 122, 204;
  --accent-bg: rgba(0, 122, 204, 0.1);
}

:root.dark {
  /* VS Code Dark Theme */
  --bg-primary: #1e1e1e;
  --bg-secondary: #252526;
  --text-primary: #cccccc;
  --text-secondary: #858585;
  --border-color: #3e3e42;
  --hover-bg: rgba(90, 93, 94, 0.31);
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
  position: relative;
}

.tab-pane {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  overflow-y: auto;
  will-change: transform;
  backface-visibility: hidden;
  transform: translateZ(0);
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
