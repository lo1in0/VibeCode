$ErrorActionPreference = 'Stop'
$source = Join-Path $PSScriptRoot 'src'
$assets = Join-Path $source 'assets'
$compiler = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
$output = Join-Path $PSScriptRoot 'JDI-2.1.exe'
$core = Join-Path $source 'Microsoft.Web.WebView2.Core.dll'
$winforms = Join-Path $source 'Microsoft.Web.WebView2.WinForms.dll'
$loader = Join-Path $source 'WebView2Loader.dll'
$compilerArgs = @(
    '/nologo', '/target:winexe', '/platform:x64', '/optimize+', '/utf8output',
    "/out:$output",
    "/win32manifest:$(Join-Path $source 'app.manifest')",
    '/reference:System.Windows.Forms.dll', '/reference:System.Drawing.dll',
    "/reference:$core", "/reference:$winforms",
    "/resource:$core,JDI.Microsoft.Web.WebView2.Core.dll",
    "/resource:$winforms,JDI.Microsoft.Web.WebView2.WinForms.dll",
    "/resource:$loader,JDI.WebView2Loader.dll",
    "/resource:$(Join-Path $assets 'index.html'),JDI.index.html",
    "/resource:$(Join-Path $assets 'design.css'),JDI.design.css",
    "/resource:$(Join-Path $assets 'refinements.css'),JDI.refinements.css",
    "/resource:$(Join-Path $assets 'ribbon.svg'),JDI.ribbon.svg",
    (Join-Path $source 'Program.cs')
)
& $compiler @compilerArgs
if ($LASTEXITCODE -ne 0) { throw 'Build failed' }
Write-Host "Ready: $output"
