using Microsoft.Web.WebView2.Core;
using System;
using System.Diagnostics;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;

namespace Zayit.Viewer
{
    /// <summary>
    /// ZayitViewer with Vue.js UI integration
    /// Handles communication between C# backend and Vue frontend
    /// </summary>
    public class ZayitViewer : ZayitViewerBase
    {
        public ZayitViewer(object commandHandler = null) : base(commandHandler)
        {
            this.Dock = System.Windows.Forms.DockStyle.Fill;
            this.CoreWebView2InitializationCompleted += (_, __) =>
            {
                //CoreWebView2.Navigate(GetHtmlPath());
                Source = new Uri(GetHtmlPath());
            };
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
                var batch = new System.Collections.Generic.List<object>(BATCH_SIZE);
                
                // Stream book lines in batches to the UI with line IDs from database
                foreach (var (content, id) in SeforimDb.DbQueries.GetBookContentWithId(bookId))
                {
                    batch.Add(new { id = id, html = content });
                    
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

        /// <summary>
        /// Called from JavaScript to get the table of contents for a book
        /// </summary>
        /// <param name="bookId">The book ID to get TOC for</param>
        private async void GetToc(int bookId)
        {
            try
            {
                var (tree, _) = SeforimDb.DbQueries.GetTocTree(bookId);
                
                string json = JsonSerializer.Serialize(tree, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });
                
                string js = $"window.receiveTocData({bookId}, {json});";
                await ExecuteScriptAsync(js);
                
                Debug.WriteLine($"TOC for book {bookId} sent successfully");
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"GetToc error: {ex}");
            }
        }

        /// <summary>
        /// Check if the viewer is hosted in a UserControl
        /// </summary>
        private async void CheckHostingMode()
        {
            try
            {
                bool isInUserControl = Parent is System.Windows.Forms.UserControl;
                string js = $"window.setHostingMode && window.setHostingMode({isInUserControl.ToString().ToLower()});";
                await ExecuteScriptAsync(js);
                Debug.WriteLine($"Hosting mode sent: isInUserControl={isInUserControl}");
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"CheckHostingMode error: {ex}");
            }
        }

        /// <summary>
        /// Toggle between UserControl and standalone Form
        /// </summary>
        private void TogglePopOut()
        {
            try
            {
                if (Parent is System.Windows.Forms.UserControl userControl)
                {
                    // Pop out to new form
                    var form = new System.Windows.Forms.Form
                    {
                        Text = "Zayit Viewer",
                        Width = 1200,
                        Height = 800,
                        StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen
                    };

                    // Remove from UserControl
                    userControl.Controls.Remove(this);
                    userControl.Visible = false;

                    // Add to Form
                    form.Controls.Add(this);
                    
                    // Store reference to original parent
                    form.Tag = userControl;
                    
                    // Handle form closing - pop back in
                    form.FormClosing += (s, e) =>
                    {
                        form.Controls.Remove(this);
                        userControl.Controls.Add(this);
                        userControl.Visible = true;
                    };
                    
                    form.Show();
                    Debug.WriteLine("Popped out to standalone form");
                }
                else if (Parent is System.Windows.Forms.Form form)
                {
                    form.Close();
                    //// Pop back into UserControl
                    //if (form.Tag is System.Windows.Forms.UserControl originalParent)
                    //{
                    //    form.Controls.Remove(this);
                    //    originalParent.Controls.Add(this);
                    //    originalParent.Visible = true;
                    //    form.Close();
                    //    Debug.WriteLine("Popped back into UserControl");
                    //}
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"TogglePopOut error: {ex}");
                System.Windows.Forms.MessageBox.Show($"Error toggling pop-out: {ex.Message}");
            }
        }
    }
}

