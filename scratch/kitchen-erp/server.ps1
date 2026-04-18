$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://localhost:8765/')
$listener.Start()
Write-Host "Servidor HTTP iniciado em http://localhost:8765"

$base = 'C:\Users\luxan\.gemini\antigravity\scratch\kitchen-erp'
$mime = @{
    '.html' = 'text/html;charset=utf-8'
    '.css'  = 'text/css;charset=utf-8'
    '.js'   = 'application/javascript;charset=utf-8'
    '.png'  = 'image/png'
    '.svg'  = 'image/svg+xml'
    '.ico'  = 'image/x-icon'
}

while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $req = $ctx.Request
    $res = $ctx.Response
    
    $url = $req.Url.LocalPath
    if ($url -eq '/') { $url = '/index.html' }
    
    $file = Join-Path $base $url.TrimStart('/')
    $ext = [System.IO.Path]::GetExtension($file)
    
    if (Test-Path $file) {
        $bytes = [System.IO.File]::ReadAllBytes($file)
        $ct = $mime[$ext]
        if (-not $ct) { $ct = 'text/plain' }
        $res.ContentType = $ct
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
        $res.StatusCode = 404
        $notfound = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found')
        $res.OutputStream.Write($notfound, 0, $notfound.Length)
    }
    $res.OutputStream.Close()
}
