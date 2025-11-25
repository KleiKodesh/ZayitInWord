<template>
  <div class="bar tab-header" @click.stop="emit('toggleDropdown')">
    <button @click.stop="themeStore.toggleTheme()" title="Toggle theme">
      <ThemeIcon />
    </button>
    <div class="tab-title">
      {{ currentTitle }}
    </div>
    <button @click.stop="handleAdd">+</button>
    <button @click.stop="handleClose">×</button>
  </div>
</template>


<script setup lang="ts">
  import { computed } from 'vue'
  import { useTabsStore } from '../../stores/tabStore'
  import { useThemeStore } from '../../stores/theme'
  import ThemeIcon from '../icons/ThemeIcon.vue'

  const emit = defineEmits<{ toggleDropdown: [] }>()

  const tabsStore = useTabsStore()
  const themeStore = useThemeStore()
  const currentTitle = computed(() => 
   tabsStore.activeTab?.title || 'No tabs'
  )

  const handleAdd = () => {
    tabsStore.createTab('איתור')
  }

  const handleClose = () => {
    if (tabsStore.activeTab)
      tabsStore.closeTab(tabsStore.activeTab.id)
  }

</script>

<style scoped>
/* Tab header container - extends .bar class */
.tab-header {
  border-bottom: 1px solid var(--border-color); /* Bottom border separator */
  justify-content: space-between; /* Space between left/center/right sections */
  font-weight: 600;
}

/* Tab title text in center */
.tab-title {
  flex: 1; /* Take remaining space between buttons */
  overflow: hidden; /* Hide overflowing text */
  text-overflow: ellipsis; /* Show ... for truncated text */
  white-space: nowrap; /* Prevent text wrapping to new line */
  cursor: pointer; /* Show hand cursor to indicate clickable */
}

</style>
