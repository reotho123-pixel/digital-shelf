$ErrorActionPreference = 'Continue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$owner = 'reotho123-pixel'
$repo  = 'digital-shelf'
$branch = 'main'
$root  = 'D:\zcode-data\.zcode\workspace\default\digital-shelf'
$token = $env:GH_TOKEN
$api   = 'https://api.github.com'
$headers = @{
  Authorization = "Bearer $token"
  Accept        = 'application/vnd.github+json'
  'User-Agent'  = 'digital-shelf-deploy'
}

# 要上传的文件（跳过临时脚本和预览图）
$skipNames = @('_deploy.ps1','_get-fonts.ps1','_get-fonts2.ps1','_probe.ps1','_swap-accent.ps1','_swap2.ps1','_swap3.ps1')
$files = Get-ChildItem -Path $root -Recurse -File | Where-Object {
  $_.Name -notin $skipNames -and
  $_.Name -notlike '预览*' -and
  $_.FullName -notmatch '\\\.git\\'
}
$total = $files.Count
Write-Host ("files to upload: " + $total) -ForegroundColor Cyan

$ok = 0; $fail = 0
$i = 0
foreach ($f in $files) {
  $i++
  $rel = $f.FullName.Substring($root.Length + 1).Replace('\','/')
  $b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($f.FullName))

  # 已存在则取 sha 用于更新
  $sha = $null
  try {
    $ex = Invoke-RestMethod -Uri "$api/repos/$owner/$repo/contents/$rel`?ref=$branch" -Headers $headers -TimeoutSec 30
    $sha = $ex.sha
  } catch { $sha = $null }

  $body = @{ message = "add $rel"; content = $b64 }
  if ($sha) { $body.sha = $sha } else { $body.branch = $branch }

  try {
    $null = Invoke-RestMethod -Uri "$api/repos/$owner/$repo/contents/$rel" -Method PUT -Headers $headers -Body ($body | ConvertTo-Json -Compress) -ContentType 'application/json' -TimeoutSec 90
    Write-Host ("  [$i/$total] OK   $rel") -ForegroundColor Green
    $ok++
  } catch {
    $resp = $_.Exception.Response
    $detail = ''
    if ($resp) { $sr = New-Object IO.StreamReader($resp.GetResponseStream()); $detail = $sr.ReadToEnd() }
    Write-Host ("  [$i/$total] FAIL $rel  -> $detail") -ForegroundColor Red
    $fail++
  }
}

Write-Host ""
Write-Host ("uploaded: $ok   failed: $fail") -ForegroundColor Cyan
