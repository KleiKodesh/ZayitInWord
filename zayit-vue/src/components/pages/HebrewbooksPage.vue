<template>
    <div class="flex-column height-fill">
        <!-- Book List -->
        <div class="flex-110 overflow-y"
             style="overflow-x: hidden;">
            <!-- Loading state -->
            <div v-if="store.isLoading"
                 class="flex-center height-fill">
                <div class="flex-column flex-center">
                    <div class="loading-icon">⏳</div>
                    <div class="loading-text">טוען ספרים...</div>
                </div>
            </div>

            <!-- Error state -->
            <div v-else-if="store.error"
                 class="flex-center height-fill">
                <div class="flex-column flex-center">
                    <div class="error-icon">⚠️</div>
                    <div class="error-text">שגיאה בטעינת הספרים</div>
                    <div class="error-subtext text-secondary">{{ store.error }}</div>
                </div>
            </div>

            <!-- Book list -->
            <template v-else>
                <HebrewbooksListItem v-for="book in store.filteredBooks"
                                     :key="book.ID_Book"
                                     :book="book"
                                     @book-clicked="trackBookInteraction" />

                <!-- Empty state -->
                <div v-if="store.filteredBooks.length === 0"
                     class="flex-center height-fill">
                    <div class="flex-column flex-center">
                        <div class="empty-icon">📚</div>
                        <div v-if="store.debouncedSearchTerm"
                             class="empty-text">לא נמצאו ספרים</div>
                        <div v-else
                             class="empty-text">אין היסטוריה</div>
                        <div v-if="store.debouncedSearchTerm"
                             class="empty-subtext text-secondary">נסה לחפש במילים אחרות</div>
                        <div v-else
                             class="empty-subtext text-secondary">לחץ על ספרים כדי לראות אותם כאן</div>
                    </div>
                </div>
            </template>
        </div>

        <!-- Search at bottom -->
        <div class="bar">
            <input :value="store.searchTerm"
                   @input="handleSearchInput"
                   type="text"
                   placeholder="חיפוש ספרים, מחברים או נושאים..."
                   class="width-fill search-input" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import HebrewbooksListItem from '../HebrewbooksListItem.vue'
import type { HebrewBook } from '../../types/HebrewBook'
import { useHebrewBooksStore } from '../../stores/hebrewBooksStore'

// Use Pinia store
const store = useHebrewBooksStore()

// Track user interactions
const trackBookInteraction = async (book: HebrewBook) => {
    await store.trackBookInteraction(book.ID_Book)
}

// Handle search input changes
const handleSearchInput = (event: Event) => {
    const target = event.target as HTMLInputElement
    store.performDebouncedSearch(target.value)
}

// Load books on component mount
onMounted(async () => {
    await store.loadBooks()
})
</script>

<style scoped>
.loading-icon,
.error-icon,
.empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.6;
}

.loading-text,
.error-text,
.empty-text {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 8px;
}

.error-subtext,
.empty-subtext {
    font-size: 14px;
}

.search-input {
    padding: 10px 16px;
    border: 1px solid var(--border-color);
    border-radius: 20px;
    background-color: var(--bg-primary);
    color: var(--text-primary);
    font-size: 15px;
    direction: rtl;
    text-align: right;
    transition: border-color 0.15s ease;
    height: 40px;
}

.search-input:focus {
    border-color: var(--accent-color);
    box-shadow: 0 0 0 0.5px var(--accent-color);
    outline: none;
}

.search-input::placeholder {
    color: var(--text-secondary);
    opacity: 1;
}
</style>