Add-Type -AssemblyName System.Drawing

$out = 'D:\zcode-data\.zcode\workspace\default\digital-shelf\icons'
New-Item -ItemType Directory -Force -Path $out | Out-Null

function New-Icon([int]$size, [string]$file) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::FromArgb(253, 250, 241))

  $s = $size / 100.0
  $inkColor = [System.Drawing.Color]::FromArgb(22, 23, 27)
  $penW = [float](3.2 * $s)
  $ink = New-Object System.Drawing.Pen($inkColor, $penW)
  $ink.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $ink.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $ink.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

  $green = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(201, 232, 207))

  # --- 收纳盒主体（浅绿填充 + 描边）---
  $pts = New-Object 'System.Drawing.PointF[]' 4
  $pts[0] = New-Object System.Drawing.PointF((28*$s), (48*$s))
  $pts[1] = New-Object System.Drawing.PointF((28*$s), (74*$s))
  $pts[2] = New-Object System.Drawing.PointF((72*$s), (74*$s))
  $pts[3] = New-Object System.Drawing.PointF((72*$s), (48*$s))

  $g.FillPolygon($green, $pts)
  $g.DrawPolygon($ink, $pts)

  # --- 盒盖（稍宽、略倾斜，手绘感）---
  $lidPts = New-Object 'System.Drawing.PointF[]' 4
  $lidPts[0] = New-Object System.Drawing.PointF((24*$s), (46*$s))
  $lidPts[1] = New-Object System.Drawing.PointF((24*$s), (36*$s))
  $lidPts[2] = New-Object System.Drawing.PointF((76*$s), (33*$s))
  $lidPts[3] = New-Object System.Drawing.PointF((76*$s), (43*$s))
  $g.FillPolygon($green, $lidPts)
  $g.DrawPolygon($ink, $lidPts)

  # --- 盒身分隔线 ---
  $penW2 = [float](2.2 * $s)
  $mid = New-Object System.Drawing.Pen($inkColor, $penW2)
  $mid.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $mid.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $g.DrawLine($mid, [float](35*$s), [float](59*$s), [float](65*$s), [float](58*$s))

  $g.Dispose()
  $bmp.Save((Join-Path $out $file), [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host ("wrote " + $file)
}

New-Icon 512 'icon-512.png'
New-Icon 192 'icon-192.png'
New-Icon 180 'apple-touch-icon.png'
Write-Host 'done'
