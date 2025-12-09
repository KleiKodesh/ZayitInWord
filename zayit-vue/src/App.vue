<template>
    <TabControl class="height-fill" />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import TabControl from './components/TabControl.vue'

function handleGlobalKeyDown(e: KeyboardEvent) {
    // Prevent browser's default search when Ctrl+F is pressed
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
    }
}

onMounted(() => {
    document.addEventListener('keydown', handleGlobalKeyDown)
})

onUnmounted(() => {
    document.removeEventListener('keydown', handleGlobalKeyDown)
})
</script>
