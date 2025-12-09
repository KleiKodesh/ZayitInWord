<template>
    <div class="loading-icon">
        <div class="loading-spinner" />
    </div>
</template>

<style scoped>
.loading-icon {
    width: 48px;
    height: 48px;
    border: 4px solid var(--border-color);
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
