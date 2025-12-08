<template>
    <div ref="containerRef"
         class="overflow-y height-fill"
         @keydown="navigator?.handleKeyDown">
        <BookIconWithText v-if="isLoading"
                          text="טוען..." />
        <BookIconWithText v-else-if="tocEntries.length === 0"
                          text="אין תוכן עניינים זמין" />
        <template v-else>
            <BookTocTreeNode v-for="(entry, index) in tocEntries"
                             :key="entry.id"
                             :ref="el => { if (el) nodeRefs[index] = el as InstanceType<typeof BookTocTreeNode> }"
                             :entry="entry"
                             @select-line="emit('selectLine', $event)" />
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import BookIconWithText from './icons/BookIconWithText.vue';
import BookTocTreeNode from './BookTocTreeNode.vue';
import { KeyboardNavigator } from '../utils/KeyboardNavigator';
import type { TocEntry } from '../types/BookToc';

defineProps<{
    tocEntries: TocEntry[]
    isLoading?: boolean
}>();

const emit = defineEmits<{
    selectLine: [lineIndex: number]
}>();

const nodeRefs = ref<InstanceType<typeof BookTocTreeNode>[]>([]);
const containerRef = ref<HTMLElement>();
const navigator = ref<KeyboardNavigator>();

onMounted(() => {
    if (containerRef.value) {
        navigator.value = new KeyboardNavigator(containerRef.value);
    }
});

onUnmounted(() => {
    navigator.value?.destroy();
});

const resetTree = () => {
    nodeRefs.value.forEach(node => {
        if (node && node.reset) {
            node.reset();
        }
    });
}

defineExpose({
    resetTree
})
</script>
