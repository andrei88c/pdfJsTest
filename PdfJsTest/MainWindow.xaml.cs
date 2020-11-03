using Microsoft.Toolkit.Win32.UI.Controls.Interop.WinRT;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;

namespace PdfJsTest
{
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        public MainWindow()
        {
            InitializeComponent();
            AssetControl.DOMContentLoaded += AssetControl_DOMContentLoaded;
            AssetControl.NavigationCompleted += AssetControl_Navigated;
            AssetControl.NavigationCompleted += AssetControl_NavigationCompleted;


            var pdfTemplate = "<script src='https://mozilla.github.io/pdf.js/es5/build/pdf.js'></script><div style='text-align: center;'><button id='prev' style='position: fixed; top: 50%; left:5;background-color: transparent;border: none;height: 72px; width: 72px; display:none; cursor: pointer;'><svg viewBox='0 0 20 20' fit='' height='100%' width='100%' preserveAspectRatio='xMidYMid meet' focusable='false'><path d='M14.1808094,17.9991455 L14.1799354,18 C13.8644451,18.3084794 13.3586178,18.3027959 13.0501385,17.9873057 L13.0493966,17.986546 L5.80573614,10.5585334 C5.50273367,10.2478195 5.50273367,9.75218056 5.80573614,9.44146664 L13.0493966,2.01345408 C13.3574564,1.69755413 13.8632757,1.69119843 14.1791757,1.99925822 L14.1799354,2.00000004 L14.1808094,2.00085462 C14.4963777,2.30941029 14.5024479,2.81523899 14.1943752,3.13127874 L7.49880606,10 L14.1943752,16.8687213 C14.5024479,17.1847611 14.4963777,17.6905898 14.1808094,17.9991455 Z'></path></svg></button><canvas id='the-canvas' width='1123px' height='558px'></canvas><button id='next' style='position: fixed; top: 50%; right:5; background-color: transparent;border: none;height: 72px; width: 72px; display:none; cursor: pointer;'><svg viewBox='0 0 20 20' fit='' height='100%' width='100%' preserveAspectRatio='xMidYMid meet' focusable='false' style='color:transparent;'><path d='M5.81919054,17.9991455 C5.50362224,17.6905898 5.49755199,17.1847611 5.80562475,16.8687213 L12.5011939,10 L5.80562475,3.13127874 C5.49755199,2.81523899 5.50362224,2.30941029 5.81919054,2.00085462 L5.82006454,2.00000004 C5.82031761,1.9997526 5.82057084,1.99950532 5.82082423,1.99925822 C6.13672418,1.69119843 6.64254349,1.69755413 6.95060328,2.01345408 L14.1942638,9.44146664 C14.4972662,9.75218056 14.4972662,10.2478195 14.1942638,10.5585334 L6.95060328,17.986546 C6.95035617,17.9867994 6.9501089,17.9870526 6.94986145,17.9873057 C6.6413821,18.3027959 6.13555479,18.3084794 5.82006454,18 L5.81919054,17.9991455 Z'></path></svg></button></div>";
            AssetControl.NavigateToString(pdfTemplate);
        }

        private async void AssetControl_NavigationCompleted(object sender, WebViewControlNavigationCompletedEventArgs e)
        {
            await InjectScript("pdfHelper.js");
            var pdfContent = Convert.ToBase64String(File.ReadAllBytes("test.pdf"));
            AssetControl.InvokeScript("openPdf", pdfContent, "", "");
        }

        private void AssetControl_Navigated(object sender, WebViewControlNavigationCompletedEventArgs e)
        {
           // throw new NotImplementedException();
        }

        private void AssetControl_DOMContentLoaded(object sender, WebViewControlDOMContentLoadedEventArgs e)
        {
            //throw new NotImplementedException();
        }

        private async Task InjectScript(string path)
        {
            var scriptContent = File.ReadAllText(path);
            await AssetControl.InvokeScriptAsync("eval", new string[] { scriptContent });
        }
    }
}
