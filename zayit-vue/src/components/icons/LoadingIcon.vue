<template>
    <div class="loading-icon">
        <BookIcon />
    </div>
</template>

<script setup lang="ts">
import BookIcon from './BookIcon.vue';
</script>

<style scoped>
.loading-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    opacity: 0.6;
}
</style>
