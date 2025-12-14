using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;
using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text.Json;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace Zayit.Viewer
{
    public class ZayitViewer : WebView2
    {
        private static CoreWebView2Environment _sharedEnvironment;
        private static readonly object _envLock = new object();

        private object _commandHandler;
        private ZayitViewerCommands _commands;
        private readonly string HtmlPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Html");

        private bool _coreInitialized;

        public ZayitViewer(object commandHandler = null)
        {
            this.Dock = DockStyle.Fill;

            // Initialize commands first
            _commands = new ZayitViewerCommands(this);
            SetCommandHandler(commandHandler);

            // Wire initialization event
            this.CoreWebView2InitializationCompleted += ZayitViewer_CoreWebView2InitializationCompleted;

            // Fire-and-forget async safely
            _ = EnsureCoreAsyncSafe();
        }

        public void SetCommandHandler(object commandHandler)
        {
            _commandHandler = commandHandler ?? _commands ?? throw new InvalidOperationException("Command handler not initialized");
        }

        public async Task EnsureCoreAsyncSafe()
        {
            try
            {
                var environment = await GetSharedEnvironmentAsync();
                await EnsureCoreWebView2Async(environment);
            }
            catch (Exception ex)
            {
                Debug.WriteLine("WebView2 initialization failed: " + ex);
            }
        }


        private static async Task<CoreWebView2Environment> GetSharedEnvironmentAsync()
        {
            if (_sharedEnvironment != null)
                return _sharedEnvironment;

            lock (_envLock)
            {
                if (_sharedEnvironment != null)
                    return _sharedEnvironment; // double-check after lock
            }

            string path = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                                       "ZayitWebView2SharedCache");

            var env = await CoreWebView2Environment.CreateAsync(userDataFolder: path);

            lock (_envLock)
            {
                _sharedEnvironment = env; // save for all instances
            }

            return _sharedEnvironment;
        }


        private void ZayitViewer_CoreWebView2InitializationCompleted(object sender, CoreWebView2InitializationCompletedEventArgs e)
        {
            if (_coreInitialized) return; // prevent double initialization
            _coreInitialized = true;

            if (!e.IsSuccess)
            {
                Debug.WriteLine("WebView2 failed to initialize: " + e.InitializationException);
                return;
            }

            try
            {
                // Map local HTML files
                this.CoreWebView2.SetVirtualHostNameToFolderMapping("zayitHost", HtmlPath,
                    CoreWebView2HostResourceAccessKind.Allow);

                // Wire message handler
                WebMessageReceived += ZayitViewer_WebMessageReceived;

                // Navigate
                Source = new Uri("https://zayitHost/index.html");

                // Optional: wait until page is fully loaded before sending messages
                CoreWebView2.NavigationCompleted += (_, __) =>
                {
                    Debug.WriteLine("WebView navigation completed, JS safe to call now");
                };
            }
            catch (Exception ex)
            {
                Debug.WriteLine("Error in CoreWebView2InitializationCompleted: " + ex);
            }
        }

        private void ZayitViewer_WebMessageReceived(object sender, CoreWebView2WebMessageReceivedEventArgs e)
        {
            try
            {
                HandleWebMessage(e.WebMessageAsJson);
            }
            catch (Exception ex)
            {
                Debug.WriteLine("WebView message handler error: " + ex);
            }
        }

        private void HandleWebMessage(string json)
        {
            try
            {
                Debug.WriteLine($"WebMessage received: {json}");

                var cmd = JsonSerializer.Deserialize<JsCommand>(
                    json,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                if (cmd?.Command is null)
                    return;

                DispatchCommand(cmd);
            }
            catch (Exception ex)
            {
                Debug.WriteLine("JS message error: " + ex);
            }
        }

        private void DispatchCommand(JsCommand cmd)
        {
            try
            {
                var target = _commandHandler ?? throw new InvalidOperationException("Command handler is null");

                var method = target.GetType()
                    .GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.NonPublic)
                    .FirstOrDefault(m => string.Equals(m.Name, cmd.Command, StringComparison.OrdinalIgnoreCase));

                if (method == null)
                {
                    Debug.WriteLine($"No handler for {cmd.Command}");
                    return;
                }

                var parameters = method.GetParameters();
                var args = new object[parameters.Length];

                for (int i = 0; i < parameters.Length; i++)
                    args[i] = cmd.GetArg(i, parameters[i].ParameterType);

                method.Invoke(target, args);
            }
            catch (TargetInvocationException tie)
            {
                Debug.WriteLine($"Handler threw: {tie.InnerException}");
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Dispatch failed: {ex}");
            }
        }

        private class JsCommand
        {
            public string Command { get; set; }
            public JsonElement[] Args { get; set; } = Array.Empty<JsonElement>();

            public object GetArg(int index, Type targetType)
            {
                if (index >= Args.Length)
                    return null;

                if (targetType == typeof(int) && Args[index].ValueKind == JsonValueKind.Number)
                {
                    if (Args[index].TryGetDouble(out double doubleValue))
                        return (int)Math.Round(doubleValue);
                }

                return Args[index].Deserialize(targetType, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            }
        }

        // Example method for testing
        private void ShowAlert(string message)
        {
            Debug.WriteLine("From JS: " + message);
        }
    }
}
