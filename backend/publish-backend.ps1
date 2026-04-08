param(
    [string]$Configuration = "Release",
    [string]$OutputFolder = "deploy"
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectPath = Join-Path $scriptDir "OpenArms.Api.csproj"
$publishRoot = Join-Path $scriptDir $OutputFolder
$tempRoot = Join-Path $env:TEMP "OpenArms.Api.Publish"
$outputPath = Join-Path $tempRoot "bin\$Configuration\"
$intermediateOutputPath = Join-Path $tempRoot "obj\$Configuration\"
$projectExtensionsPath = Join-Path $tempRoot "msbuild\"

if (Test-Path $publishRoot) {
    try {
        Remove-Item -LiteralPath $publishRoot -Recurse -Force -ErrorAction Stop
    }
    catch {
        Write-Warning "Could not clear existing publish folder. Continuing with existing directory contents."
    }
}

New-Item -ItemType Directory -Path $publishRoot -Force | Out-Null

dotnet publish $projectPath `
    -c $Configuration `
    -o $publishRoot `
    "-p:OutputPath=$outputPath" `
    "-p:IntermediateOutputPath=$intermediateOutputPath" `
    "-p:MSBuildProjectExtensionsPath=$projectExtensionsPath"

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

$requiredFiles = @(
    "OpenArms.Api.dll",
    "OpenArms.Api.deps.json",
    "OpenArms.Api.runtimeconfig.json",
    "web.config"
)

$missingFiles = $requiredFiles | Where-Object {
    -not (Test-Path (Join-Path $publishRoot $_))
}

if ($missingFiles.Count -gt 0) {
    Write-Error ("Publish output is incomplete. Missing: " + ($missingFiles -join ", "))
    exit 1
}

Write-Host "Publish output ready:"
Write-Host "  $publishRoot"
