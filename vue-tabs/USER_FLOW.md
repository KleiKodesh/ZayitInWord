# User Flow Documentation

## Complete Application Flow

### 1. Application Initialization

**On App Start:**
1. C# creates `ZayitViewer` instance
2. Loads `Html/index.html` (Vue app)
3. Vue app mounts and creates first search tab
4. LandingPage component calls `GetTree` command via `postMessage`
5. C# `GetTree()` method executes `BuildTree()` from database
6. C# sends tree data back via `window.receiveTreeData(json)`
7. Vue stores tree data in Pinia store (shared globally)

**Code Flow:**
```
C# ZayitViewer Constructor
  → Loads index.html
    → Vue App.vue mounts
      → Creates first tab (search)
        → LandingPage.vue mounts
          → Calls GetTree if not loaded
            → C# GetTree() executes
              → Returns tree + allBooks
                → Vue stores in tabsStore.treeData
```

### 2. User Searches/Browses for Book

**Option A: Search**
1. User types in search box
2. Search filters `treeData.allBooks` locally (real-time)
3. Filtered results display instantly
4. User clicks a book

**Option B: Tree Browse**
1. User sees full category tree
2. User expands categories (arrow keys or click)
3. User navigates with keyboard (up/down arrows)
4. User clicks or presses Enter on a book

**Code Flow:**
```
User Input
  → Search: Filters allBooks array locally
  → Tree: Expands/collapses categories
    → User selects book
      → Calls selectBook(book)
```

### 3. Opening a Book

**When User Selects Book:**
1. Vue calls `selectBook(book)` in LandingPage
2. Converts current search tab to book tab
3. Updates tab title and type in Pinia store
4. Sends `OpenBook` command to C# via `postMessage`
5. C# `OpenBook()` method streams book lines
6. Each line sent via `window.addLine(tabId, lineHtml)`
7. BookViewer receives lines and appends to DOM
8. Lines display in real-time as they stream

**Code Flow:**
```
User Clicks Book
  → selectBook(book) in LandingPage
    → tabsStore.convertTabToBook(tabId, bookId, title)
      → Tab switches from search to book view
    → postMessage({ command: 'OpenBook', args: [bookId, tabId] })
      → C# OpenBook(bookId, tabId)
        → Loops through GetBookContent(bookId)
          → For each line:
            → window.addLine(tabId, lineHtml)
              → BookViewer appends line to DOM
```

### 4. Multiple Tabs

**Creating New Tab:**
1. User clicks "+ חדש" button in header
2. New search tab created
3. Tab becomes active
4. Tree data already loaded (shared from store)

**Switching Tabs:**
1. User clicks tab dropdown
2. Selects different tab
3. Vue switches active tab
4. Shows corresponding content (search or book)

**Closing Tabs:**
1. User clicks X on tab
2. Tab closes
3. If last tab → Auto-creates new search tab
4. Next tab becomes active

## C# Methods Required

### GetTree()
```csharp
private async void GetTree()
{
    var (tree, allBooks) = SeforimDb.DbQueries.BuildTree();
    var treeData = new { tree = tree, allBooks = allBooks };
    string json = JsonSerializer.Serialize(treeData, new JsonSerializerOptions
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });
    string js = $"window.receiveTreeData({json});";
    await ExecuteScriptAsync(js);
}
```

### OpenBook(int bookId, string tabId)
```csharp
private async void OpenBook(int bookId, string tabId)
{
    foreach (string lineContent in SeforimDb.DbQueries.GetBookContent(bookId))
    {
        string js = $"window.addLine({JsonSerializer.Serialize(tabId)}, {JsonSerializer.Serialize(lineContent)});";
        await ExecuteScriptAsync(js);
    }
}
```

## JavaScript → C# Communication

**Commands Sent from Vue:**
```javascript
// Get tree data (called once on init)
window.chrome.webview.postMessage({
  command: 'GetTree',
  args: []
})

// Open book in specific tab
window.chrome.webview.postMessage({
  command: 'OpenBook',
  args: [bookId, tabId]
})
```

## C# → JavaScript Communication

**Callbacks from C#:**
```javascript
// Receive tree data
window.receiveTreeData(treeData)

// Receive book lines (streamed)
window.addLine(tabId, lineHtml)
```

## Data Models

### TreeData
```typescript
{
  tree: Category[],      // Hierarchical category tree
  allBooks: Book[]       // Flat array of all books
}
```

### Category
```typescript
{
  id: number,
  parentId: number,
  title: string,
  level: number,
  books: Book[],
  children: Category[]
}
```

### Book
```typescript
{
  id: number,
  categoryId: number,
  title: string,
  heShortDesc: string,
  orderIndex: number,
  totalLines: number,
  hasTargumConnection: number,
  hasReferenceConnection: number,
  hasCommentaryConnection: number,
  hasOtherConnection: number
}
```

## Key Features

✅ **Single Tree Load** - Tree fetched once, shared across all tabs
✅ **Real-Time Search** - Filters locally, no C# calls
✅ **Keyboard Navigation** - Full arrow key support with auto-scroll
✅ **Multiple Tabs** - Each tab independent, can have different books
✅ **Streaming Content** - Book lines stream in real-time
✅ **Auto Tab Creation** - New tab created when last one closes
✅ **VS Code Theme** - Light/dark theme with proper colors
✅ **Offline Ready** - Single HTML file with all assets inlined

## Build & Deploy

See [BUILD.md](BUILD.md) for complete build instructions.

**Quick Deploy:**
```bash
cd vue-tabs
npm run build
copy dist\index.html C:\Users\Admin\source\otzaria\vue-zayit\ZayitLib\Zayit\Html\index.html
```

Or use automated script:
```bash
cd vue-tabs
build-and-deploy.bat
```
