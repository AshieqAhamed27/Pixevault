param(
  [string]$OutputDir = ""
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$RepoRoot = Split-Path -Parent $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($OutputDir)) {
  $OutputDir = Join-Path $RepoRoot "public\product-images"
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

Push-Location $RepoRoot
try {
  $json = node -e "import('./lib/starter-products.mjs').then(m => console.log(JSON.stringify(m.getSeedProducts())))"
}
finally {
  Pop-Location
}

$products = $json | ConvertFrom-Json

$palettes = @{
  teal  = @{ dark = "#0f4444"; accent = "#1a6b6b"; mid = "#64c7bd"; light = "#e6f4f4"; warm = "#c8a96e" }
  amber = @{ dark = "#4f3510"; accent = "#b97812"; mid = "#f2bf4d"; light = "#fff4cf"; warm = "#1a6b6b" }
  rose  = @{ dark = "#552033"; accent = "#b63b65"; mid = "#ef83a1"; light = "#fde4ec"; warm = "#c8a96e" }
  slate = @{ dark = "#1c2638"; accent = "#40506f"; mid = "#a9b8da"; light = "#edf1fa"; warm = "#c8a96e" }
  mint  = @{ dark = "#164435"; accent = "#27765a"; mid = "#7cd2a6"; light = "#eaf8f0"; warm = "#c8a96e" }
  plum  = @{ dark = "#342047"; accent = "#70469a"; mid = "#c09ae6"; light = "#f2e8fb"; warm = "#c8a96e" }
}

function New-Color {
  param([string]$Hex)
  $hexValue = $Hex.TrimStart("#")
  return [System.Drawing.Color]::FromArgb(
    [Convert]::ToInt32($hexValue.Substring(0, 2), 16),
    [Convert]::ToInt32($hexValue.Substring(2, 2), 16),
    [Convert]::ToInt32($hexValue.Substring(4, 2), 16)
  )
}

function New-RoundPath {
  param(
    [System.Drawing.RectangleF]$Rect,
    [float]$Radius
  )

  $diameter = $Radius * 2
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddArc($Rect.X, $Rect.Y, $diameter, $diameter, 180, 90)
  $path.AddArc($Rect.Right - $diameter, $Rect.Y, $diameter, $diameter, 270, 90)
  $path.AddArc($Rect.Right - $diameter, $Rect.Bottom - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($Rect.X, $Rect.Bottom - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

function Fill-RoundRect {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Brush]$Brush,
    [System.Drawing.RectangleF]$Rect,
    [float]$Radius
  )

  $path = New-RoundPath -Rect $Rect -Radius $Radius
  try {
    $Graphics.FillPath($Brush, $path)
  }
  finally {
    $path.Dispose()
  }
}

function Draw-RoundRect {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Pen]$Pen,
    [System.Drawing.RectangleF]$Rect,
    [float]$Radius
  )

  $path = New-RoundPath -Rect $Rect -Radius $Radius
  try {
    $Graphics.DrawPath($Pen, $path)
  }
  finally {
    $path.Dispose()
  }
}

function Get-WrappedLines {
  param(
    [System.Drawing.Graphics]$Graphics,
    [string]$Text,
    [System.Drawing.Font]$Font,
    [float]$MaxWidth,
    [int]$MaxLines
  )

  $clean = (($Text -replace "\s+", " ").Trim())
  if ([string]::IsNullOrWhiteSpace($clean)) {
    return @()
  }

  $words = $clean -split " "
  $lines = New-Object System.Collections.Generic.List[string]
  $line = ""
  $index = 0
  $maxChars = [Math]::Max(10, [Math]::Floor($MaxWidth / ([Math]::Max(8, $Font.Size * 0.55))))

  while ($index -lt $words.Length) {
    $word = $words[$index]
    $candidate = if ($line.Length -gt 0) { "$line $word" } else { $word }
    $fitsByLength = $candidate.Length -le $maxChars

    if (($Graphics.MeasureString($candidate, $Font).Width -le $MaxWidth -and $fitsByLength) -or $line.Length -eq 0) {
      $line = $candidate
      $index += 1
      continue
    }

    $lines.Add($line)
    $line = ""

    if ($lines.Count -ge $MaxLines) {
      break
    }
  }

  if ($line.Length -gt 0 -and $lines.Count -lt $MaxLines) {
    $lines.Add($line)
  }

  if ($index -lt $words.Length -and $lines.Count -gt 0) {
    $last = $lines[$lines.Count - 1]
    while ($last.Length -gt 4 -and $Graphics.MeasureString("$last...", $Font).Width -gt $MaxWidth) {
      $last = $last.Substring(0, $last.LastIndexOf(" "))
      if ($last -eq "") { break }
    }
    $lines[$lines.Count - 1] = "$last..."
  }

  return $lines.ToArray()
}

