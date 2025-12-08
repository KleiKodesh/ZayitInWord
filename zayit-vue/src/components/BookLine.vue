<template>
    <div class="selectable line-1.6 justify book-line"
         :class="{ selected: isSelected }"
         tabindex="0"
         :data-line-index="lineIndex"
         @click="handleClick"
         v-html="content">
    </div>
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
    padding: 0 5px;
    position: relative;
    font-family: var(--text-font);
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

.book-line.selected::after {
    content: '';
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    right: 0;
    width: 3px;
    height: 1em;
    background-color: var(--accent-color);
}
</style>
