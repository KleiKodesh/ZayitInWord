<template>
    <div v-if="showItem"
         @click.stop="handleClick"
         class="flex-row flex-center-start hover-bg c-pointer dropdown-item"
         :title="title">
        <span class="diacritics-icon"
              :class="stateClass">{{ icon }}</span>
        <span class="dropdown-label">{{ label }}</span>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTabStore } from '../stores/tabStore'

const tabStore = useTabStore()

const showItem = computed(() => {
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
    if (diacriticsState.value === 1) return 'אָ'
    if (diacriticsState.value === 2) return 'א'
    return 'אָ֑'
})

const label = computed(() => {
    if (diacriticsState.value === 0) return 'הסר טעמים'
    if (diacriticsState.value === 1) return 'הסר גם ניקוד'
    return 'שחזר טעמים וניקוד'
})

const title = computed(() => {
    return label.value
})

const handleClick = () => {
    tabStore.toggleDiacritics()
}
</script>

<style scoped>
.diacritics-icon {
    flex-shrink: 0;
    font-size: 20px;
    font-family: 'Times New Roman', Times, serif;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.7;
}

.dropdown-label {
    font-size: 14px;
    color: var(--text-primary);
    white-space: nowrap;
}

.dropdown-item:hover .diacritics-icon {
    opacity: 1;
}

.diacritics-icon.state-1 {
    color: #ff8c00;
}

.diacritics-icon.state-2 {
    color: #ff4500;
}
</style>
