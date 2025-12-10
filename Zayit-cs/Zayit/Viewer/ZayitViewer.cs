using Microsoft.Web.WebView2.Core;
using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Windows.Threading;

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
            this.Dock = DockStyle.Fill;
            this.CoreWebView2InitializationCompleted += (_, __) =>
            {
                this.CoreWebView2.SetVirtualHostNameToFolderMapping("zayitHost", GetHtmlPath(),
                        CoreWebView2HostResourceAccessKind.Allow);
                Source = new Uri("https://zayitHost/index.html");
            };
        }

        /// <summary>
        /// Gets the path to the Vue application HTML file
        /// </summary>
        private string GetHtmlPath() =>
           Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Html");
        //private string GetHtmlIndexPath() =>
        //    Path.Combine(GetHtmlPath(), "index.html");
    }
}
