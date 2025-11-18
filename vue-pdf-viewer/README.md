# Vue PDF Viewer

A Vue 3 + TypeScript PDF viewer with tabs, similar to the vue-tabs structure.

## Features

- Tab-based PDF viewing
- File browser integration (folder button)
- Pop-out window support for C# integration
- Keyboard shortcuts (Ctrl+O to open, Ctrl+P to pop out)
- Clean, minimal UI matching vue-tabs design

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The built files will be in the `dist` folder and can be integrated into the C# application.

## C# Integration

Use the `PdfViewerHost.cs` class in ZayitLib to host this viewer in a WinForms application:

```csharp
var pdfViewer = new PdfViewerHost();
Controls.Add(pdfViewer);
```

## Structure

- `src/App.vue` - Main application component
- `src/components/TabHeader.vue` - Header with tabs dropdown and action buttons
- `src/components/TabDropdown.vue` - Dropdown showing all open tabs
- `src/stores/tabs.ts` - Pinia store for tab management
