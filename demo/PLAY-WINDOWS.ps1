$ErrorActionPreference = 'Stop'
$root = [System.IO.Path]::GetFullPath($PSScriptRoot)
$socket = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
$socket.Start()
$port = ($socket.LocalEndpoint).Port
$socket.Stop()
$server = [System.Net.HttpListener]::new()
$server.Prefixes.Add("http://127.0.0.1:$port/")
$server.Start()
$types = @{ '.html'='text/html; charset=utf-8'; '.js'='text/javascript; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.png'='image/png'; '.mp3'='audio/mpeg'; '.json'='application/json; charset=utf-8'; '.txt'='text/plain; charset=utf-8' }
Write-Host "Lightning Pong Archive Edition: http://127.0.0.1:$port/app/index.html"
Start-Process "http://127.0.0.1:$port/app/index.html"
Write-Host 'Lightning Pong Archive Edition is running. Close this window to stop it.'
try {
  while ($server.IsListening) {
    $request = $server.GetContext()
    $relative = [Uri]::UnescapeDataString($request.Request.Url.AbsolutePath.TrimStart('/')).Replace('/', [IO.Path]::DirectorySeparatorChar)
    if (-not $relative) { $relative = 'index.html' }
    $path = [IO.Path]::GetFullPath([IO.Path]::Combine($root, $relative))
    if (-not $path.StartsWith($root + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase) -or -not [IO.File]::Exists($path)) {
      $request.Response.StatusCode = 404
    } else {
      $ext = [IO.Path]::GetExtension($path).ToLowerInvariant()
      $request.Response.ContentType = $(if ($types.ContainsKey($ext)) { $types[$ext] } else { 'application/octet-stream' })
      $bytes = [IO.File]::ReadAllBytes($path)
      $request.Response.ContentLength64 = $bytes.Length
      $request.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    }
    $request.Response.Close()
  }
} finally { $server.Stop(); $server.Close() }
