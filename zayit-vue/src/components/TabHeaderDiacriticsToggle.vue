<template>
    <button v-if="showButton"
            @click.stop="handleClick"
            :class="['flex-center c-pointer diacritics-toggle-btn', stateClass]"
            :title="title">
        <span class="diacritics-icon">{{ icon }}</span>
    </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTabStore } from '../stores/tabStore'

const tabStore = useTabStore()

const showButton = computed(() => {
    return tabStore.activeTab?.currentPage === 'bookview'
})

const diacriticsState = computed(() => {
    return tabStore.activeTab?.bookState?.diacriticsState || 0
})

const stateClass = computed(() => {
    if (diacriticsState.value === 1) return 'state-1'
    if (diacriticsState.value === 2) return 'state-2'
    return ''
})

const icon = computed(() => {
    if (diacriticsState.value === 1) return 'אָ' // With cantillation mark
    if (diacriticsState.value === 2) return 'א'   // Plain letter
    return 'אָ֑'  // With both nikkud and cantillation
})

const title = computed(() => {
    if (diacriticsState.value === 0) return 'הסר טעמים'
    if (diacriticsState.value === 1) return 'הסר גם ניקוד'
    return 'שחזר טעמים וניקוד'
})

const handleClick = () => {
    tabStore.toggleDiacritics()
}
</script>

<style scoped>
.diacritics-toggle-btn:hover {
    background: var(--hover-bg);
    transform: scale(1.05);
}

.diacritics-icon {
    font-size: 18px;
    font-family: 'Times New Roman', Times, serif;
    transition: opacity 0.2s ease, color 0.2s ease;
    transform: translateY(-3px);
}

.diacritics-toggle-btn.state-1 .diacritics-icon {
    color: #ff8c00;
}

.diacritics-toggle-btn.state-2 .diacritics-icon {
    color: #ff4500;
}
</style>