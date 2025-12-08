import { ref, onMounted, onUnmounted, type Ref } from 'vue'

export interface ContainedSelectionOptions {
    /**
     * Whether to handle Ctrl+A to select all text within the container only
     */
    handleSelectAll?: boolean
    /**
     * Whether to prevent selection from extending outside the container
     */
    preventSelectionSpanning?: boolean
    /**
     * Callback when selection starts in this container (to clear other containers)
     */
    onSelectionStart?: () => void
}

/**
 * Composable that contains text selection within a specific DOM element.
 * Handles mouse selection, keyboard selection (Ctrl+A), and prevents
 * selection from spanning across different containers.
 */
export function useContainedSelection(
    containerRef: Ref<HTMLElement | null>,
    options: ContainedSelectionOptions = {}
) {
    const {
        handleSelectAll = true,
        preventSelectionSpanning = true,
        onSelectionStart
    } = options

    const isSelecting = ref(false)
    const selectionStartContainer = ref<HTMLElement | null>(null)

    // Handle mouse down to start selection
    const handleMouseDown = (event: MouseEvent) => {
        if (!containerRef.value) return

        // Check if the mousedown is within our container
        const target = event.target as HTMLElement
        if (containerRef.value.contains(target)) {
            isSelecting.value = true
            selectionStartContainer.value = containerRef.value

            // Clear any existing selection and notify other containers
            clearSelection()
            onSelectionStart?.()
        }
    }

    // Handle mouse move during selection
    const handleMouseMove = (event: MouseEvent) => {
        if (!isSelecting.value || !preventSelectionSpanning) return

        const selection = window.getSelection()
        if (!selection || selection.rangeCount === 0) return

        // If selection extends outside our container, constrain it
        const range = selection.getRangeAt(0)
        if (!isRangeWithinContainer(range, selectionStartContainer.value)) {
            constrainSelectionToContainer(selection, selectionStartContainer.value)
        }
    }

    // Handle mouse up to end selection
    const handleMouseUp = () => {
        isSelecting.value = false
        selectionStartContainer.value = null
    }

    // Handle keyboard events
    const handleKeyDown = (event: KeyboardEvent) => {
        if (!containerRef.value) return

        // Handle Ctrl+A (or Cmd+A on Mac)
        if (handleSelectAll && (event.ctrlKey || event.metaKey) && event.key === 'a') {
            // Check if focus is within our container
            const activeElement = document.activeElement
            if (containerRef.value.contains(activeElement) || containerRef.value === activeElement) {
                event.preventDefault()
                event.stopPropagation()
                selectAllInContainer()
                onSelectionStart?.()
            }
        }

        // Handle Shift+Click selections and other keyboard selections
        if (event.shiftKey && (event.key === 'ArrowLeft' || event.key === 'ArrowRight' ||
            event.key === 'ArrowUp' || event.key === 'ArrowDown' ||
            event.key === 'Home' || event.key === 'End' ||
            event.key === 'PageUp' || event.key === 'PageDown')) {

            const activeElement = document.activeElement
            if (containerRef.value.contains(activeElement) || containerRef.value === activeElement) {
                onSelectionStart?.()

                // Use setTimeout to check selection after the keyboard event is processed
                setTimeout(() => {
                    constrainCurrentSelection()
                }, 0)
            }
        }
    }

    // Handle selection change events
    const handleSelectionChange = () => {
        if (!preventSelectionSpanning) return

        const selection = window.getSelection()
        if (!selection || selection.rangeCount === 0) return

        // If we have an active selection that started in our container,
        // make sure it doesn't extend outside
        if (selectionStartContainer.value) {
            const range = selection.getRangeAt(0)
            if (!isRangeWithinContainer(range, selectionStartContainer.value)) {
                constrainSelectionToContainer(selection, selectionStartContainer.value)
            }
        }
    }

    // Check if a range is entirely within a container
    const isRangeWithinContainer = (range: Range, container: HTMLElement | null): boolean => {
        if (!container) return false

        const startContainer = range.startContainer
        const endContainer = range.endContainer

        // Check if both start and end are within our container
        const startWithin = container.contains(startContainer) || container === startContainer
        const endWithin = container.contains(endContainer) || container === endContainer

        return startWithin && endWithin
    }

    // Constrain selection to stay within container
    const constrainSelectionToContainer = (selection: Selection, container: HTMLElement | null) => {
        if (!container || selection.rangeCount === 0) return

        const range = selection.getRangeAt(0)
        const newRange = document.createRange()

        // Adjust start position if it's outside container
        let startContainer = range.startContainer
        let startOffset = range.startOffset

        if (!container.contains(startContainer) && container !== startContainer) {
            // Find first text node in container
            const walker = document.createTreeWalker(
                container,
                NodeFilter.SHOW_TEXT,
                null
            )
            const firstTextNode = walker.nextNode()
            if (firstTextNode) {
                startContainer = firstTextNode
                startOffset = 0
            }
        }

        // Adjust end position if it's outside container
        let endContainer = range.endContainer
        let endOffset = range.endOffset

        if (!container.contains(endContainer) && container !== endContainer) {
            // Find last text node in container
            const walker = document.createTreeWalker(
                container,
                NodeFilter.SHOW_TEXT,
                null
            )
            let lastTextNode = null
            let node
            while (node = walker.nextNode()) {
                lastTextNode = node
            }
            if (lastTextNode) {
                endContainer = lastTextNode
                endOffset = lastTextNode.textContent?.length || 0
            }
        }

        try {
            newRange.setStart(startContainer, startOffset)
            newRange.setEnd(endContainer, endOffset)
            selection.removeAllRanges()
            selection.addRange(newRange)
        } catch (error) {
            // If range creation fails, just clear selection
            selection.removeAllRanges()
        }
    }

    // Constrain current selection to container
    const constrainCurrentSelection = () => {
        const selection = window.getSelection()
        if (!selection || !containerRef.value) return

        constrainSelectionToContainer(selection, containerRef.value)
    }

    // Select all text within the container
    const selectAllInContainer = () => {
        if (!containerRef.value) return

        const selection = window.getSelection()
        if (!selection) return

        const range = document.createRange()
        range.selectNodeContents(containerRef.value)
        selection.removeAllRanges()
        selection.addRange(range)
    }

    // Clear selection
    const clearSelection = () => {
        const selection = window.getSelection()
        if (selection) {
            selection.removeAllRanges()
        }
    }

    // Set up event listeners
    onMounted(() => {
        if (!containerRef.value) return

        // Make container focusable for keyboard events
        if (!containerRef.value.hasAttribute('tabindex')) {
            containerRef.value.setAttribute('tabindex', '0')
        }

        // Add event listeners
        document.addEventListener('mousedown', handleMouseDown, true)
        document.addEventListener('mousemove', handleMouseMove, true)
        document.addEventListener('mouseup', handleMouseUp, true)
        document.addEventListener('keydown', handleKeyDown, true)
        document.addEventListener('selectionchange', handleSelectionChange)
    })

    // Clean up event listeners
    onUnmounted(() => {
        document.removeEventListener('mousedown', handleMouseDown, true)
        document.removeEventListener('mousemove', handleMouseMove, true)
        document.removeEventListener('mouseup', handleMouseUp, true)
        document.removeEventListener('keydown', handleKeyDown, true)
        document.removeEventListener('selectionchange', handleSelectionChange)
    })

    return {
        clearSelection,
        selectAllInContainer,
        constrainCurrentSelection
    }
}