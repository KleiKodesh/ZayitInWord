<template>
  <transition name="slide">
    <div v-if="isVisible"
         class="tab-dropdown">
      <template v-for="tab in tabStore.tabs"
                :key="tab.id">
        <div :class="['flex-row', 'bar', 'c-pointer', 'tab-item', { active: tab.isActive }]"
             @click="selectTab(tab.id)">
          <div></div> <!-- spacer -->
          <span class="center-text bold ellipsis">{{
            tab.title }}</span>
          <div class="justify-end">
            <button @click.stop="tabStore.closeTabById(tab.id)">×</button>
          </div>
        </div>
      </template>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useTabStore } from '../stores/tabStore';

const tabStore = useTabStore();
const isVisible = ref(false);

const toggle = () => {
  isVisible.value = !isVisible.value;
};

const close = () => {
  isVisible.value = false;
};

const selectTab = (id: number) => {
  tabStore.setActiveTab(id);
  close();
};

defineExpose({ toggle, close, isVisible });
</script>

<style scoped>
.tab-dropdown {
  position: absolute;
  width: 100%;
  max-height: 40vh;
  /* Maximum height is 40% of viewport */
  overflow-y: auto;
  /* Enable vertical scrolling if content exceeds max-height */
  /* scrollbar-gutter: stable; Reserve space for scrollbar to prevent layout shift */
  z-index: 1000;
  /* Stack above other content */
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  /* Bottom border separator */
  box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.1);
  /* Subtle shadow for depth */
}

.tab-dropdown .bar {
  border-right: 3.5px solid transparent;
  /* placeholder so content doesnt shift */
}

.tab-dropdown .bar:hover {
  background: var(--hover-bg);
}

.tab-dropdown .bar.active {
  border-right: 3.5px solid var(--accent-color);
  color: var(--accent-color);
  font-weight: 600;
}

.tab-item>div {
  flex: 1 1 0%;
}
</style>
