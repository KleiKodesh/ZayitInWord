<template>
  <div ref="headerAreaRef">
    <div class="bar tab-header" @click.stop="toggleDropdown">
      <button @click.stop="themeStore.toggleTheme()" title="Toggle theme">
        <ThemeIcon />
      </button>

      <div class="tab-title">
        {{ currentTitle }}
      </div>   
         
      <button @click.stop="handleHome" title="עמוד הבית">
        <HomeIcon />
      </button>
      <button @click.stop="handleAdd" title="טאב חדש">+</button>
      <button @click.stop="handleClose" title="סגור טאב">×</button>
    </div>

    <TabDropdown :is-open="isDropdownOpen" @close="closeDropdown" />
  </div>
</template>


<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useTabsStore } from '../../stores/tabStore'
  import { useThemeStore } from '../../stores/theme'
  import { useClickOutside } from '../../composables/useClickOutside'
  import ThemeIcon from '../icons/ThemeIcon.vue'
  import HomeIcon from '../icons/HomeIcon.vue'
  import TabDropdown from './TabDropdown.vue'

  const tabsStore = useTabsStore()
  const themeStore = useThemeStore()
  const isDropdownOpen = ref(false)
  const headerAreaRef = ref(null)

  const currentTitle = computed(() => 
   tabsStore.activeTab?.title || 'No tabs'
  )

  const toggleDropdown = () => {
    isDropdownOpen.value = !isDropdownOpen.value
  }

  const closeDropdown = () => {
    isDropdownOpen.value = false
  }

  const handleHome = () => {
    // Close current tab and create a new landing page tab
    if (tabsStore.activeTab) {
      tabsStore.closeTab(tabsStore.activeTab.id)
    }
    tabsStore.createTab('איתור')
  }

  const handleAdd = () => {
    tabsStore.createTab('איתור')
  }

  const handleClose = () => {
    if (tabsStore.activeTab)
      tabsStore.closeTab(tabsStore.activeTab.id)
  }

  // Close dropdown when clicking outside the header/dropdown area
  useClickOutside(headerAreaRef, () => {
    isDropdownOpen.value = false
  })

</script>

<style scoped>
/* Parent container for header and dropdown - positioned for absolute child */
div {
  position: relative; /* Positioning context for absolute dropdown */
}

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
