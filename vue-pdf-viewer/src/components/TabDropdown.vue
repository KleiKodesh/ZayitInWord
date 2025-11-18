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

const activateTab = (id: string) => { 
  tabsStore.activateTab(id)
  emit('close')
}
</script>

<style scoped>
.dropdown {
  position: absolute;
  top: 48px;
  left: 0;
  right: 0;
  background: #3c3c3c;
  max-height: 60vh;
  overflow-y: auto;
  z-index: 1000;
  border-bottom: 1px solid rgba(128, 128, 128, 0.35);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5);
  direction: rtl;
}

.tab-item {
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(128, 128, 128, 0.35);
  cursor: pointer;
  transition: background 0.1s ease;
  font-size: 14px;
  color: #cccccc;
}

.tab-item:hover {
  background: rgba(90, 93, 94, 0.31);
}

.tab-item:active {
  background: rgba(90, 93, 94, 0.5);
}

.tab-item.active {
  background: rgba(14, 99, 156, 0.3);
  color: #0e639c;
  font-weight: 600;
  border-right: 3px solid #0e639c;
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
  color: #858585;
  cursor: pointer;
  transition: all 0.1s ease;
  flex-shrink: 0;
  margin-right: 8px;
}

.close-btn:hover {
  background: rgba(90, 93, 94, 0.31);
  color: #cccccc;
}

.close-btn:active {
  background: rgba(90, 93, 94, 0.5);
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
