<template>
  <div class="split-pane-container" :class="{ 'bottom-hidden': !showBottom }">
    <div 
      class="top-pane" 
      :style="{ height: showBottom ? `${topHeight}%` : '100%' }"
    >
      <slot name="top"></slot>
    </div>
    
    <div 
      v-show="showBottom"
      class="resize-handle"
      @mousedown="startResize"
    >
      <div class="resize-handle-bar"></div>
    </div>
    
    <div 
      v-show="showBottom"
      class="bottom-pane"
      :style="{ height: `${bottomHeight}%` }"
    >
      <slot name="bottom"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  initialTopHeight?: number
  showBottom?: boolean
}>()

const emit = defineEmits<{
  resize: [topHeight: number, bottomHeight: number]
}>()

const topHeight = ref(props.initialTopHeight || 40)
const bottomHeight = computed(() => 100 - topHeight.value)

const isResizing = ref(false)

const startResize = (event: MouseEvent) => {
  isResizing.value = true
  event.preventDefault()
  
  const container = (event.target as HTMLElement).closest('.split-pane-container') as HTMLElement
  if (!container) return
  
  const containerRect = container.getBoundingClientRect()
  
  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.value) return
    
    const relativeY = e.clientY - containerRect.top
    const newTopHeight = (relativeY / containerRect.height) * 100
    
    // Constrain between 20% and 80%
    if (newTopHeight >= 20 && newTopHeight <= 80) {
      topHeight.value = newTopHeight
      emit('resize', topHeight.value, bottomHeight.value)
    }
  }
  
  const handleMouseUp = () => {
    isResizing.value = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}
</script>

<style scoped>
.split-pane-container {
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
}

.top-pane {
  overflow: hidden;
  direction: rtl;
  position: relative;
  flex-shrink: 0;
}

.resize-handle {
  height: 6px;
  background: var(--bg-secondary);
  border-top: 1px solid rgba(128, 128, 128, 0.15);
  border-bottom: none;
  cursor: ns-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.2s ease;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.resize-handle:hover {
  background: var(--bg-secondary);
}

.resize-handle:active {
  background: var(--hover-bg);
}

.resize-handle-bar {
  width: 40px;
  height: 2px;
  background: rgba(128, 128, 128, 0.2);
  border-radius: 2px;
  transition: all 0.2s ease;
  opacity: 0.5;
}

.resize-handle:hover .resize-handle-bar {
  background: var(--border-color);
  opacity: 0.8;
}

.resize-handle:active .resize-handle-bar {
  background: var(--accent-color);
  opacity: 1;
}

.bottom-pane {
  overflow: hidden;
  direction: rtl;
  position: relative;
  background: var(--bg-primary);
  min-height: 20%;
  display: flex;
  flex-direction: column;
}
</style>