function Draw-WrappedText {
  param(
    [System.Drawing.Graphics]$Graphics,
    [string]$Text,
    [System.Drawing.Font]$Font,
    [System.Drawing.Brush]$Brush,
    [float]$X,
    [float]$Y,
    [float]$MaxWidth,
    [int]$MaxLines,
    [float]$LineGap = 4
  )

  $lines = @(Get-WrappedLines -Graphics $Graphics -Text $Text -Font $Font -MaxWidth $MaxWidth -MaxLines $MaxLines)
  $lineHeight = $Font.GetHeight($Graphics) + $LineGap
  for ($i = 0; $i -lt $lines.Length; $i += 1) {
    $Graphics.DrawString($lines[$i], $Font, $Brush, $X, $Y + ($i * $lineHeight))
  }
  return $Y + ($lines.Length * $lineHeight)
}

function Get-Initials {
  param([string]$Text)
  $words = (($Text -replace "[^A-Za-z0-9\s]", " ") -split "\s+") | Where-Object { $_.Length -gt 0 }
  $letters = $words | Select-Object -First 3 | ForEach-Object { $_.Substring(0, 1).ToUpperInvariant() }
  return ($letters -join "")
}

function Get-CategoryLabel {
  param([string]$Category)
  switch ($Category) {
    "course" { return "COURSE" }
    "template" { return "TEMPLATE" }
    "tool" { return "TOOLKIT" }
    default { return $Category.ToUpperInvariant() }
  }
}

