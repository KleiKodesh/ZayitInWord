using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace Zayit.Viewer
{
    public class ZayitViewerHost : UserControl
    {

        public ZayitViewerHost(Microsoft.Office.Interop.Word.Window activeWindow = null)
        {
            this.Dock = DockStyle.Fill;
            var zayitViewer = new ZayitViewer();
            zayitViewer.NavigationCompleted += (s, e) =>
            {
                zayitViewer._activeWindow = activeWindow;
            };
            Controls.Add(zayitViewer);
        }

        private void InitializeComponent()
        {
            this.SuspendLayout();
            // 
            // ZayitViewerHost
            // 
            this.Name = "ZayitViewerHost";
            this.ResumeLayout(false);

        }
    }
}
