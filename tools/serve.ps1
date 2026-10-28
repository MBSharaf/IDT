# Minimal static file server for local development (no Node/Python required).
# Usage:  powershell -ExecutionPolicy Bypass -File tools/serve.ps1 [-Port 5173]
param([int]$Port = 5173)

$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$mime = @{
  '.html' = 'text/html; charset=utf-8'; '.css' = 'text/css; charset=utf-8'
  '.js' = 'text/javascript; charset=utf-8'; '.mjs' = 'text/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'; '.svg' = 'image/svg+xml'
  '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'; '.webp' = 'image/webp'
  '.glb' = 'model/gltf-binary'; '.gltf' = 'model/gltf+json'; '.mp4' = 'video/mp4'
  '.woff2' = 'font/woff2'; '.ico' = 'image/x-icon'; '.md' = 'text/markdown; charset=utf-8'
}

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$Port/")
try { $listener.Start() } catch {
  Write-Error "Port $Port is already in use (another dev server may still be running). Stop it or pass -Port <n>."
  exit 1
}
Write-Host "IDT site running at http://localhost:$Port/  (Ctrl+C to stop)"

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $res = $ctx.Response
    try {
      # Dev-only: tools/model-lab.html POSTs rendered PNGs here for side-by-side review (reference/_renders/).
      if ($ctx.Request.HttpMethod -eq 'POST' -and $ctx.Request.Url.AbsolutePath -eq '/__save') {
        $name = [IO.Path]::GetFileName($ctx.Request.QueryString['name'])
        if ($name -notmatch '^[\w.-]+\.png$') { throw 'bad name' }
        $dir = Join-Path $root 'reference\_renders'
        New-Item -ItemType Directory -Force $dir | Out-Null
        $ms = [IO.MemoryStream]::new(); $ctx.Request.InputStream.CopyTo($ms)
        [IO.File]::WriteAllBytes((Join-Path $dir $name), $ms.ToArray())
        $bytes = [Text.Encoding]::UTF8.GetBytes('saved')
        $res.ContentLength64 = $bytes.Length; $res.OutputStream.Write($bytes, 0, $bytes.Length)
        continue
      }
      $rel = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
      if ($rel -eq '' -or $rel.EndsWith('/')) { $rel += 'index.html' }
      $path = [IO.Path]::GetFullPath((Join-Path $root $rel))
      if (-not $path.StartsWith($root) -or -not (Test-Path $path -PathType Leaf)) {
        $res.StatusCode = 404
        $bytes = [Text.Encoding]::UTF8.GetBytes('404 Not Found')
      } else {
        $ext = [IO.Path]::GetExtension($path).ToLower()
        $res.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
        $res.Headers.Add('Cache-Control', 'no-store')
        $bytes = [IO.File]::ReadAllBytes($path)
      }
      $res.ContentLength64 = $bytes.Length
      if ($ctx.Request.HttpMethod -ne 'HEAD') { $res.OutputStream.Write($bytes, 0, $bytes.Length) }
    } catch { $res.StatusCode = 500 } finally { $res.Close() }
  }
} finally { $listener.Stop() }
