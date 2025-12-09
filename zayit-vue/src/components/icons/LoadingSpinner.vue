<template>
    <div class="loading-spinner-icon"
         :style="{ width: `${width}px`, height: `${height}px` }"></div>
</template>

<script setup lang="ts">
interface Props {
    width?: number
    height?: number
}

withDefaults(defineProps<Props>(), {
    width: 24,
    height: 24
})
</script>

<style scoped>
.loading-spinner-icon {
    border: 3px solid var(--border-color);
    border-top-color: var(--accent-color);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>