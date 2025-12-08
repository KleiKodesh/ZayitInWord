<template>
    <div class="about-page">
        <iframe src="https://kleikodesh.github.io/"
                class="about-iframe"
                frameborder="0"
                title="About"></iframe>
    </div>
</template>

<script setup lang="ts">
// About page with iframe
</script>

<style scoped>
.about-page {
    background: var(--bg-primary);
    width: 100%;
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.about-iframe {
    flex: 1;
    width: 100%;
    height: 100%;
    border: none;
    background: white;
}
</style>
