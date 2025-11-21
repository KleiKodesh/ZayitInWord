# Zayit Vue.js Frontend - Project Documentation

## Project Overview

Modern Vue 3 + TypeScript frontend for the Zayit Hebrew text viewer application. Features a tree-based book browser, multi-tab interface, real-time search, and split-pane commentary system.

**Tech Stack:** Vue 3, TypeScript, Pinia, Vite, WebView2 integration

---

## Quick Start

### Build & Deploy
```bash
cd vue-tabs
npm install
npm run build
# Automated deploy
build-and-deploy.bat
```

**Output:** Single `dist/index.html` file (all assets inlined, works offline)

### Development
```bash
npm run dev          # Dev server at localhost:5173
npm run type-check   # TypeScript validation
npm run lint         # Code linting
```

---

## Architecture

### Component Structure
```
App.vue (root)
├── TabHeader - Tab controls & settings
├── TabDropdown - Tab switcher
├── TocSidebar - Table of contents
├── SettingsPane - Theme & preferences
└── KeepAlive (max 15 tabs)
    ├── LandingPage - Search & tree browser
    │   └── TreeView - Hierarchical book navigation
    └── BookViewer - Book content display
        ├── SplitPane (optional)
        │   ├── Top: Book content
        │   └── Bottom: CommentaryView
        └── BookContentView (direct DOM manipulation)
```

### State Management (Pinia)
- **tabsStore** - Tabs, active tab, tree data (persisted to localStorage)
- **tocStore** - Table of contents visibility & data
- **themeStore** - Light/dark theme (persisted)

---

## Core Features

