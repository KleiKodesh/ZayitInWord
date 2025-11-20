<template>
  <Transition name="slide">
    <div v-if="isOpen" class="dropdown">
      <div
        v-for="tab in tabsStore.tabs"
        :key="tab.id"
        class="tab-item"
        :class="{ active: tab.id === tabsStore.activeTabId }"
        @click="activateTab(tab.id)"
      >
        <span class="tab-item-title">{{ tab.title }}</span>
        <div class="close-btn" @click.stop="tabsStore.closeTab(tab.id)">×</div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useTabsStore } from '../stores/tabs'

defineProps<{ isOpen: boolean }>()
const emit = defineEmits<{ close: [] }>()
const tabsStore = useTabsStore()

const activateTab = (id: string) => { tabsStore.activateTab(id); emit('close') }
</script>

<style scoped>
.dropdown {
  position: absolute;
  top: 48px;
  left: 0;
  right: 0;
  background: var(--bg-secondary);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  max-height: 60vh;
  overflow-y: auto;
  z-index: 1000;
  border-bottom: 1px solid var(--border-color);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  direction: rtl;
}



.tab-item {
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background 0.1s ease;
  font-size: 14px;
  color: var(--text-primary);
}

.tab-item:hover {
  background: var(--hover-bg);
}

.tab-item:active {
  background: var(--active-bg);
}

.tab-item.active {
  background: var(--accent-bg);
  color: var(--accent-color);
  font-weight: 600;
  border-right: 3px solid var(--accent-color);
}

.tab-item-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.close-btn {
  width: 28px;
  height: 28px;
  background: transparent;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.1s ease;
  flex-shrink: 0;
  margin-right: 8px;
}

.close-btn:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.close-btn:active {
  background: var(--active-bg);
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.15s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
