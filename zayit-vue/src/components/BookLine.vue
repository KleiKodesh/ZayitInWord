<template>
    <span class="selectable line-1.6 justify book-line"
          :class="{ selected: isSelected }"
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
    display: block;
}

.book-line.inline-mode {
    /* padding-left: 5px; */
}

.book-line :deep(h1),
.book-line :deep(h2),
.book-line :deep(h3),
.book-line :deep(h4),
.book-line :deep(h5),
.book-line :deep(h6) {
    position: relative;
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

/* Block mode selection - only when NOT in inline mode AND split pane is open */
.book-line.selected:not(.inline-mode).show-selection::after {
    content: '';
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    right: 0;
    width: 3px;
    height: 1em;
    background-color: var(--accent-color);
}

/* Inline mode selection - use background instead of ::after AND split pane is open */
.book-line.inline-mode.selected.show-selection {
    background-color: var(--accent-bg);
}
</style>
