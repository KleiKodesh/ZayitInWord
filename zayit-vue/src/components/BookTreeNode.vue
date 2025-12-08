<template>
    <div ref="nodeRef"
         class="flex-row hover-bg focus-accent click-effect c-pointer bold tree-node reactive-icon"
         :class="{ 'keyboard-active': isKeyboardActive }"
         tabindex="0"
         :style="{ paddingInlineStart: `${20 + depth * 20}px` }"
         @click="selectBook"
         @keydown.enter="handleKeyboardSelect">
        <BookIcon />
        <span class="flex-110 line-1.4">{{ props.book.title }}</span>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Book } from '../types/Book'
import BookIcon from './icons/BookIcon.vue';
import { useTabStore } from '../stores/tabStore';

const props = withDefaults(defineProps<{
    book: Book
    depth?: number
}>(), {
    depth: 0
})

const tabStore = useTabStore()

const nodeRef = ref<HTMLElement>()
const isKeyboardActive = ref(false)

const selectBook = () => {
    tabStore.openBookToc(props.book.title, props.book.id, props.book.hasTargumConnection, props.book.hasReferenceConnection, props.book.hasCommentaryConnection)
}

const handleKeyboardSelect = () => {
    // Trigger visual feedback
    isKeyboardActive.value = true
    setTimeout(() => {
        isKeyboardActive.value = false
    }, 150)

    selectBook()
}

</script>

<style scoped></style>
