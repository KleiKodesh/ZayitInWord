# Book Loading Guidelines

## Line Index Concept

**Line index** = the index of a specific line in the book (0, 1, 2, 3... up to totalLines-1)

Each book is composed of lines, and each line has an index. When you save the scroll position, you're saving which line is at the top of the viewport. When you restore, you scroll that specific line back to the top.

This works perfectly with varying line heights because:
- You're not calculating positions based on a fixed height
- You're finding the actual line element at the top of the viewport using `getBoundingClientRect()`
- You're scrolling that specific line element back into view using `scrollIntoView()`

**initialLineIndex** is used ONLY for persistence (restoring scroll position):
- When loading from saved session (localStorage)
- When switching back to a tab
- NOT used when opening a book fresh from the tree
- NOT used by TOC - TOC emits line selection directly to BookViewPage

**Saving scroll position:**
- `getTopVisibleLine()` finds which line element is at the top of the viewport
- Saves that line's index to `bookState.initialLineIndex`
- Happens on:
  - Scroll (debounced 300ms)
  - Tab becomes inactive (immediate save)
  - Component unmount

**Restoring scroll position:**
- Only happens in 2 cases:
  1. **Session restore**: Component mounts with existing `initialLineIndex` from localStorage (oldBookId is undefined AND initialLineIndex exists)
  2. **Tab switch**: Tab becomes active after being inactive (separate watch)
- Fresh book open from tree: Starts at line 0 (top), ignores any existing `initialLineIndex`
- Scroll happens BEFORE loading any content:
  1. Render placeholder DOM
  2. Scroll to target line
  3. Load visible lines around target
  4. Load remaining lines in background

**TOC navigation (separate from initialLineIndex):**
- TOC emits `selectLine` event with line index
- BookViewPage handles event by scrolling to line and loading content around it
- Does NOT update initialLineIndex (that happens naturally as user scrolls)

## Tab Management

### Tab State

Each tab stores:
- `id`: Unique identifier (reuses lowest available number when tabs are closed)
- `title`: Display title
- `isActive`: Whether this tab is currently active
- `currentPage`: Current page type (landing, bookview, pdfview, search)
- `bookState`: Optional BookState object containing:
  - `bookId`: The book's database ID
  - `bookTitle`: The book's title
  - `initialLineIndex`: Saved scroll position (line index)
  - `isTocOpen`: Whether the TOC overlay is currently visible

### Tab Lifecycle

**Creating tabs:**
- New tabs get the lowest available ID number
- If tabs 1, 2, 4, 5 exist (3 was closed), next tab gets ID 3
- Keeps tab IDs compact and reuses numbers

**Closing tabs:**
- Clears the global cache
- Removes tab from array
- Switches to adjacent tab or creates new one if last tab closed
- Vue automatically destroys the component and cleans up local state

**Resetting to homepage:**
- Clears the global cache
- Sets currentPage to 'landing'
- Deletes the bookState object
- Component is recreated with clean state

### Component Lifecycle

**BookViewPage component:**
- Each tab's BookViewPage has its own component instance (keyed by tab ID and page type)
- Component is reused when switching back to the same tab
- Captures `myTabId` on mount to track which tab it belongs to
- Only updates its own tab's state (never touches other tabs)
- Local state (`lines`, `totalLines`, etc.) persists while component is mounted
- `onUnmounted` saves scroll position before destruction

**Component key:** `tab-${tabId}-${currentPage}`
- Ensures each tab gets its own component instance
- Component is destroyed when tab is closed
- Component is reused when switching back to same tab

## Large Document Loading Flow

### Complete Book Loading Flow

**1. User selects book from tree**
- BookViewPage loads, shows BookTocTreeView overlay with loading animation
- BookLineViewer gets totalLines count from DB
- Renders all placeholder DOM elements with "בטעינה..." text
- All lines exist in DOM immediately (enables instant scrolling)

**2. Placeholders ready**
- After nextTick, emits `placeholdersReady` event
- BookTocTreeView loading animation stops → TOC becomes interactive
- Background buffer loading starts immediately
- Lines load into `pendingLineUpdates` buffer (NOT into UI)
- Buffer purpose: Save DB read time, not update UI

**3. User clicks TOC entry**
- Stops background buffer loading immediately
- Closes BookTocTreeView overlay
- Scrolls to selected line instantly (even if still showing "בטעינה...")
- Loads selected ± 50 lines (PADDING_LINES constant):
  - First checks `pendingLineUpdates` buffer for already-loaded lines
  - Then loads any missing lines from DB
  - Updates UI with these ~101 lines only
- Applies remaining buffer to UI (non-blocking setTimeout)
- All other lines now have real content (skips already loaded)

**4. Scroll position tracking**
- Intersection observer tracks top visible line
- Saves to `bookState.initialLineIndex` on scroll (debounced 300ms)
- Used for restoring position on tab switch/reload

### Key Principles

- **No complex viewport calculations** - Just target ± padding (50 lines each side)
- **BookTocTreeView always responsive** - Placeholders exist for all lines, scroll works immediately
- **Buffer optimization** - Saves DB read time but doesn't block UI
- **Progressive loading** - Selected area loads first, rest fills in non-blocking
- **Non-blocking** - Use setTimeout for applying remaining buffer
- **Abort on navigation** - Cancel background loading if user navigates away

### Loading States

**Fresh book open (not restore):**
- Render all placeholders
- Start background buffer loading
- Wait for BookTocTreeView interaction (no initial content load)

**Restore from saved position:**
- Render all placeholders
- Start background buffer loading
- Scroll to saved line and load ± 50 around it

**BookTocTreeView selection:**
- Stop buffer loading
- Close BookTocTreeView overlay
- Scroll immediately
- Load selected ± 50 (buffer first, then DB)
- Apply remaining buffer non-blocking

### Performance Targets

- Initial render: < 100ms (just placeholders)
- BookTocTreeView interactive: < 200ms (after placeholders ready)
- Scroll to line: Instant (placeholders already in DOM)
- Selected content loaded: < 500ms (± 50 lines)
- Full document: Background, non-blocking
