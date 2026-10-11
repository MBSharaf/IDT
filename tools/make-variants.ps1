# Generates smaller copies of the large product photos (name-<width>.jpg) for responsive srcset.
# The originals stay untouched (the 3D projection textures use them). Re-run after replacing a photo.
# Usage:  powershell -ExecutionPolicy Bypass -File tools/make-variants.ps1
Add-Type -AssemblyName System.Drawing
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$sets = @(
  @{ Glob = 'assets\images\products\*.jpg'; Widths = @(160, 640, 960) },
  @{ Glob = 'assets\images\products\source\zahndent-zdm-e5\*-photo-*.jpg'; Widths = @(640, 1200) },
  @{ Glob = 'assets\images\products\source\zahndent-zdm-e5\*-detail-*.jpg'; Widths = @(640) }
)
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$params = [System.Drawing.Imaging.EncoderParameters]::new(1)
$params.Param[0] = [System.Drawing.Imaging.EncoderParameter]::new([System.Drawing.Imaging.Encoder]::Quality, [long]82)

foreach ($set in $sets) {
  Get-ChildItem (Join-Path $root $set.Glob) | Where-Object { $_.BaseName -notmatch '-(160|640|960|1200)$' -and $_.BaseName -notmatch 'cabinet' } | ForEach-Object {
    $src = [System.Drawing.Image]::FromFile($_.FullName)
    try {
      foreach ($w in $set.Widths) {
        if ($src.Width -le $w) { continue }
        $h = [int][Math]::Round($src.Height * $w / $src.Width)
        $bmp = [System.Drawing.Bitmap]::new($w, $h)
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.DrawImage($src, 0, 0, $w, $h)
        $out = Join-Path $_.DirectoryName ("{0}-{1}.jpg" -f $_.BaseName, $w)
        $bmp.Save($out, $codec, $params)
        $g.Dispose(); $bmp.Dispose()
        Write-Host ("{0}  {1}x{2}  {3:N0} KB" -f $out.Replace($root, ''), $w, $h, ((Get-Item $out).Length / 1KB))
      }
    } finally { $src.Dispose() }
  }
}
