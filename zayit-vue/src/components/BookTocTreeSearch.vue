<template>
    <BookIconWithText v-if="filteredEntries.length === 0"
                      text="לא נמצאו תוצאות" />
    <div v-else
         ref="containerRef"
         class="flex-column overflow-y"
         @keydown="navigator?.handleKeyDown">

        <div v-for="entry in filteredEntries"
             :key="entry.id"
             class="flex-row hover-bg focus-accent click-effect c-pointer tree-node"
             tabindex="0"
             :style="{ paddingInlineStart: `${20}px` }"
             @click="selectEntry(entry)"
             @keydown.enter.prevent="selectEntry(entry)">
            <div class="flex-column flex-110 smaller-rem">
                <span class="bold">{{ entry.text }}</span>
                <span v-if="entry.path"
                      class="text-secondary smaller-em">{{ entry.path }}</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import type { TocEntry } from '../types/BookToc'
import BookIconWithText from './icons/BookIconWithText.vue'
import { KeyboardNavigator } from '../utils/KeyboardNavigator'

const props = defineProps<{
    tocEntries: TocEntry[]
    searchQuery: string
}>()

const emit = defineEmits<{
    selectLine: [lineIndex: number]
}>()

const containerRef = ref<HTMLElement>()
const navigator = ref<KeyboardNavigator>()
const debouncedQuery = ref('')
let debounceTimeout: number | null = null

// Debounce the search query
watch(() => props.searchQuery, (newValue) => {
    if (debounceTimeout) {
        clearTimeout(debounceTimeout)
    }

    debounceTimeout = window.setTimeout(() => {
        debouncedQuery.value = newValue
    }, 250)
}, { immediate: true })

const filteredEntries = computed(() => {
    if (!debouncedQuery.value.trim()) {
        return []
    }

    const searchWords = debouncedQuery.value.trim().toLowerCase().split(/\s+/)
    const results: TocEntry[] = []

    // Flatten all entries including nested children
    const flattenEntries = (entries: TocEntry[]): TocEntry[] => {
        const flat: TocEntry[] = []
        for (const entry of entries) {
            flat.push(entry)
            if (entry.children && entry.children.length > 0) {
                flat.push(...flattenEntries(entry.children))
            }
        }
        return flat
    }

    const allEntries = flattenEntries(props.tocEntries)

    for (const entry of allEntries) {
        const searchText = `${entry.path || ''} ${entry.text}`.toLowerCase()
        if (searchWords.every(word => searchText.includes(word))) {
            results.push(entry)
            if (results.length === 100) {
                break
            }
        }
    }

    return results
})

const selectEntry = (entry: TocEntry) => {
    emit('selectLine', entry.lineIndex)
}

onMounted(() => {
    if (containerRef.value) {
        navigator.value = new KeyboardNavigator(containerRef.value)
    }
})

onUnmounted(() => {
    navigator.value?.destroy()
    if (debounceTimeout) {
        clearTimeout(debounceTimeout)
    }
})

// Reinitialize navigator when search results change
watch(filteredEntries, () => {
    if (containerRef.value && navigator.value) {
        navigator.value.destroy()
        navigator.value = new KeyboardNavigator(containerRef.value)
    }
})
</script>
