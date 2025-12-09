<template>
    <div ref="treeContainerRef"
         class="overflow-y height-fill"
         @keydown="navigator?.handleKeyDown">
        <div v-if="categoryTreeStore.isLoading"
             class="flex-center height-fill">
            <LoadingIcon />
        </div>
        <template v-else>
            <BookTreeCategoryNode v-for="(category, index) in categoryTreeStore.categoryTree"
                                  :key="category.id"
                                  :ref="el => { if (el) nodeRefs[index] = el as InstanceType<typeof BookTreeCategoryNode> }"
                                  :category="category" />
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import LoadingIcon from './icons/LoadingIcon.vue';
import { useCategoryTreeStore } from '../stores/categoryTreeStore';
import BookTreeCategoryNode from './BookTreeCategoryNode.vue';
import { KeyboardNavigator } from '../utils/KeyboardNavigator';

const categoryTreeStore = useCategoryTreeStore();
const nodeRefs = ref<InstanceType<typeof BookTreeCategoryNode>[]>([]);
const treeContainerRef = ref<HTMLElement>();
const navigator = ref<KeyboardNavigator>();

onMounted(() => {
    if (treeContainerRef.value) {
        navigator.value = new KeyboardNavigator(treeContainerRef.value);
    }
});

onUnmounted(() => {
    navigator.value?.destroy();
});

const resetTree = () => {
    // Reset all root nodes (which will recursively reset their children)
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
