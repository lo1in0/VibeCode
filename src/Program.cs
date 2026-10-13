using System;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

[assembly: AssemblyTitle("JDI")]
[assembly: AssemblyProduct("JDI — Just Did It")]
[assembly: AssemblyDescription("Личный планировщик: задачи, привычки, календарь и заметки")]
[assembly: AssemblyVersion("2.1.0.0")]
[assembly: AssemblyFileVersion("2.1.0.0")]

internal static class Program {
    internal static string Root;
    internal static string Assets;
    internal static string Smoke;
    [DllImport("kernel32.dll", CharSet=CharSet.Unicode, SetLastError=true)]
    static extern IntPtr LoadLibrary(string path);

    [STAThread]
    static void Main(string[] args) {
        Smoke = args.Length == 2 && args[0] == "--smoke" ? Path.GetFullPath(args[1]) : null;
        Root = Smoke ?? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "JDI-Desktop");
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        try {
            Directory.CreateDirectory(Root);
            Assets = Path.Combine(Root, "app-2.1.0");
            Directory.CreateDirectory(Assets);
            foreach (string name in new[] {"index.html", "app.js", "design.css", "refinements.css", "ribbon.svg", "WebView2Loader.dll"}) Extract(name);
            AppDomain.CurrentDomain.AssemblyResolve += delegate(object sender, ResolveEventArgs e) {
                string name = new AssemblyName(e.Name).Name;
                if (name != "Microsoft.Web.WebView2.Core" && name != "Microsoft.Web.WebView2.WinForms") return null;
                return Assembly.Load(Read(name + ".dll"));
            };
            if (LoadLibrary(Path.Combine(Assets,"WebView2Loader.dll")) == IntPtr.Zero)
                throw new Exception("Не удалось загрузить WebView2Loader: " + Marshal.GetLastWin32Error());
            RunWindow();
        } catch (Exception ex) { Failure(ex); }
    }
    [System.Runtime.CompilerServices.MethodImpl(System.Runtime.CompilerServices.MethodImplOptions.NoInlining)]
    static void RunWindow() {
        bool created;
        using (var mutex = new Mutex(true, Smoke == null ? "Local\\JDI.Desktop.v2" : "Local\\JDI.Desktop.Test", out created)) {
            if (!created) { MessageBox.Show("JDI уже запущен. Переключитесь на его окно.","JDI"); return; }
            Application.Run(new MainWindow());
        }
    }
    internal static byte[] Read(string name) {
        using (Stream stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("JDI."+name)) {
            if (stream == null) throw new FileNotFoundException("Встроенный ресурс не найден: "+name);
            using (var output=new MemoryStream()) {stream.CopyTo(output);return output.ToArray();}
        }
    }
    static void Extract(string name) {
        string path=Path.Combine(Assets,name);
        byte[] data=Read(name);
        if (File.Exists(path) && Convert.ToBase64String(File.ReadAllBytes(path))==Convert.ToBase64String(data)) return;
        File.WriteAllBytes(path,data);
    }
    internal static void Failure(Exception ex) {
        try { File.WriteAllText(Path.Combine(Root,"error.log"),ex.ToString()); } catch {}
        if(Smoke==null) MessageBox.Show("Не удалось запустить JDI.\n\n"+ex.Message+"\n\nДля работы нужен Microsoft Edge WebView2 Runtime. Он обычно уже установлен в Windows 10/11.","JDI",MessageBoxButtons.OK,MessageBoxIcon.Error);
        Environment.ExitCode=1;
    }
}

internal sealed class MainWindow:Form {
    readonly WebView2 web=new WebView2();
    readonly Label loading=new Label();
    public MainWindow() {
        Text="JDI — Just Did It"; Width=1440;Height=930;
        MinimumSize=new System.Drawing.Size(800,600);
        StartPosition=FormStartPosition.CenterScreen;
        BackColor=System.Drawing.Color.FromArgb(239,238,236);
        loading.Text="JDI · Загрузка…"; loading.Dock=DockStyle.Fill;
        loading.TextAlign=System.Drawing.ContentAlignment.MiddleCenter;
        loading.Font=new System.Drawing.Font("Segoe UI",22);
        web.Dock=DockStyle.Fill; Controls.Add(web);Controls.Add(loading);
        if (Program.Smoke!=null) {ShowInTaskbar=false;}
        Shown+=async delegate {
            try {
                Trace("Creating environment");
                var env=await CoreWebView2Environment.CreateAsync(null,Path.Combine(Program.Root,"profile"));
                Trace("Environment ready");
                await web.EnsureCoreWebView2Async(env);
                Trace("WebView ready");
                web.CoreWebView2.Settings.AreDevToolsEnabled=Program.Smoke!=null;
                web.CoreWebView2.Settings.IsStatusBarEnabled=false;
                web.CoreWebView2.Settings.AreDefaultContextMenusEnabled=false;
                web.CoreWebView2.SetVirtualHostNameToFolderMapping("jdi.local",Program.Assets,CoreWebView2HostResourceAccessKind.DenyCors);
                web.CoreWebView2.NavigationStarting+=delegate(object s,CoreWebView2NavigationStartingEventArgs e) {
                    Trace("Navigation starting: "+e.Uri);
                    Uri uri; if(!Uri.TryCreate(e.Uri,UriKind.Absolute,out uri) || uri.Scheme!="https" || uri.Host!="jdi.local") e.Cancel=true;
                };
                web.CoreWebView2.NewWindowRequested+=delegate(object s,CoreWebView2NewWindowRequestedEventArgs e){e.Handled=true;};
                web.CoreWebView2.NavigationCompleted+=async delegate(object s,CoreWebView2NavigationCompletedEventArgs e) {
                    Trace("Navigation completed: "+e.IsSuccess);
                    if(!e.IsSuccess) {Program.Failure(new Exception("Ошибка загрузки интерфейса: "+e.WebErrorStatus));Close();return;}
                    loading.Visible=false;
                    if(Program.Smoke!=null) {
                        bool reload=false;
                        try {
                            string result=await web.ExecuteScriptAsync(System.Text.Encoding.UTF8.GetString(Program.Read("smoke.js")));
                            if (result.Contains("\"reload\":true")) { reload=true; web.CoreWebView2.Reload(); return; }
                            File.WriteAllText(Path.Combine(Program.Smoke,"result.json"),result);
                            if (!result.Contains("\"ok\":true")) throw new Exception("Проверка интерфейса не пройдена: "+result);
                            using(var file=File.Create(Path.Combine(Program.Smoke,"preview.png"))) await web.CoreWebView2.CapturePreviewAsync(CoreWebView2CapturePreviewImageFormat.Png,file);
                        } catch(Exception ex) {Program.Failure(ex);} finally {if(!reload)Close();}
                    }
                };
                loading.Visible=false;
                web.BringToFront();
                web.CoreWebView2.Navigate("https://jdi.local/index.html");
                Trace("Navigation requested");
            } catch(Exception ex) {Program.Failure(ex);Close();}
        };
        FormClosed+=delegate {web.Dispose();};
    }
    static void Trace(string text){if(Program.Smoke!=null)File.AppendAllText(Path.Combine(Program.Smoke,"trace.log"),DateTime.Now.ToString("O")+" "+text+Environment.NewLine);}
}
