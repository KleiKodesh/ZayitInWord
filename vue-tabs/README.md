# Zayit Vue.js Frontend

Modern Vue 3 + TypeScript frontend for the Zayit Hebrew text viewer application.

## Features

- 📚 **Tree View Browser** - Hierarchical category and book navigation
- 🔍 **Real-Time Search** - Instant filtering of books as you type
- 📑 **Tab System** - Multiple books open simultaneously
- 🎨 **Fluent Design** - Modern, smooth animations and transitions
- 🌐 **Offline Support** - Single HTML file with all assets inlined
- 🔄 **RTL Support** - Full right-to-left layout for Hebrew text

## Quick Start

### Build for Production

```bash
npm install
npm run build
```

Output: `dist/index.html` (single file, ready to deploy)

### Deploy to C# Project

```bash
# Windows
build-and-deploy.bat

# Or manually
copy dist\index.html C:\Users\Admin\source\otzaria\vue-zayit\ZayitLib\Zayit\Html\index.html
```

See [BUILD.md](BUILD.md) for detailed instructions.

## Development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Type check
npm run type-check

# Lint
npm run lint
```

## Project Structure

```
vue-tabs/
├── src/
│   ├── components/
│   │   ├── BookViewer.vue      # Book content display with tabs
│   │   ├── LandingPage.vue     # Search and tree view
│   │   ├── TreeView.vue        # Tree browser component
│   │   └── TreeNode.vue        # Recursive tree node
│   ├── stores/
│   │   └── tabs.ts             # Pinia store for tab management
│   ├── types/
│   │   ├── Book.ts             # Book type definitions
│   │   └── Tree.ts             # Tree structure types
│   ├── data/
│   │   └── sampleTreeData.ts   # Sample data for development
│   ├── App.vue                 # Root component
│   └── main.ts                 # Application entry point
├── public/
│   └── assets/                 # Static assets (icons, images)
├── dist/                       # Build output
├── BUILD.md                    # Build instructions
└── package.json                # Dependencies and scripts
```

## C# Integration

The Vue app communicates with C# via WebView2:

### JavaScript → C# (Commands)

```javascript
window.chrome.webview.postMessage({
  command: 'GetTree',
  args: []
})

window.chrome.webview.postMessage({
  command: 'OpenBook',
  args: [bookId, tabId]
})
```

### C# → JavaScript (Callbacks)

```csharp
// Send tree data
await ExecuteScriptAsync($"window.receiveTreeData({json});");

// Stream book lines
await ExecuteScriptAsync($"window.addLine({tabId}, {lineContent});");
```

See `ZayitLib/Zayit/Viewer/ZayitViewer_Integration.cs` for complete implementation.

## Key Technologies

- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type-safe development
- **Pinia** - State management
- **Vite** - Fast build tool
- **vite-plugin-singlefile** - Single HTML output

## Browser Support

- Modern browsers (Chrome, Edge, Firefox, Safari)
- WebView2 (Chromium-based)

## License

[Your License Here]
