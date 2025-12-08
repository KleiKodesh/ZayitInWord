<template>
  <component :is="currentPageComponent"
             class="height-fill"
             :key="`tab-${tabStore.activeTab?.id}-${tabStore.activeTab?.currentPage}`" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTabStore } from '../stores/tabStore';
import LandingPage from './pages/LandingPage.vue';
import BookViewPage from './pages/BookViewPage.vue';
import PdfViewPage from './pages/PdfViewPage.vue';
import SearchPage from './pages/SearchPage.vue';
import SettingsPage from './pages/SettingsPage.vue';
import AboutPage from './pages/AboutPage.vue';

const tabStore = useTabStore();

const pageComponents = {
  landing: LandingPage,
  bookview: BookViewPage,
  pdfview: PdfViewPage,
  search: SearchPage,
  settings: SettingsPage,
  about: AboutPage
};

const currentPageComponent = computed(() => {
  const pageType = tabStore.activeTab?.currentPage || 'landing';
  return pageComponents[pageType];
});

</script>
