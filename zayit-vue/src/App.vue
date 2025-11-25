<template>
  <div id="app" @click="handleAppClick">
    <TabHeader @toggle-dropdown="toggleDropdown" />
    <TabDropdown :is-open="isDropdownOpen" @close="closeDropdown" />
    <KeepAlive>
      <TabContent 
        v-if="tabsStore.activeTab" 
        :key="`${tabsStore.activeTab.id}-${tabsStore.activeTab.type}`" 
        :tab="tabsStore.activeTab" 
      />
    </KeepAlive>
  </div>
</template>

<script setup lang="ts">
  import { ref, KeepAlive } from 'vue'
  import { useThemeStore } from './stores/theme'
  import { useTabsStore } from './stores/tabStore'
  import TabHeader from './components/tabs/TabHeader.vue'
  import TabDropdown from './components/tabs/TabDropdown.vue'
  import TabContent from './components/tabs/TabContent.vue'

  const themeStore = useThemeStore()   // Initialize theme store (applies theme automatically)
  const tabsStore = useTabsStore()
  const isDropdownOpen = ref(false)

  const toggleDropdown = () => {
    isDropdownOpen.value = !isDropdownOpen.value
  }

  const closeDropdown = () => {
    isDropdownOpen.value = false
  }

  const handleAppClick = () => {
    // Close dropdown when clicking anywhere in the app
    if (isDropdownOpen.value)
      closeDropdown()
  }
</script>

<style>
/* Main app container - full viewport height with vertical layout */
#app {
  display: flex; /* Flexbox layout */
  flex-direction: column; /* Stack header, dropdown, and content vertically */
  height: 100vh; /* Full viewport height */
}

/* Tab content area - takes remaining space */
.tab-content {
  flex: 1; /* Grow to fill remaining space below header */
  overflow: hidden; /* Prevent content overflow */
}

/* Placeholder for empty or unimplemented content */
.placeholder {
  padding: 40px; /* Generous padding around placeholder */
  text-align: center; /* Center-align text */
  color: var(--text-secondary); /* Use muted text color */
}
</style>
