# Troubleshooting Guide

## Tree Not Loading

### Symptoms
- App loads but tree is empty
- No items show in the tree view
- Console shows "Failed to load tree data - timeout after 5 seconds"

### Diagnosis Steps

1. **Open Browser DevTools in WebView2**
   - Add this to your C# code after WebView2 initialization:
   ```csharp
   await webView.EnsureCoreWebView2Async();
   webView.CoreWebView2.OpenDevToolsWindow();
   ```
   
2. **Check Console Logs**
   - Look for: "Attempting to load tree data..."
   - Look for: "WebView available: true/false"
   - Look for: "Sending GetTree command to C#"

3. **Check if WebView2 is Available**
   - If console shows "WebView available: false" → Sample data should load
   - If console shows "WebView available: true" → C# should receive command

### Common Issues

#### Issue 1: Command Handler Not Registered

**Problem:** C# methods are private but not registered with command handler.

**Solution:** Ensure `ZayitViewerBase` registers the methods. Add this to your C# constructor:

```csharp
public ZayitViewer(object commandHandler = null) : base(commandHandler)
{
    // Register message handler
    CoreWebView2.WebMessageReceived += OnWebMessageReceived;
    
    NavigationCompleted += ZayitViewer_NavigationCompleted;
    Source = new Uri(GetHtmlPath());
}

private void OnWebMessageReceived(object sender, CoreWebView2WebMessageReceivedEventArgs e)
{
    try
    {
        var json = e.WebMessageAsJson;
        var message = JsonSerializer.Deserialize<WebMessage>(json);
        
        switch (message.command)
        {
            case "GetTree":
                GetTree();
                break;
            case "OpenBook":
                if (message.args?.Length >= 2)
                {
                    int bookId = Convert.ToInt32(message.args[0]);
                    string tabId = message.args[1].ToString();
                    OpenBook(bookId, tabId);
                }
                break;
        }
    }
    catch (Exception ex)
    {
        Debug.WriteLine($"WebMessage error: {ex}");
    }
}

// Helper class for deserializing messages
private class WebMessage
{
    public string command { get; set; }
    public object[] args { get; set; }
}
```

#### Issue 2: BuildTree() Not Implemented

**Problem:** `SeforimDb.DbQueries.BuildTree()` doesn't exist or returns null.

**Solution:** Verify the method exists and returns data:

```csharp
// In SeforimDb.DbQueries.cs
public static (Category[] Tree, Book[] AllBooks) BuildTree()
{
    // Your implementation here
    // Must return both tree structure and flat book list
}
```

#### Issue 3: JSON Serialization Issues

**Problem:** Tree data doesn't serialize properly.

**Solution:** Ensure your models are serializable:

```csharp
public class Category
{
    public int Id { get; set; }
    public int ParentId { get; set; }
    public string Title { get; set; }
    public int Level { get; set; }
    public Book[] Books { get; set; }
    public List<Category> Children { get; set; } = new List<Category>();
}

public class Book
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public string Title { get; set; }
    public string HeShortDesc { get; set; }
    public int OrderIndex { get; set; }
    public int TotalLines { get; set; }
    public int HasTargumConnection { get; set; }
    public int HasReferenceConnection { get; set; }
    public int HasCommentaryConnection { get; set; }
    public int HasOtherConnection { get; set; }
}
```

#### Issue 4: ExecuteScriptAsync Fails Silently

**Problem:** Script execution fails but no error shown.

**Solution:** Add error handling:

```csharp
private async void GetTree()
{
    try
    {
        var (tree, allBooks) = SeforimDb.DbQueries.BuildTree();
        
        if (tree == null || allBooks == null)
        {
            Debug.WriteLine("BuildTree returned null data");
            return;
        }
        
        var treeData = new { tree = tree, allBooks = allBooks };
        
        string json = JsonSerializer.Serialize(treeData, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        
        Debug.WriteLine($"Sending tree data: {json.Length} characters");
        
        string js = $"window.receiveTreeData({json});";
        await ExecuteScriptAsync(js);
        
        Debug.WriteLine("Tree data sent successfully");
    }
    catch (Exception ex)
    {
        Debug.WriteLine($"GetTree error: {ex}");
        Debug.Assert(false, $"GetTree error: {ex}");
    }
}
```

### Testing in Development Mode

If you want to test without C#, the app will automatically load sample data. Just open `index.html` in a browser:

```bash
cd vue-tabs/dist
# Open index.html in browser
```

You should see sample Hebrew books load automatically.

### Verification Checklist

- [ ] WebView2 is initialized before loading HTML
- [ ] `CoreWebView2.WebMessageReceived` event is registered
- [ ] `GetTree()` method is called when "GetTree" command received
- [ ] `BuildTree()` returns valid data (not null)
- [ ] JSON serialization uses camelCase
- [ ] `ExecuteScriptAsync` is awaited
- [ ] `window.receiveTreeData` is defined in JavaScript
- [ ] Console shows no errors
- [ ] DevTools shows tree data received

### Debug Output

Add these debug lines to see what's happening:

**In C#:**
```csharp
Debug.WriteLine("ZayitViewer constructor called");
Debug.WriteLine($"HTML path: {GetHtmlPath()}");
Debug.WriteLine("WebMessageReceived handler registered");
```

**In JavaScript (already added):**
```javascript
console.log('Attempting to load tree data...')
console.log('WebView available:', !!window.chrome?.webview)
console.log('Sending GetTree command to C#')
```

### Still Not Working?

1. Check Visual Studio Output window for Debug messages
2. Check browser DevTools Console for JavaScript errors
3. Verify the HTML file is being loaded (check Source tab in DevTools)
4. Try loading sample data by opening `dist/index.html` directly in browser
5. Verify database connection and BuildTree query works

### Quick Test

Add this temporary code to verify C# → JS communication works:

```csharp
// In NavigationCompleted
private async void ZayitViewer_NavigationCompleted(object sender, CoreWebView2NavigationCompletedEventArgs e)
{
    Debug.WriteLine("Vue application loaded successfully");
    
    // Test communication
    await ExecuteScriptAsync("console.log('C# can execute JavaScript!')");
    
    // Test if window.receiveTreeData exists
    string result = await ExecuteScriptAsync("typeof window.receiveTreeData");
    Debug.WriteLine($"window.receiveTreeData type: {result}");
}
```

If this shows "function", then communication works and the issue is with the command handler or BuildTree.
