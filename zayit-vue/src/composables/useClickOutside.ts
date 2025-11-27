import { onClickOutside as vueUseClickOutside } from '@vueuse/core'
import type { MaybeElementRef } from '@vueuse/core'

/**
 * Composable for handling click-outside events
 * Wrapper around VueUse's onClickOutside for consistent usage across the app
 * 
 * @param target - Element ref or array of refs to watch
 * @param handler - Callback function when clicking outside
 * 
 * @example
 * ```vue
 * <script setup>
 * import { ref } from 'vue'
 * import { useClickOutside } from '@/composables/useClickOutside'
 * 
 * const dropdownRef = ref(null)
 * const isOpen = ref(false)
 * 
 * useClickOutside(dropdownRef, () => {
 *   isOpen.value = false
 * })
 * </script>
 * 
 * <template>
 *   <div ref="dropdownRef">
 *     <button @click="isOpen = !isOpen">Toggle</button>
 *     <div v-if="isOpen">Dropdown content</div>
 *   </div>
 * </template>
 * ```
 */
export function useClickOutside(
  target: MaybeElementRef,
  handler: (event: PointerEvent) => void
) {
  return vueUseClickOutside(target, handler)
}
