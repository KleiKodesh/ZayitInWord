<template>
  <component :is="currentPageComponent"
             class="height-fill"
             :key="`tab-${tabStore.activeTab?.id}-${tabStore.activeTab?.currentPage}`" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTabStore } from '../stores/tabStore';
import KezayitLandingPage from './pages/KezayitLandingPage.vue';
import BookViewPage from './pages/BookViewPage.vue';
import PdfViewPage from './pages/PdfViewPage.vue';
import SearchPage from './pages/SearchPage.vue';
import SettingsPage from './pages/SettingsPage.vue';
import AboutPage from './pages/AboutPage.vue';

const tabStore = useTabStore();

const pageComponents = {
  'kezayit-landing': KezayitLandingPage,
  'landing': KezayitLandingPage, // Fallback for old stored tabs
  bookview: BookViewPage,
  pdfview: PdfViewPage,
  search: SearchPage,
  settings: SettingsPage,
  about: AboutPage
};

const currentPageComponent = computed(() => {
  const pageType = tabStore.activeTab?.currentPage || 'kezayit-landing';
  return pageComponents[pageType];
});

</script>
