<template>
  <div id="app">
    <TabHeader />
    <!-- 
      IMPORTANT: Each tab gets its own TabContent instance
      - Key is ONLY tab.id to maintain component state when switching tabs
      - DO NOT add tab.type to key - it breaks KeepAlive caching
    -->
    <KeepAlive>
      <TabContent 
        v-if="tabsStore.activeTab" 
        :key="tabsStore.activeTab.id" 
        :tab="tabsStore.activeTab"
        class="content-area"
      />
    </KeepAlive>
  </div>
</template>

<script setup lang="ts">
  import { KeepAlive } from 'vue'
  import { useThemeStore } from './stores/theme'
  import { useTabsStore } from './stores/tabStore'
  import TabHeader from './components/tabs/TabHeader.vue'
  import TabContent from './components/tabs/TabContent.vue'

  useThemeStore()   // Initialize theme store (applies theme automatically)
  const tabsStore = useTabsStore()
</script>

<style>
/* Main app container - full viewport height with vertical layout */
#app {
  display: flex; /* Flexbox layout */
  flex-direction: column; /* Stack header, dropdown, and content vertically */
  height: 100vh; /* Full viewport height */
}

/* Content area - grows to fill remaining space below header */
.content-area {
  flex: 1; /* Grow to fill available space */
  overflow: hidden; /* Prevent overflow */
}
</style>