$fontTitle = New-Object System.Drawing.Font("Segoe UI", 50, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$fontBrand = New-Object System.Drawing.Font("Segoe UI", 22, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$fontKicker = New-Object System.Drawing.Font("Segoe UI", 18, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$fontBody = New-Object System.Drawing.Font("Segoe UI", 24, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$fontSmall = New-Object System.Drawing.Font("Segoe UI", 19, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$fontChip = New-Object System.Drawing.Font("Segoe UI", 18, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$fontPrice = New-Object System.Drawing.Font("Segoe UI", 34, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$fontInitials = New-Object System.Drawing.Font("Segoe UI", 52, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)

foreach ($product in $products) {
  $palette = $palettes[$product.color]
  if ($null -eq $palette) {
    $palette = $palettes.teal
  }

  $bitmap = New-Object System.Drawing.Bitmap(1200, 800)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

  try {
    $dark = New-Color $palette.dark
    $accent = New-Color $palette.accent
    $mid = New-Color $palette.mid
    $light = New-Color $palette.light
    $warm = New-Color $palette.warm

    $bgRect = New-Object System.Drawing.Rectangle(0, 0, 1200, 800)
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($bgRect, $dark, $accent, 35)
    $graphics.FillRectangle($bgBrush, $bgRect)

    $shapeBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(42, $mid))
    $graphics.FillEllipse($shapeBrush, 780, -170, 520, 520)
    $graphics.FillEllipse($shapeBrush, -170, 520, 440, 440)

    $gridPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(24, [System.Drawing.Color]::White), 1)
    for ($x = 0; $x -lt 1200; $x += 64) {
      $graphics.DrawLine($gridPen, $x, 0, $x, 800)
    }
    for ($y = 0; $y -lt 800; $y += 64) {
      $graphics.DrawLine($gridPen, 0, $y, 1200, $y)
    }

    $white = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $softWhite = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(226, [System.Drawing.Color]::White))
    $mutedWhite = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(176, [System.Drawing.Color]::White))
    $ink = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(18, 18, 28))
    $accentBrush = New-Object System.Drawing.SolidBrush($warm)
    $lightBrush = New-Object System.Drawing.SolidBrush($light)
    $midBrush = New-Object System.Drawing.SolidBrush($mid)
    $darkBrush = New-Object System.Drawing.SolidBrush($dark)

    $brandText = "PIXELVAULT"
    $graphics.DrawString($brandText, $fontBrand, $white, 72, 54)
    $graphics.DrawString("Digital product cover", $fontSmall, $mutedWhite, 72, 85)

    $categoryLabel = Get-CategoryLabel $product.category
    $categoryRect = New-Object System.Drawing.RectangleF(950, 54, 174, 42)
    Fill-RoundRect -Graphics $graphics -Brush $accentBrush -Rect $categoryRect -Radius 18
    $formatCenter = New-Object System.Drawing.StringFormat
    $formatCenter.Alignment = [System.Drawing.StringAlignment]::Center
    $formatCenter.LineAlignment = [System.Drawing.StringAlignment]::Center
    $formatCenter.FormatFlags = [System.Drawing.StringFormatFlags]::NoWrap
    $graphics.DrawString($categoryLabel, $fontKicker, $ink, $categoryRect, $formatCenter)

    $nextY = Draw-WrappedText -Graphics $graphics -Text $product.name -Font $fontTitle -Brush $white -X 72 -Y 148 -MaxWidth 560 -MaxLines 3 -LineGap 6
    $nextY += 18
    $graphics.DrawString("Built for", $fontKicker, $mutedWhite, 72, $nextY)
    $nextY += 28
    $nextY = Draw-WrappedText -Graphics $graphics -Text $product.audience -Font $fontBody -Brush $softWhite -X 72 -Y $nextY -MaxWidth 620 -MaxLines 2 -LineGap 3

    $panelRect = New-Object System.Drawing.RectangleF(72, 548, 646, 178)
    $panelBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(232, [System.Drawing.Color]::White))
    Fill-RoundRect -Graphics $graphics -Brush $panelBrush -Rect $panelRect -Radius 22

    $graphics.DrawString("SOLVES", $fontKicker, $darkBrush, 104, 576)
    Draw-WrappedText -Graphics $graphics -Text $product.problem -Font $fontSmall -Brush $ink -X 104 -Y 610 -MaxWidth 575 -MaxLines 3 -LineGap 2 | Out-Null

    $mockShadow = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(72, [System.Drawing.Color]::Black))
    $graphics.FillEllipse($mockShadow, 806, 640, 280, 46)

    $cardBack = New-Object System.Drawing.RectangleF(805, 205, 270, 360)
    $cardMid = New-Object System.Drawing.RectangleF(775, 235, 270, 360)
    $cardFront = New-Object System.Drawing.RectangleF(745, 265, 270, 360)
    Fill-RoundRect -Graphics $graphics -Brush $softWhite -Rect $cardBack -Radius 24
    Fill-RoundRect -Graphics $graphics -Brush $lightBrush -Rect $cardMid -Radius 24
    Fill-RoundRect -Graphics $graphics -Brush $white -Rect $cardFront -Radius 24

    $frontPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(60, $dark), 2)
    Draw-RoundRect -Graphics $graphics -Pen $frontPen -Rect $cardFront -Radius 24

    $stripeRect = New-Object System.Drawing.RectangleF(745, 265, 270, 88)
    $stripePath = New-RoundPath -Rect $cardFront -Radius 24
    $graphics.SetClip($stripePath)
    $graphics.FillRectangle($darkBrush, $stripeRect)
    $graphics.ResetClip()
    $stripePath.Dispose()

    $graphics.DrawString("READY TO USE", $fontKicker, $mutedWhite, 783, 295)

    $initials = Get-Initials $product.name
    $circleBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(225, $mid))
    $graphics.FillEllipse($circleBrush, 805, 382, 150, 150)
    $initialRect = New-Object System.Drawing.RectangleF(805, 382, 150, 150)
    $graphics.DrawString($initials, $fontInitials, $darkBrush, $initialRect, $formatCenter)

    $featureY = 548
    $featureBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(245, $light))
    $featurePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(90, $mid), 2)
    $features = @($product.features | Select-Object -First 3)
    foreach ($feature in $features) {
      $featureRect = New-Object System.Drawing.RectangleF(780, $featureY, 330, 45)
      Fill-RoundRect -Graphics $graphics -Brush $featureBrush -Rect $featureRect -Radius 15
      Draw-RoundRect -Graphics $graphics -Pen $featurePen -Rect $featureRect -Radius 15
      $graphics.FillEllipse($midBrush, 797, $featureY + 15, 14, 14)
      Draw-WrappedText -Graphics $graphics -Text $feature -Font $fontSmall -Brush $ink -X 825 -Y ($featureY + 10) -MaxWidth 260 -MaxLines 1 -LineGap 0 | Out-Null
      $featureY += 54
    }

    $priceRect = New-Object System.Drawing.RectangleF(884, 682, 226, 62)
    Fill-RoundRect -Graphics $graphics -Brush $accentBrush -Rect $priceRect -Radius 24
    $graphics.DrawString(("Rs. " + ([int]$product.price).ToString("N0", [System.Globalization.CultureInfo]::GetCultureInfo("en-IN"))), $fontPrice, $ink, $priceRect, $formatCenter)

    $badgeText = if ([string]::IsNullOrWhiteSpace($product.badge)) { "VALUE PACK" } else { $product.badge.ToUpperInvariant() }
    $badgeRect = New-Object System.Drawing.RectangleF(72, 716, 168, 38)
    Fill-RoundRect -Graphics $graphics -Brush $darkBrush -Rect $badgeRect -Radius 16
    $graphics.DrawString($badgeText, $fontChip, $white, $badgeRect, $formatCenter)

    $safeSlug = $product.slug
    $filePath = Join-Path $OutputDir "$safeSlug.png"
    $bitmap.Save($filePath, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "Created $filePath"
  }
  finally {
    $graphics.Dispose()
    $bitmap.Dispose()
  }
}

$fontTitle.Dispose()
$fontBrand.Dispose()
$fontKicker.Dispose()
$fontBody.Dispose()
$fontSmall.Dispose()
$fontChip.Dispose()
$fontPrice.Dispose()
$fontInitials.Dispose()

Write-Host "Generated $($products.Count) product images in $OutputDir"
