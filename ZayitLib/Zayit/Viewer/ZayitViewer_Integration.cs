using Microsoft.Web.WebView2.Core;
using System;
using System.Diagnostics;
using System.IO;
using System.Text.Json;

namespace Zayit
{
    /// <summary>
    /// ZayitViewer with Vue.js UI integration
    /// Handles communication between C# backend and Vue frontend
    /// </summary>
    public class ZayitViewer : ZayitViewerBase
    {
        public ZayitViewer(object commandHandler = null) : base(commandHandler)
        {
            Source = new Uri(GetHtmlPath());
        }

        /// <summary>
        /// Gets the path to the Vue application HTML file
        /// </summary>
        private string GetHtmlPath() =>
            Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Html", "index.html");

        /// <summary>
        /// Called from JavaScript when user opens the tree view
        /// Fetches the category tree and all books from the database
        /// This is called once on page load to populate the tree
        /// </summary>
        private async void GetTree()
        {
            try
            {
                Debug.WriteLine("GetTree called - fetching data from database");

                // Get tree structure and all books from database
                var (tree, allBooks) = SeforimDb.DbQueries.BuildTree();

                Debug.WriteLine($"BuildTree returned: {tree?.Length ?? 0} categories, {allBooks?.Length ?? 0} books");

                if (tree == null || allBooks == null)
                {
                    Debug.WriteLine("ERROR: BuildTree returned null data");
                    return;
                }

                // Create response object
                var treeData = new
                {
                    tree = tree,
                    allBooks = allBooks
                };

                // Serialize with camelCase for JavaScript
                string json = JsonSerializer.Serialize(treeData, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });

                Debug.WriteLine($"Serialized tree data: {json.Length} characters");

                // Send to Vue application
                string js = $"window.receiveTreeData({json});";
                await ExecuteScriptAsync(js);

                Debug.WriteLine("Tree data sent to Vue successfully");
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"GetTree error: {ex}");
                Debug.Assert(false, $"GetTree error: {ex}");
            }
        }

        /// <summary>
        /// Called from JavaScript when user selects a book from the tree
        /// Streams book content in batches to the Vue application for better performance
        /// </summary>
        /// <param name="bookId">The book ID to load</param>
        /// <param name="tabId">The tab ID to load content into (e.g., "tab-1")</param>
        private async void OpenBook(int bookId, string tabId)
        {
            try
            {
                const int BATCH_SIZE = 1000; // Send 1000 lines at a time
                var batch = new System.Collections.Generic.List<string>(BATCH_SIZE);
                
                // Stream book lines in batches to the UI
                foreach (string lineContent in SeforimDb.DbQueries.GetBookContent(bookId))
                {
                    batch.Add(lineContent);
                    
                    // When batch is full, send it
                    if (batch.Count >= BATCH_SIZE)
                    {
                        string batchJson = JsonSerializer.Serialize(batch);
                        string js = $"window.addLines({JsonSerializer.Serialize(tabId)}, {batchJson});";
                        await ExecuteScriptAsync(js);
                        batch.Clear();
                    }
                }
                
                // Send remaining lines if any
                if (batch.Count > 0)
                {
                    string batchJson = JsonSerializer.Serialize(batch);
                    string js = $"window.addLines({JsonSerializer.Serialize(tabId)}, {batchJson});";
                    await ExecuteScriptAsync(js);
                }
                
                // Signal completion to JavaScript
                string completionJs = $"window.bookLoadComplete && window.bookLoadComplete({JsonSerializer.Serialize(tabId)});";
                await ExecuteScriptAsync(completionJs);
                
                Debug.WriteLine($"Book {bookId} loaded completely for tab {tabId}");
            }
            catch (Exception ex)
            {
                Debug.Assert(false, $"OpenBook error: {ex}");
            }
        }
    }
}

