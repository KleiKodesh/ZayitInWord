# Bridge Layer

This folder contains the data bridge abstraction layer that handles communication between the Vue frontend and data sources.

## Files

### `webview.ts`
Main bridge interface that routes commands to the appropriate data source:
- **Production/C# Available**: Routes commands to C# WebView2 via `window.chrome.webview.postMessage()`
- **Development/C# Unavailable**: Routes commands to SQLite database via `sqliteDb.ts`

**Key Functions:**
- `send(command, args)` - Send command to C# or SQLite based on availability
- `isWebViewAvailable()` - Detect if C# WebView2 is present
- `handleDevMode(command, args)` - Handle commands using SQLite in development

**Supported Commands:**
- `GetTree` - Fetch category tree and all books
- `OpenBook(bookId, initialLineId)` - Load book content
- `GetToc(bookId)` - Get table of contents
- `GetLinks(lineId, bookId, tabId)` - Get commentary links

### `sqliteDb.ts`
SQLite query client for development mode only.

**Features:**
- Sends SQL queries to Vite dev server API endpoint (`/__db/query`)
- Server-side query execution (database stays on server, not loaded into browser)
- Returns flat JSON data matching C# format
- Only available in development mode

**Key Functions:**
- `query(sql, params)` - Execute SQL query via API
- `getTree()` - Get flat category and book data: `{ categoriesFlat, booksFlat }`
- `getBookContent(bookId)` - Get book lines with IDs
- `getToc(bookId)` - Get flat TOC data: `{ tocEntriesFlat }`
- `getLinks(lineId)` - Get commentary links

**Why API approach?**
The database is 5GB, too large to load into browser memory. The Vite plugin acts as a query server using `better-sqlite3` on the Node.js side.

## Architecture

```
┌─────────────────────────────────────────────────┐
│              Vue Components/Stores               │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │  webview.ts    │ (Bridge Interface)
         └────────┬───────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
┌───────────────┐   ┌──────────────┐
│ C# WebView2   │   │ sqliteDb.ts  │
│ (Production)  │   │ (Dev Only)   │
└───────┬───────┘   └──────┬───────┘
        │                   │
        │ Returns           │ Returns
        │ Flat JSON         │ Flat JSON
        │                   │
        ▼                   ▼
┌───────────────────────────────────┐
│   Flat JSON Data                  │
│   { categoriesFlat, booksFlat }   │
│   { tocEntriesFlat }              │
└───────────────┬───────────────────┘
                │
                ▼
        ┌───────────────┐
        │ Tree Builders │
        │ (utils/)      │
        └───────┬───────┘
                │
                ▼
        ┌───────────────┐
        │ Built Trees   │
        │ { tree, ... } │
        └───────────────┘

Database Access:
┌───────────────┐   ┌──────────────────┐
│  C# Queries   │   │ Vite Plugin API  │
│  + Dapper     │   │ /__db/query      │
└───────┬───────┘   └──────┬───────────┘
        │                   │
        ▼                   ▼
┌───────────────┐   ┌──────────────────┐
│  seforim.db   │   │ better-sqlite3   │
│  (C# side)    │   │ (Node.js/Server) │
└───────────────┘   └──────────────────┘
                            │
                            ▼
                    ┌────────────────┐
                    │  seforim.db    │
                    │  (5GB)         │
                    └────────────────┘
```

## Development vs Production

### Development Mode (`npm run dev`)
- Vite plugin provides query API at `/__db/query`
- Database accessed server-side via `better-sqlite3`
- No database loaded into browser (only query results)
- Useful for frontend development without C# host
- Database location: `%APPDATA%\io.github.kdroidfilter.seforimapp\databases\seforim.db`

### Production Mode (`npm run build`)
- No database API available
- Only C# WebView2 bridge works
- Smaller bundle size (no SQLite dependencies)
- Must run inside C# WebView2 host

## Usage Example

```typescript
import { send } from '@/bridge/webview'

// Request category tree
send('GetTree', [])

// Open a book
send('OpenBook', [bookId, initialLineId])

// Get table of contents
send('GetToc', [bookId])

// Get links for a line
send('GetLinks', [lineId, bookId, tabId])
```

## Unified JSON Approach

Both C# and TypeScript return **flat JSON data** from database queries. Tree building happens in JavaScript using shared utilities.

### Category Tree Flow

1. **Database Query** (C# or SQLite):
   - Returns flat data: `{ categoriesFlat: [...], booksFlat: [...] }`
   - Categories include pre-computed `path` from recursive CTE
   - Uses `>` as separator (e.g., `תנ"ך > תורה > בראשית`)

2. **Bridge** (`webview.ts`):
   - Receives flat JSON from C# or SQLite
   - Passes to `window.receiveTreeData()`

3. **Store** (`categoryTreeStore.ts`):
   - Detects flat data format
   - Calls `buildTreeFromFlat()` utility

4. **Tree Builder** (`utils/treeBuilder.ts`):
   - Links children to parents
   - Assigns books to leaf categories
   - Returns: `{ tree: Category[], allBooks: Book[] }`

### TOC Flow

1. **Database Query** (C# or SQLite):
   - Returns flat data: `{ tocEntriesFlat: [...] }`

2. **Bridge** (`webview.ts`):
   - Receives flat JSON
   - Passes to `window.receiveTocData(bookId, data)`

3. **Component** (`TocTree.vue`):
   - Detects flat data format
   - Calls `buildTocFromFlat()` utility

4. **TOC Builder** (`utils/tocBuilder.ts`):
   - Builds hierarchical path for each entry
   - Links children to parents recursively
   - Returns: `{ tree: TocEntry[], allTocs: TocEntry[] }`

### Benefits

- ✅ Single source of truth for tree building logic
- ✅ C# and TypeScript produce identical structures
- ✅ Easier to maintain and debug
- ✅ Consistent data format across platforms

## Global Callbacks

The bridge expects these global functions to be defined for receiving data:

```typescript
window.receiveTreeData(data: any) // Flat: { categoriesFlat, booksFlat }
window.receiveTocData(bookId: number, data: any) // Flat: { tocEntriesFlat }
window.addLines(bookId: number, lines: Array<{id: number, html: string}>)
window.bookLoadComplete(bookId: number)
window.setInitLineIndex(bookId: number, lineIndex: number)
window.receiveLinks(bookId: number, tabId: number, links: Array<Link>)
```

These are typically set up in Pinia stores and Vue components.

## Configuration

### Custom Database Path
The Vite plugin looks for the database at:
```
%APPDATA%\io.github.kdroidfilter.seforimapp\databases\seforim.db
```

To use a different location, set the `APPDATA` environment variable before starting dev server:
```bash
# Windows CMD
set APPDATA=C:\custom\path
npm run dev

# Windows PowerShell
$env:APPDATA = "C:\custom\path"
npm run dev
```

## Troubleshooting

**Database not loading in dev mode:**
1. Check database exists at `%APPDATA%\io.github.kdroidfilter.seforimapp\databases\seforim.db`
2. Check Vite dev server console for "Database plugin initialized" message
3. Check browser console for query errors
4. Try accessing `http://localhost:5173/__db/query` to verify API is running

**"Database file not found" error:**
- Ensure Zayit is installed and database exists
- Check the path shown in Vite console output
- Verify `APPDATA` environment variable is set correctly

**Production build not working:**
- Ensure app is running inside C# WebView2 host
- Check `window.chrome.webview` is available
- Verify C# message handlers are registered

**Query errors:**
- Check Vite dev server console for SQL errors
- Verify database schema matches queries
- Ensure database file is not corrupted
