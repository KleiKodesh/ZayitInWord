using Microsoft.Web.WebView2.Core;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace Zayit.Viewer
{
    /// <summary>
    /// ZayitViewer with Vue.js UI integration
    /// Handles communication between C# backend and Vue frontend
    /// SQL queries are defined in TypeScript (sqlQueries.ts) and executed here
    /// </summary>
    public class ZayitViewer : ZayitViewerBase
    {
        public ZayitViewer(object commandHandler = null) : base(commandHandler)
        {
            this.Dock = System.Windows.Forms.DockStyle.Fill;
            this.CoreWebView2InitializationCompleted += (_, __) =>
            {
                Source = new Uri(GetHtmlPath());
            };
        }

        /// <summary>
        /// Gets the path to the Vue application HTML file
        /// </summary>
        private string GetHtmlPath() =>
            Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Html", "index.html");

        // === Command Handlers ===

        /// <summary>
        /// Get tree data (categories and books)
        /// </summary>
        private async void GetTree()
        {
            try
            {
                Debug.WriteLine("GetTree called");

                var categories = SeforimDb.DbQueries.ExecuteQuery(SeforimDb.SqlQueries.GetAllCategories);
                var books = SeforimDb.DbQueries.ExecuteQuery(SeforimDb.SqlQueries.GetAllBooks);

                var treeData = new
                {
                    categoriesFlat = categories,
                    booksFlat = books
                };

                string json = JsonSerializer.Serialize(treeData, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });

                string js = $"window.receiveTreeData({json});";
                await ExecuteScriptAsync(js);

                Debug.WriteLine("Tree data sent successfully");
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"GetTree error: {ex}");
            }
        }

        /// <summary>
        /// Get table of contents for a book
        /// </summary>
        private async void GetToc(int bookId)
        {
            try
            {
                Debug.WriteLine($"GetToc called: bookId={bookId}");

                var tocEntries = SeforimDb.DbQueries.ExecuteQuery(SeforimDb.SqlQueries.GetToc(bookId));
                var tocData = new { tocEntriesFlat = tocEntries };

                string json = JsonSerializer.Serialize(tocData, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });

                string js = $"window.receiveTocData({bookId}, {json});";
                await ExecuteScriptAsync(js);

                Debug.WriteLine($"TOC data sent for bookId={bookId}");
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"GetToc error: {ex}");
            }
        }

        /// <summary>
        /// Get links/commentary for a line
        /// </summary>
        private async void GetLinks(int lineId, string tabId, int bookId)
        {
            try
            {
                Debug.WriteLine($"GetLinks called: lineId={lineId}, tabId={tabId}, bookId={bookId}");

                var links = SeforimDb.DbQueries.ExecuteQuery(SeforimDb.SqlQueries.GetLinks(lineId));

                string json = JsonSerializer.Serialize(links, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });

                string js = $"window.receiveLinks({JsonSerializer.Serialize(tabId)}, {bookId}, {json});";
                await ExecuteScriptAsync(js);

                Debug.WriteLine($"Links sent for lineId={lineId}");
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"GetLinks error: {ex}");
            }
        }

        /// <summary>
        /// Get total line count for a book
        /// </summary>
        private async void GetTotalLines(int bookId)
        {
            try
            {
                Debug.WriteLine($"GetTotalLines called: bookId={bookId}");

                var result = SeforimDb.DbQueries.ExecuteQuery(SeforimDb.SqlQueries.GetBookLineCount(bookId));

                Debug.WriteLine($"Query result type: {result?.GetType()}");
                
                var resultArray = result as Array;
                if (resultArray != null && resultArray.Length > 0)
                {
                    var firstItem = resultArray.GetValue(0);
                    Debug.WriteLine($"First item type: {firstItem?.GetType()}");
                    
                    // For Dapper's dynamic rows, use direct property access
                    try
                    {
                        dynamic dynamicRow = firstItem;
                        var totalLines = (int)dynamicRow.totalLines;
                        string js = $"window.receiveTotalLines({bookId}, {totalLines});";
                        await ExecuteScriptAsync(js);
                        Debug.WriteLine($"Total lines sent for bookId={bookId}: {totalLines}");
                        return;
                    }
                    catch (Exception dynamicEx)
                    {
                        Debug.WriteLine($"Dynamic access failed: {dynamicEx.Message}");
                        
                        // Fallback: try reflection on all properties
                        var properties = firstItem.GetType().GetProperties();
                        Debug.WriteLine($"Available properties: {string.Join(", ", properties.Select(p => p.Name))}");
                        
                        foreach (var prop in properties)
                        {
                            var value = prop.GetValue(firstItem);
                            Debug.WriteLine($"Property {prop.Name}: {value}");
                            
                            if (prop.Name.Equals("totalLines", StringComparison.OrdinalIgnoreCase) ||
                                prop.Name.Equals("TotalLines", StringComparison.OrdinalIgnoreCase))
                            {
                                var totalLines = Convert.ToInt32(value);
                                string js = $"window.receiveTotalLines({bookId}, {totalLines});";
                                await ExecuteScriptAsync(js);
                                Debug.WriteLine($"Total lines sent for bookId={bookId}: {totalLines}");
                                return;
                            }
                        }
                    }
                }
                
                Debug.WriteLine($"No result or no valid data returned for bookId={bookId}");
                string fallbackJs = $"window.receiveTotalLines({bookId}, 0);";
                await ExecuteScriptAsync(fallbackJs);
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"GetTotalLines error: {ex}");
            }
        }

        /// <summary>
        /// Get single line content
        /// </summary>
        private async void GetLineContent(int bookId, int lineIndex)
        {
            try
            {
                Debug.WriteLine($"GetLineContent called: bookId={bookId}, lineIndex={lineIndex}");

                var result = SeforimDb.DbQueries.ExecuteQuery(SeforimDb.SqlQueries.GetLineContent(bookId, lineIndex));

                string content = null;
                var resultArray = result as Array;
                if (resultArray != null && resultArray.Length > 0)
                {
                    var firstItem = resultArray.GetValue(0);
                    
                    // Use dynamic access for Dapper rows
                    try
                    {
                        dynamic dynamicRow = firstItem;
                        content = dynamicRow.content;
                    }
                    catch (Exception dynamicEx)
                    {
                        Debug.WriteLine($"Dynamic access failed for GetLineContent: {dynamicEx.Message}");
                        
                        // Fallback to reflection
                        var contentProperty = firstItem?.GetType().GetProperty("content");
                        content = contentProperty?.GetValue(firstItem) as string;
                    }
                }

                string contentJson = JsonSerializer.Serialize(content);
                string js = $"window.receiveLineContent({bookId}, {lineIndex}, {contentJson});";
                await ExecuteScriptAsync(js);

                Debug.WriteLine($"Line content sent for bookId={bookId}, lineIndex={lineIndex}");
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"GetLineContent error: {ex}");
            }
        }

        /// <summary>
        /// Get line ID by bookId and lineIndex
        /// </summary>
        private async void GetLineId(int bookId, int lineIndex)
        {
            try
            {
                Debug.WriteLine($"GetLineId called: bookId={bookId}, lineIndex={lineIndex}");

                var result = SeforimDb.DbQueries.ExecuteQuery(SeforimDb.SqlQueries.GetLineId(bookId, lineIndex));

                int? lineId = null;
                var resultArray = result as Array;
                if (resultArray != null && resultArray.Length > 0)
                {
                    var firstItem = resultArray.GetValue(0);
                    
                    // Use dynamic access for Dapper rows
                    try
                    {
                        dynamic dynamicRow = firstItem;
                        lineId = (int)dynamicRow.id;
                    }
                    catch (Exception dynamicEx)
                    {
                        Debug.WriteLine($"Dynamic access failed for GetLineId: {dynamicEx.Message}");
                        
                        // Fallback to reflection
                        var idProperty = firstItem?.GetType().GetProperty("id");
                        var idValue = idProperty?.GetValue(firstItem);
                        if (idValue != null)
                        {
                            lineId = Convert.ToInt32(idValue);
                        }
                    }
                }

                string lineIdJson = lineId.HasValue ? lineId.Value.ToString() : "null";
                string js = $"window.receiveLineId({bookId}, {lineIndex}, {lineIdJson});";
                await ExecuteScriptAsync(js);

                Debug.WriteLine($"Line ID sent for bookId={bookId}, lineIndex={lineIndex}: {lineIdJson}");
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"GetLineId error: {ex}");
            }
        }

        /// <summary>
        /// Get range of lines
        /// </summary>
        private async void GetLineRange(int bookId, int start, int end)
        {
            try
            {
                Debug.WriteLine($"GetLineRange called: bookId={bookId}, start={start}, end={end}");

                var lines = SeforimDb.DbQueries.ExecuteQuery(SeforimDb.SqlQueries.GetLineRange(bookId, start, end));

                string json = JsonSerializer.Serialize(lines, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });

                string js = $"window.receiveLineRange({bookId}, {start}, {end}, {json});";
                await ExecuteScriptAsync(js);

                Debug.WriteLine($"Line range sent for bookId={bookId}, start={start}, end={end}");
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"GetLineRange error: {ex}");
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
            if (this.Parent is System.Windows.Forms.UserControl container)
                container.Controls.Remove(this);
            else if (this.Parent is System.Windows.Forms.Form form)
                form.Close();
        }
    }
}
