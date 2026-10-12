Add-Type -AssemblyName System.Drawing

$Out = Join-Path $PSScriptRoot 'assets'
New-Item -ItemType Directory -Force -Path $Out | Out-Null

function New-BrushColor([int]$a,[int]$r,[int]$g,[int]$b) { return [System.Drawing.Color]::FromArgb($a,$r,$g,$b) }
function Draw-Grid($g, [int]$width, [int]$height, [int]$step, [int]$alpha) {
  $p = New-Object System.Drawing.Pen (New-BrushColor $alpha 55 255 190), 1
  for ($x=-$height; $x -lt $width+$height; $x += $step) { $g.DrawLine($p,$x,0,$x+$height,$height) }
  for ($x=0; $x -lt $width+$height; $x += $step) { $g.DrawLine($p,$x,0,$x-$height,$height) }
  $p.Dispose()
}
function Draw-Node($g, [int]$x, [int]$y, [int]$r, [System.Drawing.Color]$color) {
  $b = New-Object System.Drawing.SolidBrush $color
  $g.FillEllipse($b,$x-$r,$y-$r,$r*2,$r*2)
  $b.Dispose()
}
function Draw-Cube($g, [float]$cx, [float]$top, [float]$scale) {
  $half = 220*$scale; $rise = 125*$scale; $mid = 250*$scale; $depth = 265*$scale
  $a = [System.Drawing.PointF]::new([single]$cx, [single]$top)
  $b = [System.Drawing.PointF]::new([single]($cx+$half), [single]($top+$rise))
  $c = [System.Drawing.PointF]::new([single]$cx, [single]($top+$mid))
  $d = [System.Drawing.PointF]::new([single]($cx-$half), [single]($top+$rise))
  $e = [System.Drawing.PointF]::new([single]($cx-$half), [single]($top+$rise+$depth))
  $f = [System.Drawing.PointF]::new([single]$cx, [single]($top+$mid+$depth))
  $h = [System.Drawing.PointF]::new([single]($cx+$half), [single]($top+$rise+$depth))
  $topFace = [System.Drawing.PointF[]]@($a,$b,$c,$d)
  $leftFace = [System.Drawing.PointF[]]@($d,$c,$f,$e)
  $rightFace = [System.Drawing.PointF[]]@($b,$h,$f,$c)

  $topBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new($a,$c,(New-BrushColor 255 26 114 92),(New-BrushColor 255 7 37 38))
  $leftBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new($d,$f,(New-BrushColor 255 9 56 52),(New-BrushColor 255 3 22 27))
  $rightBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new($b,$f,(New-BrushColor 255 28 125 97),(New-BrushColor 255 8 46 48))
  $g.FillPolygon($topBrush,$topFace)
  $g.FillPolygon($leftBrush,$leftFace)
  $g.FillPolygon($rightBrush,$rightFace)
  $topBrush.Dispose(); $leftBrush.Dispose(); $rightBrush.Dispose()

  $edge = New-Object System.Drawing.Pen (New-BrushColor 235 99 255 193), (7*$scale)
  $edge.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $g.DrawPolygon($edge,$topFace); $g.DrawPolygon($edge,$leftFace); $g.DrawPolygon($edge,$rightFace)
  $edge.Dispose()

  $grid = New-Object System.Drawing.Pen (New-BrushColor 105 112 255 210), (2*$scale)
  for ($i=1; $i -lt 4; $i++) {
    $t = $i/4.0
    $g.DrawLine($grid,($d.X+($a.X-$d.X)*$t),($d.Y+($a.Y-$d.Y)*$t),($c.X+($b.X-$c.X)*$t),($c.Y+($b.Y-$c.Y)*$t))
    $g.DrawLine($grid,($d.X+($e.X-$d.X)*$t),($d.Y+($e.Y-$d.Y)*$t),($c.X+($f.X-$c.X)*$t),($c.Y+($f.Y-$c.Y)*$t))
    $g.DrawLine($grid,($b.X+($h.X-$b.X)*$t),($b.Y+($h.Y-$b.Y)*$t),($c.X+($f.X-$c.X)*$t),($c.Y+($f.Y-$c.Y)*$t))
  }
  $grid.Dispose()
  $core = New-Object System.Drawing.SolidBrush (New-BrushColor 255 151 255 213)
  $g.FillEllipse($core,$c.X-(16*$scale),$c.Y-(16*$scale),32*$scale,32*$scale)
  $core.Dispose()
}
# Square activity icon
$icon = New-Object System.Drawing.Bitmap 1024,1024,([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($icon)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$bgRect = New-Object System.Drawing.Rectangle 0,0,1024,1024
$bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush($bgRect,(New-BrushColor 255 4 13 19),(New-BrushColor 255 9 42 43),45)
$g.FillRectangle($bg,$bgRect); $bg.Dispose()
for ($r=900; $r -gt 120; $r-=45) { $p=New-Object System.Drawing.Pen (New-BrushColor ([Math]::Max(3,44-[int](($r-120)/20))) 18 247 177), 4; $g.DrawEllipse($p,512-$r/2,512-$r/2,$r,$r); $p.Dispose() }
Draw-Grid $g 1024 1024 118 38
$rand = New-Object System.Random 2401
for ($i=0;$i -lt 80;$i++) { Draw-Node $g ($rand.Next(55,970)) ($rand.Next(55,970)) ($rand.Next(1,4)) (New-BrushColor ($rand.Next(25,90)) 146 255 219) }
Draw-Cube $g 512 245 1.22
$frame = New-Object System.Drawing.Pen (New-BrushColor 200 94 255 194),10
$g.DrawRectangle($frame,17,17,990,990); $frame.Dispose()
$icon.Save((Join-Path $Out 'unimatrix-activity-icon.png'),[System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $icon.Dispose()

# Wide activity cover
$cover = New-Object System.Drawing.Bitmap 1920,1080,([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($cover)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$coverRect = New-Object System.Drawing.Rectangle 0,0,1920,1080
$coverBg = New-Object System.Drawing.Drawing2D.LinearGradientBrush($coverRect,(New-BrushColor 255 3 10 18),(New-BrushColor 255 8 53 51),0)
$g.FillRectangle($coverBg,$coverRect); $coverBg.Dispose()
$glow = New-Object System.Drawing.SolidBrush (New-BrushColor 37 63 255 205)
for ($i=0;$i -lt 8;$i++) { $g.FillEllipse($glow,1070-$i*45,45+$i*27,740+$i*90,740+$i*90) }
$glow.Dispose()
Draw-Grid $g 1920 1080 96 33
$rand = New-Object System.Random 1701
for ($i=0;$i -lt 180;$i++) { Draw-Node $g ($rand.Next(18,1900)) ($rand.Next(18,1060)) ($rand.Next(1,4)) (New-BrushColor ($rand.Next(20,105)) 158 255 225) }

# wordmark panel
$panel = New-Object System.Drawing.SolidBrush (New-BrushColor 128 3 17 24)
$g.FillRectangle($panel,104,198,740,560); $panel.Dispose()
$line = New-Object System.Drawing.Pen (New-BrushColor 220 77 255 186),5
$g.DrawLine($line,106,202,842,202); $g.DrawLine($line,106,757,842,757); $line.Dispose()
$fam = New-Object System.Drawing.FontFamily 'Segoe UI'
$title = New-Object System.Drawing.Font($fam,76,[System.Drawing.FontStyle]::Bold,[System.Drawing.GraphicsUnit]::Pixel)
$sub = New-Object System.Drawing.Font($fam,30,[System.Drawing.FontStyle]::Regular,[System.Drawing.GraphicsUnit]::Pixel)
$tag = New-Object System.Drawing.Font($fam,21,[System.Drawing.FontStyle]::Bold,[System.Drawing.GraphicsUnit]::Pixel)
$white = New-Object System.Drawing.SolidBrush (New-BrushColor 255 229 255 246)
$mint = New-Object System.Drawing.SolidBrush (New-BrushColor 255 132 255 207)
$muted = New-Object System.Drawing.SolidBrush (New-BrushColor 255 167 215 207)
$g.DrawString('UNIMATRIX',$title,$white,148,310)
$g.DrawString('SOCIAL DECK',$title,$mint,148,400)
$g.DrawString('MULTIPLAYER HOLODECK PROGRAMS',$tag,$muted,151,525)
$g.DrawString('Gather the crew. Choose a simulation. Adapt together.',$sub,$white,149,592)
$g.DrawString('2–10 PLAYERS  •  DESKTOP & MOBILE',$tag,$mint,151,675)
$title.Dispose();$sub.Dispose();$tag.Dispose();$white.Dispose();$mint.Dispose();$muted.Dispose()
Draw-Cube $g 1390 235 1.23
$scan = New-Object System.Drawing.Pen (New-BrushColor 25 200 255 235),2
for ($y=0;$y -lt 1080;$y+=7) { $g.DrawLine($scan,0,$y,1920,$y) }; $scan.Dispose()
$cover.Save((Join-Path $Out 'unimatrix-activity-cover.png'),[System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $cover.Dispose()


