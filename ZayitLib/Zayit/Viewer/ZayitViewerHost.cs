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

        public ZayitViewerHost()
        {
            this.Dock = DockStyle.Fill;
            Controls.Add(new ZayitViewer());
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
