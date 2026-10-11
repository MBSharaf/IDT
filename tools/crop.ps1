# Dev helper: crops a region of an image (pixel coords), upscales it and draws a labelled pixel grid,
# so feature positions can be read off precisely. Output goes to the given -Out path (PNG).
param([string]$Src, [int]$X0, [int]$Y0, [int]$X1, [int]$Y1, [int]$Scale = 3, [int]$Grid = 10, [string]$Out)
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile($Src)
$w = ($X1 - $X0) * $Scale; $h = ($Y1 - $Y0) * $Scale
$bmp = [System.Drawing.Bitmap]::new([int]$w, [int]$h)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
$g.DrawImage($img, [System.Drawing.Rectangle]::new(0, 0, $w, $h), [System.Drawing.Rectangle]::new($X0, $Y0, $X1 - $X0, $Y1 - $Y0), [System.Drawing.GraphicsUnit]::Pixel)
$pen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(110, 255, 0, 160), 1)
$font = [System.Drawing.Font]::new('Consolas', 9)
$brush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 220, 0, 140))
for ($x = [math]::Ceiling($X0 / $Grid) * $Grid; $x -le $X1; $x += $Grid) {
  $sx = ($x - $X0) * $Scale; $g.DrawLine($pen, $sx, 0, $sx, $h)
  if ($x % ($Grid * 5) -eq 0) { $g.DrawString("$x", $font, $brush, $sx + 1, 1) }
}
for ($y = [math]::Ceiling($Y0 / $Grid) * $Grid; $y -le $Y1; $y += $Grid) {
  $sy = ($y - $Y0) * $Scale; $g.DrawLine($pen, 0, $sy, $w, $sy)
  if ($y % ($Grid * 5) -eq 0) { $g.DrawString("$y", $font, $brush, 1, $sy + 1) }
}
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose(); $img.Dispose()
"$Out ($w x $h)"
