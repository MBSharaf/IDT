# Dev helper: builds a contact-sheet HTML page for every folder in assets/images/products/source,
# so downloaded reference images can be reviewed side by side. Output: reference/sheets/<folder>.html
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$src = Join-Path $root 'assets\images\products\source'
$out = Join-Path $root 'reference\sheets'
New-Item -ItemType Directory -Force $out | Out-Null
foreach ($dir in Get-ChildItem $src -Directory) {
  $figs = Get-ChildItem $dir.FullName -File | Where-Object { $_.Extension -match '\.(jpe?g|png|webp)$' } | ForEach-Object {
    $rel = "../../assets/images/products/source/$($dir.Name)/$($_.Name)"
    "<figure><img src='$rel'><figcaption>$($_.Name)</figcaption></figure>"
  }
  $html = "<!doctype html><meta charset='utf-8'><title>$($dir.Name)</title><style>body{margin:0;background:#777;font:11px monospace}main{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;padding:4px}figure{margin:0;background:#fff}img{width:100%;display:block}figcaption{padding:2px}</style><main>$($figs -join '')</main>"
  [IO.File]::WriteAllText((Join-Path $out "$($dir.Name).html"), $html, (New-Object Text.UTF8Encoding $false))
}
Get-ChildItem $out | ForEach-Object Name
