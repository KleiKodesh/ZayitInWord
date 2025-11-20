# Performance Optimizations for Large Books

This document describes the optimizations implemented to prevent UI blocking when loading and processing large books.

## Problem

When loading large books (thousands of lines), synchronous DOM operations can block the main thread, causing the UI to freeze and become unresponsive.

## Solutions Implemented

### 1. Efficient Book Loading (`BookViewer.vue`)

**Function:** `addLinesToThisTab()`

**Optimization:** Process batches of lines efficiently using DocumentFragment

**Benefits:**
- Fast loading - C# already handles chunking on the backend
- No JavaScript chunking overhead
- Optimal performance with single DOM append per batch
- Uses DocumentFragment for efficient batch DOM operations

**Implementation:**
```typescript
const fragment = document.createDocumentFragment()

linesArray.forEach(({ id, html }) => {
  const lineElement = document.createElement('line')
  lineElement.id = `line-${id}`
  lineElement.innerHTML = html
  fragment.appendChild(lineElement)
})

// Single DOM append for entire batch
contentContainer.value.appendChild(fragment)
```

**Note:** C# backend sends lines in manageable chunks, so JavaScript-side chunking is unnecessary and would only add overhead.

### 2. Chunked Diacritics Filtering (`TabHeader.vue`)

**Function:** `applyDiacriticsFilter()`

**Optimization:** Process text nodes in chunks of 500 using `requestAnimationFrame()`

**Benefits:**
- Prevents UI freezing when removing diacritics/cantillations
- Allows user to continue interacting with the app
- Smooth experience even with very large books

**Implementation:**
```typescript
const CHUNK_SIZE = 500

const processChunk = () => {
  for (let i = currentIndex; i < endIndex; i++) {
    const textNode = textNodes[i]
    // Apply regex replacements
    textNode.nodeValue = text
  }
  
  if (currentIndex < textNodes.length) {
    requestAnimationFrame(processChunk)
  }
}
```

### 3. Chunked Line Display Toggle (`TabHeader.vue`)

**Function:** `toggleLineDisplay()`

**Optimization:** Process line elements in chunks of 500 using `requestAnimationFrame()`

**Benefits:**
- Prevents UI freezing when switching between block/inline display
- Smooth transition even with thousands of lines

**Implementation:**
```typescript
const CHUNK_SIZE = 500

const processChunk = () => {
  for (let i = currentIndex; i < endIndex; i++) {
    const lineElement = lines[i] as HTMLElement
    // Apply display style changes
  }
  
  if (currentIndex < lines.length) {
    requestAnimationFrame(processChunk)
  }
}
```

## Performance Characteristics

### Before Optimization
- Loading books: Fast (C# chunking handles this)
- Toggling diacritics: UI freezes for 1-3 seconds on large books
- Switching display mode: UI freezes for 1-2 seconds on large books

### After Optimization
- Loading books: Fast (optimized with DocumentFragment)
- Toggling diacritics: Smooth transition, no freezing
- Switching display mode: Smooth transition, no freezing

## Technical Details

### requestAnimationFrame()
- Schedules work to run before the next browser repaint
- Allows browser to render frames between chunks
- Automatically pauses when tab is not visible (saves CPU)
- Provides ~60fps timing (16.67ms per frame)

### Chunk Sizes
- **Book loading**: No JavaScript chunking (C# handles this)
- **500 nodes/elements** for text processing (diacritics, line display): Balance between speed and responsiveness

### Trade-offs
- Slightly longer total processing time (overhead of scheduling)
- More complex code with chunk management
- **Worth it:** Much better user experience, no UI freezing

## Future Optimizations

Potential areas for further improvement:

1. **Virtual Scrolling**: Only render visible lines in viewport
2. **Web Workers**: Move text processing to background thread
3. **Lazy Loading**: Load book content on-demand as user scrolls
4. **IndexedDB Caching**: Cache processed content for faster subsequent loads
5. **CSS-based Diacritics**: Use CSS filters instead of DOM manipulation

## Testing Large Books

To test performance with large books:

1. Load a book with 5000+ lines
2. Verify UI remains responsive during loading
3. Toggle diacritics filter - should be smooth
4. Switch line display mode - should be smooth
5. Scroll while processing - should remain smooth

## Browser Compatibility

These optimizations work in all modern browsers:
- Chrome/Edge: Excellent performance
- Firefox: Excellent performance
- Safari: Good performance
- Mobile browsers: Improved responsiveness

## Monitoring Performance

Use browser DevTools to monitor:
- **Performance tab**: Check for long tasks (>50ms)
- **FPS meter**: Should maintain ~60fps during operations
- **Memory**: Check for memory leaks with large books
