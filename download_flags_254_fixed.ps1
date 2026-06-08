$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

# Put one of these JSON files beside this script:
# 1) flag_questions_254_category_36_cdn_urls.json
# or
# 2) flag_questions_254_category_36_local_paths.json
$CdnJsonPath = Join-Path $Root "flag_questions_254_category_36_cdn_urls.json"
$LocalJsonPath = Join-Path $Root "flag_questions_254_category_36_local_paths.json"

if (Test-Path $CdnJsonPath) {
    $JsonPath = $CdnJsonPath
}
elseif (Test-Path $LocalJsonPath) {
    $JsonPath = $LocalJsonPath
}
else {
    throw "JSON file not found. Put flag_questions_254_category_36_cdn_urls.json or flag_questions_254_category_36_local_paths.json beside this script."
}

$OutputDir = Join-Path $Root "public\assets\question-images\flags"
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

Write-Host "Reading questions from: $JsonPath"
$Questions = Get-Content -Raw -Encoding UTF8 $JsonPath | ConvertFrom-Json

$Urls = New-Object System.Collections.Generic.List[string]

foreach ($Question in $Questions) {
    $ImageUrl = [string]$Question.imageUrl

    if ([string]::IsNullOrWhiteSpace($ImageUrl)) {
        continue
    }

    # Case 1: already CDN URL, example:
    # https://flagcdn.com/eg.svg
    if ($ImageUrl -match "^https://flagcdn\.com/([a-z0-9-]+)\.svg$") {
        $Urls.Add($ImageUrl)
        continue
    }

    # Case 2: local path, example:
    # assets/question-images/flags/eg.svg
    if ($ImageUrl -match "flags/([a-z0-9-]+)\.svg$") {
        $Code = $Matches[1]
        $Urls.Add("https://flagcdn.com/$Code.svg")
        continue
    }
}

$UniqueUrls = $Urls | Sort-Object -Unique

if ($UniqueUrls.Count -eq 0) {
    throw "No flag URLs found in the JSON file."
}

Write-Host "Found $($UniqueUrls.Count) flags."
Write-Host "Downloading to: $OutputDir"

$Downloaded = 0
$Failed = 0

foreach ($Url in $UniqueUrls) {
    $FileName = Split-Path $Url -Leaf
    $OutFile = Join-Path $OutputDir $FileName

    try {
        Invoke-WebRequest -Uri $Url -OutFile $OutFile -UseBasicParsing
        $Downloaded++
        Write-Host "Downloaded: $FileName"
    }
    catch {
        $Failed++
        Write-Warning "Failed: $Url"
    }
}

Write-Host ""
Write-Host "Done."
Write-Host "Downloaded: $Downloaded"
Write-Host "Failed: $Failed"
Write-Host "Folder: $OutputDir"
