# Hebrew Book Download Architecture

## Overview

Hebrew book downloads use a **browser-initiated, C#-captured** approach where the browser handles the actual download and C# intercepts it only when needed.

## Architecture Principles

### Browser Downloads First

- **Vue triggers browser downloads** using standard `<a>` element with `download` attribute
- **C# captures downloads only when needed** via WebView2 `DownloadStarting` event
- **No direct HTTP requests in C#** - browser handles all network operations

### Two Download Modes

#### View Mode (Hebrew Book List Item Click)

1. Vue calls `PrepareHebrewBookDownload` with action "view"
2. C# stores pending download info and responds ready
3. Vue triggers browser download via `triggerBrowserDownload()`
4. C# cancels browser download and downloads directly to memory using HttpClient
5. C# converts to base64 blob and sends to Vue via `receiveHebrewBookBlob`
6. Vue loads blob into PdfViewerPage

#### Download Mode (Download Button Click)

1. Vue calls `PrepareHebrewBookDownload` with action "download"
2. C# stores pending download info and responds ready
3. Vue triggers browser download via `triggerBrowserDownload()`
4. C# captures download and shows save dialog
5. User chooses location, C# allows download to proceed
6. C# notifies Vue of completion via `receiveHebrewBookDownloadComplete`

## Implementation Flow

### Vue Frontend

```typescript
// View action
const openHebrewBookViewer = async (bookId: string, title: string) => {
  // 1. Prepare C# for capture
  await csharp.send("PrepareHebrewBookDownload", [bookId, title, "view"]);

  // 2. Navigate to PDF page
  tabStore.setPage("pdfview");

  // 3. Trigger browser download (C# will capture)
  triggerBrowserDownload(bookId, title);
};

// Download action
const downloadHebrewBook = async (bookId: string, title: string) => {
  // 1. Prepare C# for capture
  await csharp.send("PrepareHebrewBookDownload", [bookId, title, "download"]);

  // 2. Trigger browser download (C# will capture)
  triggerBrowserDownload(bookId, title);
};

// Standard browser download trigger
const triggerBrowserDownload = (bookId: string, title: string) => {
  const url = `https://download.hebrewbooks.org/downloadhandler.ashx?req=${bookId}`;
  const link = document.createElement("a");
  link.href = url;
  link.download = `${title}.pdf`;
  link.click();
};
```

### C# Backend

```csharp
// Store pending download info (in ZayitViewerCommands)
private async void PrepareHebrewBookDownload(string bookId, string title, string action)
{
    _pendingHebrewBookDownload = new HebrewBookDownloadInfo
    {
        BookId = bookId,
        Title = title,
        Action = action
    };

    // Signal Vue that C# is ready
    await ExecuteScriptAsync($"window.receiveHebrewBookDownloadReady({bookIdJson}, {actionJson});");
}

// Capture browser downloads (in ZayitViewerCommands)
public void HandleDownloadStarting(CoreWebView2DownloadStartingEventArgs e)
{
    if (_pendingHebrewBookDownload != null && e.DownloadOperation.Uri.Contains("hebrewbooks.org"))
    {
        if (_pendingHebrewBookDownload.Action == "view")
            CaptureDownloadAsBlob(e, _pendingHebrewBookDownload);
        else if (_pendingHebrewBookDownload.Action == "download")
            CaptureDownloadWithSaveDialog(e, _pendingHebrewBookDownload);
    }
}

// Viewer delegates to command handler (in ZayitViewer)
private void CoreWebView2_DownloadStarting(object sender, CoreWebView2DownloadStartingEventArgs e)
{
    // NOTE: All download handling logic should be implemented in ZayitViewerCommands
    var commands = _commandHandler as ZayitViewerCommands;
    commands?.HandleDownloadStarting(e);
}
```

## Communication Protocol

### Commands

| Command                     | Args                      | Purpose                         | Response                         |
| --------------------------- | ------------------------- | ------------------------------- | -------------------------------- |
| `PrepareHebrewBookDownload` | `[bookId, title, action]` | Prepare C# for download capture | `receiveHebrewBookDownloadReady` |

### Responses

| Response                            | Args                      | Purpose               |
| ----------------------------------- | ------------------------- | --------------------- |
| `receiveHebrewBookDownloadReady`    | `(bookId, action)`        | C# ready for capture  |
| `receiveHebrewBookBlob`             | `(bookId, title, base64)` | Blob data for viewing |
| `receiveHebrewBookDownloadComplete` | `(bookId, filePath)`      | Download completed    |

## Key Benefits

1. **Browser handles networking** - No HTTP client code in C#
2. **Standard download behavior** - Works with browser security policies
3. **Selective capture** - Only Hebrew books are intercepted
4. **User control** - Save dialog for downloads, automatic blob for viewing
5. **Development fallback** - Direct browser downloads when C# unavailable

## Rules

1. **Always trigger browser download** - Never bypass browser networking
2. **C# captures selectively** - Only when pending Hebrew book download exists
3. **Cancel and re-download for blobs** - View mode cancels browser download and re-downloads to memory
4. **Allow download for files** - Download mode shows save dialog and allows browser download to proceed
5. **Clear pending state** - Always clear pending download after handling
6. **Download logic in command handlers** - All download handling logic should be implemented in ZayitViewerCommands, not ZayitViewer

## Architecture Pattern

**ZayitViewer** (event wiring only):

- Wires WebView2 events
- Delegates all download logic to command handler
- Contains comment: "All download handling logic should be implemented in ZayitViewerCommands"

**ZayitViewerCommands** (business logic):

- Contains all download capture logic
- Handles pending download state
- Implements specific download behaviors (blob vs file)

## File Locations

- **Vue Store**: `zayit-vue/src/stores/hebrewBooksStore.ts`
- **C# Commands**: `Zayit-cs/Zayit/Viewer/ZayitViewerCommands.cs`
- **C# Download Handler**: `Zayit-cs/Zayit/Viewer/ZayitViewer.cs`
- **Bridge**: `zayit-vue/src/data/csharpBridge.ts`
- **PDF Viewer**: `zayit-vue/src/components/pages/PdfViewPage.vue`
