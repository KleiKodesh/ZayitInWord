using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;
using System;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace ZayitLib
{
    public class PdfViewerHost : UserControl
    {
        private WebView2 webView;
        private bool isPopOut = false;
        private Form? popOutWindow = null;

        public PdfViewerHost()
        {
            InitializeComponent();
        }

        private void InitializeComponent()
        {
            webView = new WebView2
            {
                Dock = DockStyle.Fill
            };
            Controls.Add(webView);

            Load += async (s, e) => await InitializeAsync();
        }

        private async Task InitializeAsync()
        {
            try
            {
                var env = await CoreWebView2Environment.CreateAsync(null, Path.Combine(Path.GetTempPath(), "PdfViewerCache"));
                await webView.EnsureCoreWebView2Async(env);

                // Set up message handler
                webView.CoreWebView2.WebMessageReceived += CoreWebView2_WebMessageReceived;

                // Navigate to the Vue app
                string htmlPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "vue-pdf-viewer", "dist", "index.html");
                
                if (File.Exists(htmlPath))
                {
                    webView.CoreWebView2.Navigate(new Uri(htmlPath).AbsoluteUri);
                }
                else
                {
                    // Development mode - use dev server
                    webView.CoreWebView2.Navigate("http://localhost:5174");
                }

                // Notify Vue about hosting mode
                await Task.Delay(500); // Wait for page to load
                await webView.CoreWebView2.ExecuteScriptAsync("window.setHostingMode?.(true)");
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Failed to initialize PDF viewer: {ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void CoreWebView2_WebMessageReceived(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
        {
            try
            {
                var json = e.WebMessageAsJson;
                var message = JsonSerializer.Deserialize<WebMessage>(json);

                if (message?.command == "TogglePopOut")
                {
                    TogglePopOut();
                }
                else if (message?.command == "CheckHostingMode")
                {
                    // Respond with hosting mode status
                    webView.CoreWebView2.ExecuteScriptAsync("window.setHostingMode?.(true)");
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Error handling web message: {ex.Message}");
            }
        }

        private void TogglePopOut()
        {
            if (isPopOut)
            {
                // Return to main window
                if (popOutWindow != null)
                {
                    popOutWindow.Close();
                    popOutWindow = null;
                }
                isPopOut = false;
            }
            else
            {
                // Pop out to new window
                popOutWindow = new Form
                {
                    Text = "PDF Viewer",
                    Width = 1200,
                    Height = 800,
                    StartPosition = FormStartPosition.CenterScreen
                };

                var popOutWebView = new WebView2
                {
                    Dock = DockStyle.Fill
                };

                popOutWindow.Controls.Add(popOutWebView);
                popOutWindow.FormClosed += (s, e) =>
                {
                    isPopOut = false;
                    popOutWindow = null;
                };

                popOutWindow.Show();

                // Initialize the pop-out WebView2
                Task.Run(async () =>
                {
                    try
                    {
                        var env = await CoreWebView2Environment.CreateAsync(null, Path.Combine(Path.GetTempPath(), "PdfViewerCache"));
                        await popOutWebView.EnsureCoreWebView2Async(env);

                        popOutWebView.CoreWebView2.WebMessageReceived += CoreWebView2_WebMessageReceived;

                        string htmlPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "vue-pdf-viewer", "dist", "index.html");
                        
                        if (File.Exists(htmlPath))
                        {
                            popOutWebView.CoreWebView2.Navigate(new Uri(htmlPath).AbsoluteUri);
                        }
                        else
                        {
                            popOutWebView.CoreWebView2.Navigate("http://localhost:5174");
                        }

                        await Task.Delay(500);
                        await popOutWebView.CoreWebView2.ExecuteScriptAsync("window.setHostingMode?.(false)");
                    }
                    catch (Exception ex)
                    {
                        MessageBox.Show($"Failed to initialize pop-out window: {ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    }
                });

                isPopOut = true;
            }
        }

        private class WebMessage
        {
            public string? command { get; set; }
            public object[]? args { get; set; }
        }
    }
}
