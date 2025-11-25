# Product Overview

Zayit is a Hebrew text library viewer for Jewish religious texts (Seforim). The project consists of:

- **Vue.js Frontend**: Modern web interface for browsing and reading Hebrew texts with RTL support
- **C# Desktop Application**: Windows desktop shell using WebView2 to host the Vue frontend
- **Word Add-in Integration**: Designed to be embedded in Microsoft Word as part of "כלי קודש לוורד" (Holy Tools for Word)

## Key Features

- Multi-tab interface for browsing multiple books simultaneously
- Hierarchical category tree for book navigation
- Table of contents with search functionality
- Text display controls (diacritics, divine name censoring, line modes)
- Commentary and cross-reference links between texts
- Dark/light themes with VS Code-inspired design
- State persistence across sessions
- Performance optimized for large books (5000+ lines)

## Project Variants

- **vue-tabs**: Primary Vue 3 frontend (most actively developed)
- **zayit-vue**: Alternative Vue implementation
- **Zayit-cs**: C# desktop application with WebView2 integration

## License

AGPL-3.0 (based on kdroidFilter/SeforimApp)
