param(
    [Parameter(Mandatory = $false)]
    [string]$Token = $env:GITHUB_TOKEN,
    [string]$Repo = "trvux/qldapm-datlich",
    [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"

# Dong bo cac file Frontend & Tai lieu kiem thu sang thu muc GitHub_Push_Tuan3 de de keo tha tren GitHub Web
$srcRoot = "d:\TT\Test\QLDAPM_TonTri_Tuan3\qldapm-datlich"
$stageRoot = "d:\TT\Test\QLDAPM_TonTri_Tuan3\GitHub_Push_Tuan3"

$filesToSync = @(
    "README.md",
    "Chay_ToanBo_PhanMem.bat",
    "frontend/index.html",
    "frontend/styles.css",
    "frontend/app.js",
    "frontend/README.md",
    "frontend/run_frontend.py",
    "frontend/Chay_Frontend_Port3000.bat",
    "docs/testing/Viec38_BaoCao_TheoDoi_TrangThai_LichHen_F06.md",
    "docs/testing/Viec43_BaoCao_SuaLoi_Frontend.md"
)

foreach ($rel in $filesToSync) {
    $srcFile = Join-Path $srcRoot ($rel.Replace('/', '\'))
    $dstFile = Join-Path $stageRoot ($rel.Replace('/', '\'))
    if (Test-Path $srcFile) {
        $dstDir = Split-Path -Parent $dstFile
        if (-not (Test-Path $dstDir)) {
            New-Item -ItemType Directory -Path $dstDir -Force | Out-Null
        }
        Copy-Item -Path $srcFile -Destination $dstFile -Force
        Write-Output "STAGED: $rel"
    }
}

if ([string]::IsNullOrWhiteSpace($Token)) {
    Write-Output "Da chuan bi san toan bo file tai: $stageRoot"
    Write-Output "De day tu dong qua API, truyen tham so -Token <GitHub_PAT> hoac keo tha thu muc frontend/ len https://github.com/$Repo"
    exit 0
}

$headers = @{
    "Authorization" = "Bearer $Token"
    "Accept"        = "application/vnd.github+json"
    "User-Agent"    = "QLDAPM-XYZ-Uploader"
}

foreach ($rel in $filesToSync) {
    $localPath = Join-Path $srcRoot ($rel.Replace('/', '\'))
    if (-not (Test-Path $localPath)) { continue }

    $apiUrl = "https://api.github.com/repos/$Repo/contents/$rel"
    $sha = $null
    try {
        $existing = Invoke-RestMethod -Uri ("$apiUrl" + "?ref=$Branch") -Method Get -Headers $headers -ErrorAction Stop
        $sha = $existing.sha
    } catch {}

    $bytes = [System.IO.File]::ReadAllBytes($localPath)
    $b64 = [Convert]::ToBase64String($bytes)

    $bodyObj = @{
        message = "[#38][#43] Cap nhat $rel - Giao dien thuong mai Frontend Sprint 3"
        content = $b64
        branch  = $Branch
    }
    if ($sha) { $bodyObj.sha = $sha }

    $jsonBody = $bodyObj | ConvertTo-Json -Depth 5
    $res = Invoke-RestMethod -Uri $apiUrl -Method Put -Headers $headers -Body $jsonBody -ContentType "application/json; charset=utf-8"
    Write-Output "PUSHED TO GITHUB ($Branch): $rel -> $($res.commit.sha)"
}
