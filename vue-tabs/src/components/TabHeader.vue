<template>
  <div class="tab-header" :class="{ open: isDropdownOpen }" @click="emit('toggleDropdown')">
    <div class="tab-header-content">
      <span class="tab-header-text">{{ headerText }}</span>
      <span class="tab-header-icon">▼</span>
    </div>
    <div class="header-actions">
      <button class="theme-toggle-btn" @click.stop="toggleTheme" title="החלף ערכת נושא">
        <div class="theme-icon"></div>
      </button>
      <button class="add-tab-btn" @click.stop="handleNewTab">+ חדש</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useTabsStore } from '../stores/tabs'

const props = defineProps<{ isDropdownOpen: boolean }>()
const emit = defineEmits<{ toggleDropdown: [] }>()
const isDropdownOpen = computed(() => props.isDropdownOpen)
const tabsStore = useTabsStore()
const headerText = computed(() => tabsStore.activeTab?.title || 'כרטיסייה חדשה')

const isDark = ref(false)

const handleNewTab = () => {
  tabsStore.createTab()
}

const toggleTheme = () => {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'כהה' : 'בהיר')
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  isDark.value = savedTheme === 'כהה' || savedTheme === 'dark'
  if (isDark.value) {
    document.documentElement.classList.add('dark')
  }
})
</script>

<style scoped>
.tab-header {
  display: flex;
  height: 48px;
  background: var(--bg-secondary);
  backdrop-filter: blur(40px) saturate(150%);
  -webkit-backdrop-filter: blur(40px) saturate(150%);
  border-bottom: 1px solid var(--border-color);
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  position: relative;
  cursor: pointer;
  transition: background 0.2s ease;
  direction: rtl;
}

.tab-header:active {
  background: var(--active-bg);
}

.tab-header-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  flex-direction: row-reverse;
}

.tab-header-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.tab-header-icon {
  font-size: 12px;
  color: var(--text-secondary);
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.tab-header.open .tab-header-icon {
  transform: rotate(180deg);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.theme-toggle-btn {
  padding: 6px;
  cursor: pointer;
  font-size: 18px;
  background: transparent;
  border: none;
  border-radius: 4px;
  transition: all 0.1s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}

.theme-toggle-btn:hover {
  background: var(--hover-bg);
  transform: scale(1.05);
}

.theme-toggle-btn:active {
  background: var(--active-bg);
  transform: scale(0.95);
}

.theme-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(90deg, var(--text-primary) 50%, transparent 50%);
  border: 1.5px solid var(--text-primary);
  transition: transform 0.3s ease;
}

.add-tab-btn {
  padding: 6px 12px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: var(--accent-color);
  background: var(--accent-bg);
  border-radius: 4px;
  transition: all 0.1s ease;
  border: none;
}

.add-tab-btn:hover {
  background: var(--hover-bg);
}

.add-tab-btn:active {
  background: var(--active-bg);
  transform: scale(0.98);
}
</style>
