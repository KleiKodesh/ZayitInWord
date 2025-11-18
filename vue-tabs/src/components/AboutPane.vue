<template>
  <div v-if="isOpen" class="about-overlay">
    <div class="about-pane">
      <div class="about-header">
        <button class="close-btn" @click="close">×</button>
        <h2>אודות</h2>
      </div>
      <iframe 
        src="https://kleikodesh.github.io/" 
        class="about-iframe"
        frameborder="0"
        title="About"
      ></iframe>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const close = () => emit('close')
</script>

<style scoped>
.about-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-primary);
  z-index: 1002;
  animation: fadeIn 0.2s ease;
}

.about-pane {
  background: var(--bg-primary);
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.about-header {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
  min-height: 40px;
  flex-shrink: 0;
  gap: 8px;
}

.about-header h2 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  flex: 1;
  text-align: right;
  line-height: 1;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 20px;
  color: var(--text-secondary);
  cursor: pointer;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
  line-height: 1;
  padding: 0;
  flex-shrink: 0;
}

.close-btn:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.about-iframe {
  flex: 1;
  width: 100%;
  height: 100%;
  border: none;
  background: white;
}
</style>
