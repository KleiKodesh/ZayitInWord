# Technology Stack

## Frontend (Vue.js)

### Core Technologies
- **Vue 3** with Composition API and `<script setup>` syntax
- **TypeScript** for type safety
- **Pinia** for state management
- **Vite** as build tool and dev server

### Key Libraries
- `vite-plugin-singlefile` - Bundles entire app into single HTML file for C# integration
- `@vitejs/plugin-vue` and `@vitejs/plugin-vue-jsx` - Vue support
- `vite-plugin-vue-devtools` - Development tools

### Build Configuration
- Single-file output with all assets inlined (base64 images, inline CSS/JS)
- Path alias: `@` maps to `src/`
- Target: `esnext` with no code splitting

### Design System
- **Windows 11 Fluent Design** - Base design language and interaction patterns
- **VS Code Style** - Actual visual design, colors, and component styling
- Clean, minimal interface with subtle shadows and borders
- Consistent spacing and typography based on VS Code's design

### CSS Conventions
- Use `px` for all sizing (padding, margin, font-size, width, height, border-radius)
- Keep values simple and readable
- Example: `padding: 8px` not `padding: 0.5rem`

### Button Styling
- **Use default button styles** from `src/assets/button.css` - do not override with custom styles
- Default buttons are 2rem × 2rem with 1.25rem icons
- Only add minimal overrides when absolutely necessary (e.g., transforms for rotation)
- Avoid overriding: padding, width, height, display, align-items, justify-content, transitions
- The global button styles provide consistent hover/active states and sizing across the app

## Backend (C#)

### Core Technologies
- **.NET Framework 4.7.2**
- **Windows Forms** for desktop UI
- **WebView2** (Microsoft Edge Chromium) for hosting Vue frontend
- **SQLite** for database access

### Key Libraries
- `Microsoft.Web.WebView2` - Chromium-based web control
- `Dapper` - Lightweight ORM for database queries
- `System.Data.SQLite` - SQLite database provider
- `System.Text.Json` - JSON serialization
- `DarkNet` - Dark mode support

### Build System
- **MSBuild** via Visual Studio 2022
- NuGet for package management
- Pre-build event: Automatically builds Vue app before C# compilation

## Common Commands

### Vue Frontend (vue-tabs/)

```bash
# Install dependencies
npm install

# Development server (http://localhost:5173)
npm run dev

# Build for production (outputs to dist/index.html)
npm run build

# Type checking
npm run type-check

# Lint and fix
npm run lint

# Run tests
npm run test:unit

# Deploy to C# project (Windows)
build-and-deploy.bat
```

### C# Backend (Zayit-cs/)

```bash
# Build Debug configuration
build.bat
# or
build.bat build

# Build Release configuration
build.bat release

# Clean build artifacts
build.bat clean

# Rebuild from scratch
build.bat rebuild

# Restore NuGet packages
build.bat restore

# Build and run
build.bat run
```

## Communication Protocol

### JavaScript → C# (via WebView2)
```javascript
window.chrome.webview.postMessage({
  command: 'CommandName',
  args: [arg1, arg2]
})
```

### C# → JavaScript (via ExecuteScriptAsync)
```csharp
await ExecuteScriptAsync($"window.functionName({json});");
```

### Available Commands
- `GetTree` - Fetch category tree and all books
- `OpenBook(bookId, tabId)` - Load book content
- `GetToc(bookId)` - Get table of contents
- `GetLinks(bookId, lineId, tabId)` - Get commentary links
- `CheckHostingMode` - Check if in UserControl or standalone
- `TogglePopOut` - Toggle between embedded and standalone window

## Node.js Version

Requires Node.js `^20.19.0 || >=22.12.0`