### 1. Tree Browser & Search
- Hierarchical category navigation with expand/collapse
- Real-time client-side search (no C# calls)
- Keyboard navigation (arrow keys + Enter)
- Auto-scroll to selected items
- Tree data loaded once and shared globally

### 2. Multi-Tab System
- Multiple books open simultaneously
- Tab switching with state preservation (KeepAlive)
- Auto-create tab when all closed
- Per-tab independent state

### 3. Split-Pane Commentary
- Toggle button in title bar
- Resizable divider (20%-80% constraints, 40/60 default)
- Click line to load commentary
- Group navigation (dropdown + prev/next buttons)
- Per-tab commentary state
- HTML rendering for rich text

### 4. Theming
- VS Code light/dark themes
- Themed scrollbars
- CSS custom properties for all colors
- Theme persistence

---

## C# Integration

### Commands: Vue → C#
```javascript
// Get tree data (once on init)
window.chrome.webview.postMessage({
  command: 'GetTree',
  args: []
})

// Open book in tab
window.chrome.webview.postMessage({
  command: 'OpenBook',
  args: [bookId, tabId]
})

// Get commentary links
window.chrome.webview.postMessage({
  command: 'GetLinks',
  args: [bookId, lineId, tabId]
})

// Get table of contents
window.chrome.webview.postMessage({
  command: 'GetToc',
  args: [bookId]
})
```

### Callbacks: C# → Vue
```javascript
// Tree data
window.receiveTreeData(treeData)

// Book content (streamed)
window.addLine(tabId, html)
window.addLines(tabId, linesArray)
window.setInitLineIndex(tabId, index)
window.clearBookContent(tabId)
window.bookLoadComplete(tabId)

// Commentary links
window.setLinks(tabId, linkGroups)

// Table of contents
window.receiveTocData(bookId, tocData)
```

### C# Implementation Required

**GetTree Method:**
```csharp
private async void GetTree()
{
    var (tree, allBooks) = SeforimDb.DbQueries.BuildTree();
    var treeData = new { tree, allBooks };
    string json = JsonSerializer.Serialize(treeData, new JsonSerializerOptions
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });
    await ExecuteScriptAsync($"window.receiveTreeData({json});");
}
```

**OpenBook Method:**
```csharp
private async void OpenBook(int bookId, string tabId)
{
    var lines = SeforimDb.DbQueries.GetBookContent(bookId);
    // Send in batches of 1500
    foreach (var batch in lines.Chunk(1500))
    {
        string json = JsonSerializer.Serialize(batch);
        await ExecuteScriptAsync($"window.addLines('{tabId}', {json});");
    }
}
```

**GetLinks Method:**
```csharp
private async void GetLinks(string bookId, int lineId, string tabId)
{
    var linksData = YourDataLayer.GetLinks(bookId, lineId);
    var linkGroups = TransformLinksToGroups(linksData);
    string json = JsonSerializer.Serialize(linkGroups, new JsonSerializerOptions
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });
    await ExecuteScriptAsync($"window.setLinks('{tabId}', {json});");
}
```

**Expected Link Format:**
```json
[
  {
    "groupName": "רש\"י",
    "links": [
      {
        "text": "רש\"י על בראשית א:א",
        "html": "<div>בראשית - לא הוצרך המקרא...</div>"
      }
    ]
  }
]
```

---

## Data Models

### TreeData
```typescript
{
  tree: Category[],      // Hierarchical structure
  allBooks: Book[]       // Flat array for search
}
```

### Category
```typescript
{
  id: number
  parentId: number
  title: string
  level: number
  books: Book[]
  children: Category[]
}
```

### Book
```typescript
{
  id: number
  categoryId: number
  title: string
  heShortDesc: string
  orderIndex: number
  totalLines: number
  hasTargumConnection: number
  hasReferenceConnection: number
  hasCommentaryConnection: number
  hasOtherConnection: number
}
```

---

## User Flows

### Opening a Book
1. User searches or browses tree
2. Clicks book → `selectBook(book)`
3. Converts search tab to book tab
4. Sends `OpenBook` command to C#
5. C# streams lines via `addLines()`
6. Lines display progressively

### Using Commentary
1. User clicks split pane button
2. Bottom pane appears
3. User clicks line in book content
4. Sends `GetLinks` command to C#
5. C# returns grouped commentary
6. User navigates between groups

### Managing Tabs
1. Click "+ חדש" to create tab
2. Click dropdown to switch tabs
3. Click X to close tab
4. Last tab closes → auto-creates new tab

---

## Design System

### Colors (CSS Variables)
**Light Theme:**
- `--bg-primary: #ffffff`
- `--text-primary: #3b3b3b`
- `--accent-color: #007acc`

**Dark Theme:**
- `--bg-primary: #1e1e1e`
- `--text-primary: #cccccc`
- `--accent-color: #0e639c`

### Typography
- Font: `'Segoe UI Variable', 'Segoe UI', system-ui`
- Sizes: 11px-20px
- Headers: h1 (2em, bold) → h6 (0.9em, uppercase)

### Interactive States
- Hover: `background: var(--hover-bg)`
- Active: `background: var(--active-bg)`
- Focus: `outline: 2px solid var(--accent-color)`
- Transitions: 0.1s-0.2s ease

---

## Troubleshooting

### Tree Not Loading
1. Open DevTools: `webView.CoreWebView2.OpenDevToolsWindow()`
2. Check console for "Sending GetTree command"
3. Verify `WebMessageReceived` handler registered
4. Ensure `BuildTree()` returns valid data
5. Check JSON serialization uses camelCase

### Book Content Not Appearing
1. Verify `OpenBook` command received in C#
2. Check `window.addLines` is defined
3. Ensure tabId matches active tab
4. Look for errors in DevTools console

### Commentary Not Loading
1. Verify split pane is enabled
2. Check line has `id="line-{number}"` format
3. Ensure `GetLinks` command sent
4. Verify `window.setLinks` receives data

### Debug Output
```csharp
// C# side
Debug.WriteLine("WebMessageReceived handler registered");
Debug.WriteLine($"Sending tree data: {json.Length} characters");

// JS side (already included)
console.log('Attempting to load tree data...')
console.log('WebView available:', !!window.chrome?.webview)
```

---

## Build Configuration

### Vite Config (`vite.config.ts`)
- Single file output via `vite-plugin-singlefile`
- Base path: `./` (relative, works offline)
- All assets inlined (CSS, JS)
- Output: ~500KB minified + gzipped

### File Structure
```
vue-tabs/
├── src/
│   ├── components/     # Vue components
│   ├── stores/         # Pinia stores
│   ├── types/          # TypeScript types
│   └── App.vue         # Root component
├── dist/
│   └── index.html      # Single file output
└── build-and-deploy.bat
```

---

## Testing Checklist

### Manual Testing
- [ ] App loads with search tab
- [ ] Tree data loads automatically
- [ ] Search filters in real-time
- [ ] Can expand/collapse categories
- [ ] Can select book from tree/search
- [ ] Book content streams and displays
- [ ] Can create/switch/close tabs
- [ ] Last tab closes → new tab auto-creates
- [ ] Keyboard navigation works
- [ ] Theme toggle works
- [ ] Split pane toggles
- [ ] Line click loads commentary
- [ ] Commentary navigation works
- [ ] RTL layout correct

### Performance
- [ ] Tree loads < 1s
- [ ] Search instant (< 100ms)
- [ ] Book content streams smoothly
- [ ] No memory leaks with multiple tabs
- [ ] Smooth animations (60fps)

---

## Known Limitations

1. **Line ID Format** - Lines must have `id="line-{number}"`
2. **KeepAlive Limit** - Max 15 cached tabs (oldest destroyed)
3. **HTML Content** - Commentary HTML rendered directly (ensure sanitized)
4. **Split Pane Only** - Links only load when split pane enabled

---

## Future Enhancements

- [ ] Book search within content
- [ ] Bookmarks/favorites
- [ ] Reading history
- [ ] Font size adjustment per tab
- [ ] Print functionality
- [ ] Export to PDF
- [ ] Cross-references navigation
- [ ] Notes/annotations
- [ ] Link click navigation (jump to target)
- [ ] Commentary search/filter
- [ ] Keyboard shortcuts for commentary

---

## File Locations

**Vue Build Output:**
`vue-tabs/dist/index.html`

**C# Deployment Target:**
`ZayitLib/Zayit/Html/index.html`

**C# Integration Code:**
`ZayitLib/Zayit/Viewer/ZayitViewer.cs`

**Database Queries:**
`ZayitLib/Zayit/SeforimDb/DbQueries.cs`

---

## Status

✅ **Phase 1 Complete** - Tree browser, search, multi-tab system
✅ **Phase 2 Complete** - Split pane commentary with C# integration
✅ **Build System** - Single file output, offline support
✅ **Theming** - VS Code light/dark themes
✅ **Ready for Production**

---

*Last Updated: November 2025*
