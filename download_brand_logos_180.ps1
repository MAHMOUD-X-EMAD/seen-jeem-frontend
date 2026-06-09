$ErrorActionPreference = "Continue"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$ManifestPath = Join-Path $Root "brand_logos_180_manifest.json"

if (!(Test-Path $ManifestPath)) {
    throw "brand_logos_180_manifest.json not found beside this script."
}

$OutputDir = Join-Path $Root "public\assets\question-images\brand-logos-180"
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$Manifest = Get-Content -Raw -Encoding UTF8 $ManifestPath | ConvertFrom-Json

$Downloaded = 0
$Failed = 0
$Failures = @()

foreach ($Item in $Manifest) {
    $Url = [string]$Item.cdnUrl
    $OutFile = Join-Path $OutputDir ([string]$Item.outputFile)

    try {
        Invoke-WebRequest -Uri $Url -OutFile $OutFile -UseBasicParsing
        $Downloaded++
        Write-Host "Downloaded: $($Item.outputFile) - $($Item.brand)"
    }
    catch {
        $Failed++
        $Failures += [PSCustomObject]@{
            number = $Item.number
            brand = $Item.brand
            slug = $Item.simpleIconsSlug
            url = $Url
            outputFile = $Item.outputFile
        }
        Write-Warning "Failed: $($Item.brand) - $Url"
    }
}

$FailuresPath = Join-Path $Root "brand_logos_180_failed_downloads.json"
$Failures | ConvertTo-Json -Depth 5 | Out-File -FilePath $FailuresPath -Encoding UTF8

Write-Host ""
Write-Host "Done."
Write-Host "Downloaded: $Downloaded"
Write-Host "Failed: $Failed"
Write-Host "Folder: $OutputDir"
Write-Host "Failures file: $FailuresPath"

if ($Failed -gt 0) {
    Write-Host ""
    Write-Host "Some icons failed. Send me brand_logos_180_failed_downloads.json and I will replace/fix the missing slugs."
}
