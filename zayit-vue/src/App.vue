<template>
    <TabControl class="height-fill" />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import TabControl from './components/TabControl.vue'
import { useTabStore } from './stores/tabStore'

const tabStore = useTabStore()

function handleGlobalKeyDown(e: KeyboardEvent) {
    // Prevent browser's default search when Ctrl+F is pressed
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
    }

    // Ctrl+W to close current tab
    if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault()
        tabStore.closeTab()
    }

    // Ctrl+X to close all tabs
    if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        e.preventDefault()
        tabStore.closeAllTabs()
    }
}

onMounted(() => {
    document.addEventListener('keydown', handleGlobalKeyDown)
})

onUnmounted(() => {
    document.removeEventListener('keydown', handleGlobalKeyDown)
})
</script>
