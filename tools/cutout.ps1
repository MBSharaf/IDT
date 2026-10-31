# Makes the dark "card" versions of the main product photos used by the product cards and the home
# workflow thumbnails. Input: a transparent cutout per product in assets/images/products/source/cutouts/
# (<id>.png; made with Adobe's background removal from assets/images/products/<id>.jpg). The cutout is
# placed on the brand's dark card backdrop (a soft graphite glow fading to the flat #1D1D20 that
# .product-card__media uses), so the photo blends into the card with no white box.
# Output: assets/images/products/<id>-card.jpg (+ -160/-640/-960 for srcset). Re-run after adding a cutout.
# Usage:  powershell -ExecutionPolicy Bypass -File tools/cutout.ps1 [-Only <id>]
param([string]$Only = '')
Add-Type -AssemblyName System.Drawing

$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$params = [System.Drawing.Imaging.EncoderParameters]::new(1)
$params.Param[0] = [System.Drawing.Imaging.EncoderParameter]::new([System.Drawing.Imaging.Encoder]::Quality, [long]84)
$edge = [System.Drawing.Color]::FromArgb(0x1D, 0x1D, 0x20)
$glow = [System.Drawing.Color]::FromArgb(0x3A, 0x3A, 0x40)

Get-ChildItem (Join-Path $root 'assets\images\products\source\cutouts\*.png') |
  Where-Object { -not $Only -or $_.BaseName -eq $Only } | ForEach-Object {
    $cut = [System.Drawing.Bitmap]::new($_.FullName)
    $w = $cut.Width; $h = $cut.Height
    $bmp = [System.Drawing.Bitmap]::new($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear($edge)
    # Radial graphite glow behind the product, reaching the flat edge colour well inside the frame.
    $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $r = $w * 0.62; $cx = $w * 0.5; $cy = $h * 0.52
    $path.AddEllipse([single]($cx - $r), [single]($cy - $r), [single](2 * $r), [single](2 * $r))
    $brush = [System.Drawing.Drawing2D.PathGradientBrush]::new($path)
    $brush.CenterColor = $glow
    $brush.SurroundColors = @($edge)
    $brush.CenterPoint = [System.Drawing.PointF]::new([single]$cx, [single]$cy)
    $g.FillPath($brush, $path)
    $g.CompositingQuality = 'HighQuality'
    $g.DrawImage($cut, 0, 0, $w, $h)
    $base = Join-Path $root ("assets\images\products\{0}-card" -f $_.BaseName)
    $bmp.Save("$base.jpg", $codec, $params)
    foreach ($size in 160, 640, 960) {
      $s = [System.Drawing.Bitmap]::new($size, [int][Math]::Round($h * $size / $w))
      $sg = [System.Drawing.Graphics]::FromImage($s)
      $sg.InterpolationMode = 'HighQualityBicubic'; $sg.PixelOffsetMode = 'HighQuality'
      $sg.DrawImage($bmp, 0, 0, $s.Width, $s.Height)
      $s.Save("$base-$size.jpg", $codec, $params)
      $sg.Dispose(); $s.Dispose()
    }
    $brush.Dispose(); $path.Dispose(); $g.Dispose(); $bmp.Dispose(); $cut.Dispose()
    Write-Host "$($_.BaseName)-card.jpg"
  }
