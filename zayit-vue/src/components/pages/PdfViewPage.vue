<template>
  <div class="height-fill pdfview-page">
    <iframe v-if="pdfUrl"
            :src="pdfUrl"
            class="pdf-iframe"
            title="PDF Viewer"></iframe>
    <div v-else
         class="flex-center height-fill">
      <p>לא נמצא קובץ PDF</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTabStore } from '../../stores/tabStore';

const tabStore = useTabStore();

const pdfUrl = computed(() => {
  const baseUrl = tabStore.activeTab?.pdfState?.fileUrl;
  return baseUrl ? `${baseUrl}#page=1` : undefined;
});
</script>

<style scoped>
.pdfview-page {
  position: relative;
}

.pdf-iframe {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
