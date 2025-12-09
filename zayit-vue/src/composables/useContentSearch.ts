import { ref, computed } from 'vue'

export interface SearchMatch {
    itemIndex: number
    occurrence: number
}

export interface SearchableItem {
    index: number
    content: string
}

// Helper to strip Hebrew diacritics for matching
function stripDiacritics(text: string): string {
    return text.replace(/[\u0591-\u05C7]/g, '').toLowerCase()
}

export function useContentSearch() {
    const searchQuery = ref('')
    const matches = ref<SearchMatch[]>([])
    const currentMatchIndex = ref(-1)

    const totalMatches = computed(() => matches.value.length)
    const currentMatch = computed(() =>
        currentMatchIndex.value >= 0 ? matches.value[currentMatchIndex.value] : null
    )

    function searchInItems(items: SearchableItem[], query: string) {
        searchQuery.value = query

        if (!query.trim()) {
            matches.value = []
            currentMatchIndex.value = -1
            return
        }

        const searchStripped = stripDiacritics(query)
        const foundMatches: SearchMatch[] = []

        items.forEach(item => {
            if (!item.content || item.content === '-') return

            // Extract text from HTML
            const tempDiv = document.createElement('div')
            tempDiv.innerHTML = item.content
            const text = tempDiv.textContent || ''
            const textStripped = stripDiacritics(text)

            // Count all occurrences in this item
            let searchIndex = 0
            let occurrence = 0
            while (searchIndex < textStripped.length) {
                const matchIndex = textStripped.indexOf(searchStripped, searchIndex)
                if (matchIndex === -1) break
                foundMatches.push({ itemIndex: item.index, occurrence })
                occurrence++
                searchIndex = matchIndex + searchStripped.length
            }
        })

        matches.value = foundMatches
        currentMatchIndex.value = foundMatches.length > 0 ? 0 : -1
    }

    function navigateToMatch(index: number) {
        if (index >= 0 && index < matches.value.length) {
            currentMatchIndex.value = index
        }
    }

    function highlightMatches(htmlContent: string, query: string, currentOccurrence: number = -1): string {
        if (!htmlContent || !query) return htmlContent

        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = htmlContent

        const walker = document.createTreeWalker(
            tempDiv,
            NodeFilter.SHOW_TEXT,
            null
        )

        const textNodes: Text[] = []
        let node: Node | null
        while ((node = walker.nextNode())) {
            textNodes.push(node as Text)
        }

        const searchStripped = stripDiacritics(query)
        let occurrenceIndex = 0

        textNodes.forEach(textNode => {
            const text = textNode.nodeValue || ''
            const textStripped = stripDiacritics(text)

            if (textStripped.includes(searchStripped)) {
                const fragment = document.createDocumentFragment()
                let lastIndex = 0
                let searchIndex = 0

                while (searchIndex < textStripped.length) {
                    const matchIndex = textStripped.indexOf(searchStripped, searchIndex)
                    if (matchIndex === -1) break

                    // Find actual character positions in original text
                    let actualStart = 0
                    let strippedCount = 0
                    for (let i = 0; i < text.length && strippedCount < matchIndex; i++) {
                        const char = text[i]
                        if (char && stripDiacritics(char)) {
                            strippedCount++
                        }
                        actualStart = i + 1
                    }

                    let actualEnd = actualStart
                    strippedCount = 0
                    for (let i = actualStart; i < text.length && strippedCount < searchStripped.length; i++) {
                        const char = text[i]
                        if (char && stripDiacritics(char)) {
                            strippedCount++
                        }
                        actualEnd = i + 1
                    }

                    // Add text before match
                    if (actualStart > lastIndex) {
                        fragment.appendChild(document.createTextNode(text.substring(lastIndex, actualStart)))
                    }

                    // Add highlighted match
                    const mark = document.createElement('mark')
                    if (occurrenceIndex === currentOccurrence) {
                        mark.className = 'current'
                    }
                    mark.textContent = text.substring(actualStart, actualEnd)
                    fragment.appendChild(mark)

                    occurrenceIndex++
                    lastIndex = actualEnd
                    searchIndex = matchIndex + searchStripped.length
                }

                // Add remaining text
                if (lastIndex < text.length) {
                    fragment.appendChild(document.createTextNode(text.substring(lastIndex)))
                }

                textNode.parentNode?.replaceChild(fragment, textNode)
            }
        })

        return tempDiv.innerHTML
    }

    return {
        searchQuery,
        matches,
        currentMatchIndex,
        totalMatches,
        currentMatch,
        searchInItems,
        navigateToMatch,
        highlightMatches
    }
}
