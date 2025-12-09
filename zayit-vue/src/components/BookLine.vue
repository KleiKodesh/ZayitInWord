<template>
    <span class="selectable line-1.6 book-line"
          :class="{ selected: isSelected, justify: !inlineMode }"
          tabindex="0"
          :data-line-index="lineIndex"
          @click="handleClick"
          v-html="content + ' '">
    </span>
</template>

<script setup lang="ts">
const props = defineProps<{
    content: string
    lineIndex: number
    isSelected: boolean
    inlineMode?: boolean
}>()

const emit = defineEmits<{
    lineClick: [lineIndex: number]
}>()

const handleClick = () => {
    emit('lineClick', props.lineIndex)
}
</script>

<style scoped>
.book-line {
    font-family: var(--text-font);
    line-height: var(--line-height, 1.2);
}

.book-line:not(.inline-mode) {
    padding: 0px 5px;
    display: block;
}

.book-line.inline-mode {
    display: inline;
    padding: 0;
}

.book-line :deep(h1),
.book-line :deep(h2),
.book-line :deep(h3),
.book-line :deep(h4),
.book-line :deep(h5),
.book-line :deep(h6) {
    font-family: var(--header-font);
}

.book-line :deep(h1)::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background-color: var(--hover-bg)
}

.book-line :deep(h1) {
    position: relative;
}

/* Block mode selection */
.book-line.selected.show-selection {
    position: relative;
}

.book-line.selected.show-selection {
    background-color: var(--hover-bg);
}
</style>
