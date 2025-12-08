<template>
    <BookIconWithText v-if="filteredBooks.length === 0"
                      text="לא נמצאו תוצאות" />
    <div v-else
         ref="containerRef"
         class="flex-column overflow-y"
         @keydown="navigator?.handleKeyDown">
        <div v-for="book in filteredBooks"
             :key="book.id"
             class="flex-row hover-bg focus-accent click-effect c-pointer tree-node search-result reactive-icon"
             tabindex="0"
             @click="selectBook(book)"
             @keydown.enter.prevent="selectBook(book)">
            <BookIcon />
            <div class="flex-column flex-110 smaller-rem">
                <span class="bold">{{ book.title }}</span>
                <span v-if="book.path"
                      class="text-secondary smaller-em">{{ book.path }}</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import type { Book } from '../types/Book'
import BookIcon from './icons/BookIcon.vue'
import BookIconWithText from './icons/BookIconWithText.vue'
import { KeyboardNavigator } from '../utils/KeyboardNavigator'
import { useTabStore } from '../stores/tabStore'

const props = defineProps<{
    books: Book[]
    searchQuery: string
}>()

const containerRef = ref<HTMLElement>()
const navigator = ref<KeyboardNavigator>()
const tabStore = useTabStore()
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

const filteredBooks = computed(() => {
    if (!debouncedQuery.value.trim()) {
        return []
    }

    const searchWords = debouncedQuery.value.trim().toLowerCase().split(/\s+/)
    const results: Book[] = []

    for (const book of props.books) {
        const searchText = `${book.path || ''} ${book.title}`.toLowerCase()
        if (searchWords.every(word => searchText.includes(word))) {
            results.push(book)
            if (results.length === 100) {
                break
            }
        }
    }

    return results
})

const selectBook = (book: Book) => {
    tabStore.openBookToc(book.title, book.id, book.hasTargumConnection, book.hasReferenceConnection, book.hasCommentaryConnection)
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
watch(filteredBooks, () => {
    if (containerRef.value && navigator.value) {
        navigator.value.destroy()
        navigator.value = new KeyboardNavigator(containerRef.value)
    }
})

</script>

<style scoped>
.empty-state {
    gap: 16px;
    height: 100%;
    width: 100%;
    font-weight: 600;
}

.empty-icon {
    width: 3rem;
    height: 3rem;
    color: var(--accent-color);
}
</style>
