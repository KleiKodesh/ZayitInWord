using Microsoft.Web.WebView2.WinForms;
using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Windows.Forms;

namespace Zayit.Viewer
{
    internal class ZayitViewerCommands
    {
        readonly WebView2 _webView;
        readonly SeforimDb.DbQueries _db;
        public ZayitViewerCommands(WebView2 webView)
        {
            this._webView = webView;
            _db = new SeforimDb.DbQueries();
        }

        /// <summary>
        /// Get Category / Book Tree
        /// </summary>
        private async void GetTree()
        {
            try
            {
                Debug.WriteLine("GetTree called");

                var treeData = new {
                    categoriesFlat = _db.ExecuteQuery(SeforimDb.SqlQueries.GetAllCategories),
                    booksFlat = _db.ExecuteQuery(SeforimDb.SqlQueries.GetAllBooks)
                };

                string json = JsonSerializer.Serialize(treeData, new JsonSerializerOptions  {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });

                string js = $"window.receiveTreeData({json});";
                await _webView.ExecuteScriptAsync(js);

                Debug.WriteLine("Tree data sent successfully");
            }
            catch (Exception ex)
            {
                MessageBox.Show($"GetTree error: {ex}");
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

                var tocEntries = _db.ExecuteQuery(SeforimDb.SqlQueries.GetToc(bookId));
                var tocData = new { tocEntriesFlat = tocEntries };

                string json = JsonSerializer.Serialize(tocData, new JsonSerializerOptions {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });

                string js = $"window.receiveTocData({bookId}, {json});";
                await _webView.ExecuteScriptAsync(js);

                Debug.WriteLine($"TOC data sent for bookId={bookId}");
            }
            catch (Exception ex)
            {
                MessageBox.Show($"GetToc error: {ex}");
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

                var links = _db.ExecuteQuery(SeforimDb.SqlQueries.GetLinks(lineId));

                string json = JsonSerializer.Serialize(links, new JsonSerializerOptions {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });

                string js = $"window.receiveLinks({JsonSerializer.Serialize(tabId)}, {bookId}, {json});";
                await _webView.ExecuteScriptAsync(js);

                Debug.WriteLine($"Links sent for lineId={lineId}");
            }
            catch (Exception ex)
            {
                MessageBox.Show($"GetLinks error: {ex}");
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

                var result = _db.ExecuteQuery(SeforimDb.SqlQueries.GetBookLineCount(bookId));

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
                        await _webView.ExecuteScriptAsync(js);
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
                                await _webView.ExecuteScriptAsync(js);
                                Debug.WriteLine($"Total lines sent for bookId={bookId}: {totalLines}");
                                return;
                            }
                        }
                    }
                }

                MessageBox.Show($"No result or no valid data returned for bookId={bookId}");
                string fallbackJs = $"window.receiveTotalLines({bookId}, 0);";
                await _webView.ExecuteScriptAsync(fallbackJs);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"GetTotalLines error: {ex}");
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

                var result = _db.ExecuteQuery(SeforimDb.SqlQueries.GetLineContent(bookId, lineIndex));

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
                await _webView.ExecuteScriptAsync(js);

                Debug.WriteLine($"Line content sent for bookId={bookId}, lineIndex={lineIndex}");
            }
            catch (Exception ex)
            {
                MessageBox.Show($"GetLineContent error: {ex}");
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

                var result = _db.ExecuteQuery(SeforimDb.SqlQueries.GetLineId(bookId, lineIndex));

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
                await _webView.ExecuteScriptAsync(js);

                Debug.WriteLine($"Line ID sent for bookId={bookId}, lineIndex={lineIndex}: {lineIdJson}");
            }
            catch (Exception ex)
            {
                MessageBox.Show($"GetLineId error: {ex}");
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

                var lines = _db.ExecuteQuery(SeforimDb.SqlQueries.GetLineRange(bookId, start, end));

                string json = JsonSerializer.Serialize(lines, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });

                string js = $"window.receiveLineRange({bookId}, {start}, {end}, {json});";
                await _webView.ExecuteScriptAsync(js);

                Debug.WriteLine($"Line range sent for bookId={bookId}, start={start}, end={end}");
            }
            catch (Exception ex)
            {
                MessageBox.Show($"GetLineRange error: {ex}");
            }
        }

        /// <summary>
        /// Check if the viewer is hosted in a UserControl
        /// </summary>
        private async void CheckHostingMode()
        {
            try
            {
                bool isInUserControl = _webView.Parent is UserControl;
                string js = $"window.setHostingMode && window.setHostingMode({isInUserControl.ToString().ToLower()});";
                await _webView.ExecuteScriptAsync(js);
                Debug.WriteLine($"Hosting mode sent: isInUserControl={isInUserControl}");
            }
            catch (Exception ex)
            {
                MessageBox.Show($"CheckHostingMode error: {ex}");
            }
        }

        /// <summary>
        /// Open PDF file picker dialog
        /// </summary>
        private async void OpenPdfFilePicker()
        {
            try
            {
                string filePath = null;
                string fileName = null;
                string base64 = null;

                using (var dlg = new OpenFileDialog())
                {
                    dlg.Filter = "PDF Files (*.pdf)|*.pdf";
                    dlg.Title = "בחר קובץ PDF";

                    if (dlg.ShowDialog() == DialogResult.OK)
                    {
                        filePath = dlg.FileName;
                        fileName = Path.GetFileName(filePath);

                        try
                        {
                            byte[] bytes = File.ReadAllBytes(filePath);
                            base64 = Convert.ToBase64String(bytes);
                        }
                        catch (Exception fileEx)
                        {
                            MessageBox.Show($"Failed to read PDF: {fileEx}");
                        }
                    }
                }

                string filePathJson = JsonSerializer.Serialize(filePath);
                string fileNameJson = JsonSerializer.Serialize(fileName);
                string base64Json = JsonSerializer.Serialize(base64);

                string js = $"window.receivePdfFilePath({filePathJson}, {fileNameJson}, {base64Json});";


                await _webView.ExecuteScriptAsync(js);


                Debug.WriteLine($"PDF result sent: filePath={filePath}, fileName={fileName}, hasBase64={base64 != null}");
            }
            catch (Exception ex)
            {
                MessageBox.Show($"OpenPdfFilePicker error: {ex}");
            }
        }



        /// <summary>
        /// Load PDF from file path and convert to data URL
        /// </summary>
        private async void LoadPdfFromPath(string filePath)
        {
            try
            {
                Debug.WriteLine($"LoadPdfFromPath called: {filePath}");

                string dataUrl = null;

                if (!string.IsNullOrEmpty(filePath) && File.Exists(filePath))
                {
                    try
                    {
                        // Read PDF file and convert to base64
                        byte[] pdfBytes = File.ReadAllBytes(filePath);
                        string base64 = Convert.ToBase64String(pdfBytes);
                        dataUrl = base64; // Just the base64 string
                        Debug.WriteLine($"PDF loaded from path, size: {pdfBytes.Length} bytes");
                    }
                    catch (Exception fileEx)
                    {
                        Debug.WriteLine($"Failed to read PDF file: {fileEx.Message}");
                    }
                }
                else
                {
                    Debug.WriteLine($"PDF file not found: {filePath}");
                }

                // Send result back to Vue
                string filePathJson = JsonSerializer.Serialize(filePath);
                string dataUrlJson = JsonSerializer.Serialize(dataUrl);
                string js = $"window.receivePdfDataUrl({filePathJson}, {dataUrlJson});";
                await _webView.ExecuteScriptAsync(js);

                Debug.WriteLine($"PDF load result sent: filePath={filePath}, hasDataUrl={dataUrl != null}");
            }
            catch (Exception ex)
            {
                MessageBox.Show($"LoadPdfFromPath error: {ex}");

                // Send null result on error
                string filePathJson = JsonSerializer.Serialize(filePath);
                string js = $"window.receivePdfDataUrl({filePathJson}, null);";
                await _webView.ExecuteScriptAsync(js);
            }
        }

        /// <summary>
        /// Toggle between UserControl and standalone Form
        /// </summary>
        private void TogglePopOut()
        {
            if (_webView.Parent is UserControl container)
                container.Controls.Remove(_webView);
            else if (_webView.Parent is Form form)
                form.Close();
        }
    }
}
