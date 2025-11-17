using System;
using System.Text.Json;
using System.Windows.Forms;
using Zayit.Models;
using Zayit.SeforimDb;

namespace Zayit
{
    internal static class Program
    {
        /// <summary>
        /// The main entry point for the application.
        /// </summary>
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            var form = new Form
            {
                Height = 700,
                Width = 500,
                StartPosition = FormStartPosition.CenterScreen,
                AutoScaleMode = AutoScaleMode.Dpi
            };

            var viewer = new ZayitViewer();
            form.Controls.Add(viewer);

            Application.Run(form);
        }
    }
}
