# Project Structure

## Repository Layout

```
/
├── vue-tabs/          # Primary Vue 3 frontend (actively developed)
├── zayit-vue/         # Alternative Vue implementation
├── Zayit-cs/          # C# desktop application
├── README.md          # Main project documentation
└── LICENSE            # AGPL-3.0 license
```

## Vue Frontend Structure (vue-tabs/)

```
vue-tabs/
├── src/
│   ├── components/           # Vue components
│   │   ├── BookViewer.vue       # Main book reading component with tabs
│   │   ├── BookContentView.vue  # Book content display
│   │   ├── LandingPage.vue      # Search and category tree
│   │   ├── TabHeader.vue        # Tab bar with controls
│   │   ├── TabDropdown.vue      # Tab list dropdown
│   │   ├── TocView.vue          # Table of contents display
│   │   ├── TocSidebar.vue       # Sidebar TOC overlay
│   │   ├── TocNode.vue          # TOC tree node
│   │   ├── TreeView.vue         # Hierarchical book browser
│   │   ├── TreeNode.vue         # Recursive tree node
│   │   ├── CommentaryView.vue   # Commentary/links display
│   │   ├── SettingsPane.vue     # Settings panel
│   │   ├── AboutPane.vue        # About information
│   │   └── SplitPane.vue        # Split view for commentaries
│   ├── stores/               # Pinia state management
│   │   ├── tabs.ts              # Tab management and tree data
│   │   ├── theme.ts             # Theme (dark/light mode)
│   │   └── toc.ts               # Table of contents state
│   ├── types/                # TypeScript type definitions
│   │   ├── Book.ts              # Book and SearchResult types
│   │   ├── Tab.ts               # Tab interface
│   │   ├── Tree.ts              # Category tree types
│   │   └── Toc.ts               # TOC types
│   ├── data/                 # Static data and constants
│   │   ├── hebrewFonts.ts       # Available Hebrew fonts
│   │   └── sampleTreeData.ts    # Sample data for development
│   ├── assets/               # Styles
│   │   └── main.css             # Global styles
│   ├── App.vue               # Root component
│   └── main.ts               # Application entry point
├── public/
│   ├── assets/               # Static assets (icons, images)
│   └── favicon.ico
├── dist/                     # Build output (single index.html)
├── package.json              # Dependencies and scripts
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript configuration
├── eslint.config.ts          # ESLint configuration
└── build-and-deploy.bat      # Deploy script to C# project
```

## C# Backend Structure (Zayit-cs/)

```
Zayit-cs/
├── Zayit/                    # Main application project
│   ├── Viewer/                  # WebView2 integration
│   │   ├── ZayitViewer.cs          # Main viewer with Vue integration
│   │   ├── ZayitViewerBase.cs      # Base WebView2 wrapper
│   │   └── ZayitViewerHost.cs      # UserControl host
│   ├── SeforimDb/               # Database layer
│   │   ├── DbManager.cs            # Database connection management
│   │   ├── DbQueries.cs            # Query methods
│   │   └── SqlQueries.cs           # SQL query strings
│   ├── Models/                  # Data models
│   │   ├── Book.cs                 # Book entity
│   │   ├── Category.cs             # Category entity
│   │   ├── Link.cs                 # Link/commentary entity
│   │   ├── JoinedLink.cs           # Joined link with content
│   │   └── TocEntry.cs             # Table of contents entry
│   ├── Html/                    # Vue frontend files (deployed here)
│   │   ├── index.html              # Built Vue app
│   │   └── assets/                 # Static assets
│   ├── Properties/              # Assembly info and resources
│   ├── Program.cs               # Application entry point
│   ├── Zayit.csproj             # Project file
│   ├── packages.config          # NuGet packages
│   └── app.manifest             # Application manifest
├── packages/                 # NuGet packages (local)
├── ZayitLib.sln              # Visual Studio solution
├── build.bat                 # Build script
└── build.ps1                 # PowerShell build script
```

## Key Conventions

### Vue Components
- Use `<script setup lang="ts">` syntax
- Components are PascalCase (e.g., `BookViewer.vue`)
- Composables and stores use camelCase
- Props and emits are explicitly typed

### C# Code
- Namespace: `Zayit.*` (e.g., `Zayit.Viewer`, `Zayit.Models`)
- Async methods use `async/await` pattern
- WebView2 communication via `ExecuteScriptAsync`
- Database queries use Dapper for mapping

### File Naming
- Vue components: PascalCase (`.vue`)
- TypeScript files: camelCase (`.ts`)
- C# files: PascalCase (`.cs`)
- Batch scripts: lowercase with hyphens (`.bat`)

### State Management
- Pinia stores in `stores/` directory
- Store names match file names (e.g., `useTabsStore` in `tabs.ts`)
- LocalStorage used for persistence (key prefix: `zayit-`)

### Communication Flow
1. Vue calls C# via `window.chrome.webview.postMessage()`
2. C# method invoked via reflection in `ZayitViewerBase`
3. C# queries database and serializes to JSON (camelCase)
4. C# calls JavaScript via `ExecuteScriptAsync()`
5. Vue receives data via global window functions

### Build Process
1. Vue app built to single HTML file (`npm run build`)
2. Output copied to `Zayit-cs/Zayit/Html/index.html`
3. C# project includes HTML as embedded resource
4. Pre-build event automatically rebuilds Vue app
