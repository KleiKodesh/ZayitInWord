using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;
using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text.Json;
using System.Windows.Forms;

namespace Zayit.Viewer
{
        /// <summary>
    /// ZayitViewer with Vue.js UI integration
    /// Handles communication between C# backend and Vue frontend
    /// SQL queries are defined in TypeScript (sqlQueries.ts) and executed here
    /// </summary>
    public class ZayitViewer : WebView2
    {
        private object _commandHandler;
        private ZayitViewerCommands _commands;
        protected CoreWebView2Environment _environment;
        private readonly string HtmlPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Html");

        public ZayitViewer(object commandHandler = null)
        {
            this.Dock = DockStyle.Fill;
            this.CoreWebView2InitializationCompleted += (_, __) =>
            {
                this.CoreWebView2.SetVirtualHostNameToFolderMapping("zayitHost", HtmlPath,
                        CoreWebView2HostResourceAccessKind.Allow);
                Source = new Uri("https://zayitHost/index.html");
            };

            // Initialize command handler
            _commands = new ZayitViewerCommands(this);
            SetCommandHandler(commandHandler);
            WebMessageReceived += ZayitViewer_WebMessageReceived;

            EnsurCoreAsync();
        }

        public void SetCommandHandler(object commandHandler)
        {
            _commandHandler = commandHandler ?? _commands;
        }

        public async void EnsurCoreAsync()
        {
            if (_environment == null)
            {
                string tempWebCacheDir = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
                _environment = await CoreWebView2Environment.CreateAsync(userDataFolder: tempWebCacheDir);
            }

            await EnsureCoreWebView2Async(_environment);
        }

        private void ZayitViewer_WebMessageReceived(object sender, CoreWebView2WebMessageReceivedEventArgs e)
        {
            try
            {
                string json = e.WebMessageAsJson;
                System.Diagnostics.Debug.WriteLine($"WebMessage received: {json}");

                var cmd = JsonSerializer.Deserialize<JsCommand> (
                    json,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                );

                if (cmd == null || string.IsNullOrWhiteSpace(cmd.Command))
                {
                    System.Diagnostics.Debug.WriteLine("Command is null or empty");
                    return;
                }

                System.Diagnostics.Debug.WriteLine($"Dispatching command: {cmd.Command}");
                DispatchCommand(cmd);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"WebMessage error: {ex}");
                Debug.WriteLine("JS message error: " + ex.Message);
            }
        }

        /// <summary>
        /// Invoke method by name using reflection
        /// </summary>
        private void DispatchCommand(JsCommand cmd)
        {
            var target = _commandHandler;
            System.Diagnostics.Debug.WriteLine($"Command handler type: {target.GetType().Name}");
            
            var methods = target.GetType()
                .GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.NonPublic);

            System.Diagnostics.Debug.WriteLine($"Found {methods.Length} methods on handler");

            // Find method with matching name (case-insensitive)
            var method = methods.FirstOrDefault(
                m => string.Equals(m.Name, cmd.Command, StringComparison.OrdinalIgnoreCase));

            if (method == null)
            {
                System.Diagnostics.Debug.WriteLine($"No handler found for command: {cmd.Command}");
                Debug.WriteLine($"No handler for command: {cmd.Command}");
                return;
            }

            System.Diagnostics.Debug.WriteLine($"Found method: {method.Name}");

            var parameters = method.GetParameters();
            object[] finalArgs = new object[parameters.Length];

            // Map args from JSON array to method parameters
            for (int i = 0; i < parameters.Length; i++)
            {
                finalArgs[i] = cmd.GetArg(i, parameters[i].ParameterType);
            }

            System.Diagnostics.Debug.WriteLine($"Invoking method with {finalArgs.Length} args");
            method.Invoke(target, finalArgs);
        }

        /// <summary>
        /// Structure of JS → C# message
        /// </summary>
        private class JsCommand
        {
            public string Command { get; set; }
            public JsonElement[] Args { get; set; } = Array.Empty<JsonElement>();

            public object GetArg(int index, Type targetType)
            {
                if (index >= Args.Length)
                    return null;

                // Handle decimal numbers for integer parameters (round to nearest int)
                if (targetType == typeof(int) && Args[index].ValueKind == JsonValueKind.Number)
                {
                    if (Args[index].TryGetDouble(out double doubleValue))
                    {
                        return (int)Math.Round(doubleValue);
                    }
                }

                return Args[index].Deserialize(targetType, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
            }
        }


        // Example handler method inside control
        private void ShowAlert(string message)
        {
            Debug.WriteLine("From JS: " + message);
        }
    }
}



//// === Example commands ===

//< script >
//    // Send a command object to C#
//    function sendCommand(command, ...args) {
//    window.chrome.webview.postMessage({
//    command: command,
//            args: args
//        });
//}

//function testAlert()
//{
//    sendCommand("ShowAlert", "Hello from JS!");
//}

//function logSomething()
//{
//    sendCommand("Log", "This is a log message from JS");
//}

//function openDocument(id)
//{
//    sendCommand("OpenDocument", id);
//}

//function calculateSum(a, b)
//{
//    sendCommand("CalculateSum", a, b);
//}

//// === OPTIONAL: Receive messages from C# ===
//window.chrome.webview.addEventListener("message", event => {
//    console.log("Message from C#:", event.data);
//    // event.data may be JSON or string
//});
//</ script >
