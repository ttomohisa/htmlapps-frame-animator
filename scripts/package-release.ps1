param(
  [Parameter(Mandatory = $true)]
  [string]$Tag
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

if ($Tag -cnotmatch '^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$') {
  throw "Release tag must match stable Semantic Versioning (for example v1.0.5): $Tag"
}

$config = Get-Content -LiteralPath (Join-Path $Root 'app.config.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$version = [string]$config.version
if ($Tag -cne "v$version") {
  throw "Tag $Tag does not match app.config.json version $version."
}

$repository = [string]$config.repository.name
if ($repository -cnotmatch '^htmlapps-[a-z0-9][a-z0-9-]*$') {
  throw "Unsafe or unsupported repository name in app.config.json: $repository"
}

$dist = Join-Path $Root 'dist'
$readable = Join-Path $dist 'index.html'
$selfExtract = Join-Path $dist 'index.self-extract.html'
$canonical = Join-Path $Root ($repository.Substring('htmlapps-'.Length) + '.html')
$dependencyManifest = Join-Path $dist 'dependency-manifest.json'
$selfExtractManifest = Join-Path $dist 'self-extract-manifest.json'
$required = @($readable, $selfExtract, $canonical, $dependencyManifest, $selfExtractManifest)
foreach ($item in $required) {
  if (-not (Test-Path -LiteralPath $item -PathType Leaf)) {
    throw "Missing verified build output: $item. Run ./scripts/check-repository.ps1 first."
  }
}
if ((Get-FileHash -LiteralPath $canonical -Algorithm SHA256).Hash -ne
    (Get-FileHash -LiteralPath $readable -Algorithm SHA256).Hash) {
  throw "Repository-root HTML differs from the verified readable standalone output."
}

$releaseDir = Join-Path $Root 'release-assets'
$staging = Join-Path $releaseDir '.staging'
if (Test-Path -LiteralPath $releaseDir) {
  Remove-Item -LiteralPath $releaseDir -Recurse -Force
}
New-Item -ItemType Directory -Path $releaseDir, $staging -Force | Out-Null

$readableName = "$repository-$Tag.html"
$selfExtractName = "$repository-$Tag.self-extract.html"
$archiveName = "$repository-$Tag.zip"
$checksumName = 'SHA256SUMS.txt'

Copy-Item -LiteralPath $readable -Destination (Join-Path $releaseDir $readableName)
Copy-Item -LiteralPath $selfExtract -Destination (Join-Path $releaseDir $selfExtractName)

# Preserve the long-established release ZIP alongside the two standalone files.
Copy-Item -LiteralPath $canonical -Destination $staging
Copy-Item -LiteralPath $selfExtract -Destination (Join-Path $staging 'index.self-extract.html')
foreach ($doc in @('README.md','README.ja.md','CHANGELOG.md','LICENSE','THIRD_PARTY_NOTICES.md')) {
  Copy-Item -LiteralPath (Join-Path $Root $doc) -Destination $staging
}
New-Item -ItemType Directory -Path (Join-Path $staging 'dist') -Force | Out-Null
Copy-Item -LiteralPath $dependencyManifest -Destination (Join-Path $staging 'dist')
Copy-Item -LiteralPath $selfExtractManifest -Destination (Join-Path $staging 'dist')

$archive = Join-Path $releaseDir $archiveName
$contents = @(Get-ChildItem -LiteralPath $staging | Select-Object -ExpandProperty FullName)
if (-not $contents.Count) { throw 'Release package staging is empty.' }
Compress-Archive -LiteralPath $contents -DestinationPath $archive -CompressionLevel Optimal -Force

# Verify the archive is readable and contains the local HTML and manifest.
$zip = [System.IO.Compression.ZipFile]::OpenRead($archive)
try {
  $entries = @($zip.Entries | ForEach-Object { $_.FullName.Replace('\\','/') })
  foreach ($needed in @(
    ([System.IO.Path]::GetFileName($canonical)),
    'index.self-extract.html',
    'README.md',
    'README.ja.md',
    'LICENSE',
    'THIRD_PARTY_NOTICES.md',
    'dist/dependency-manifest.json',
    'dist/self-extract-manifest.json'
  )) {
    if ($entries -cnotcontains $needed) {
      throw "Release ZIP is missing required item: $needed"
    }
  }
} finally {
  $zip.Dispose()
}
Remove-Item -LiteralPath $staging -Recurse -Force

$checksumLines = @()
foreach ($name in @($readableName, $selfExtractName, $archiveName)) {
  $file = Join-Path $releaseDir $name
  $hash = (Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLowerInvariant()
  $checksumLines += "$hash  $name"
}
[System.IO.File]::WriteAllLines(
  (Join-Path $releaseDir $checksumName),
  [string[]]$checksumLines,
  [System.Text.UTF8Encoding]::new($false)
)
foreach ($line in $checksumLines) {
  $parts = $line -split '  ', 2
  $actual = (Get-FileHash -LiteralPath (Join-Path $releaseDir $parts[1]) -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($actual -cne $parts[0]) { throw "SHA-256 mismatch: $($parts[1])" }
}

$changelog = Get-Content -LiteralPath (Join-Path $Root 'CHANGELOG.md') -Raw -Encoding UTF8
$escapedVersion = [regex]::Escape($version)
$section = [regex]::Match(
  $changelog,
  "(?ms)^## \[$escapedVersion\][^\r\n]*\r?\n(?<body>.*?)(?=^## |\z)"
)
if (-not $section.Success -or [string]::IsNullOrWhiteSpace($section.Groups['body'].Value)) {
  throw "No release notes found under CHANGELOG.md heading ## [$version]."
}
$notes = @(
  '## Changes / 変更内容',
  '',
  $section.Groups['body'].Value.Trim(),
  '',
  '## Downloads / ダウンロード',
  '',
  ('- `{0}`: readable standalone HTML (open in a browser).' -f $readableName),
  ('- `{0}`: self-extracting standalone HTML.' -f $selfExtractName),
  ('- `{0}`: HTML, manifests, documentation and license.' -f $archiveName),
  ('- `{0}`: SHA-256 checksums for the other three downloads.' -f $checksumName),
  '',
  '## Verification',
  '',
  '- Published only for a matching version tag reachable from main.',
  '- Standalone build, self-extracting build, archive contents and SHA-256 values verified in GitHub Actions.',
  '- Browser support and device-specific behavior still vary; see the repository README.'
) -join "`n"
[System.IO.File]::WriteAllText(
  (Join-Path $releaseDir 'RELEASE_NOTES.md'),
  $notes + "`n",
  [System.Text.UTF8Encoding]::new($false)
)
Write-Host "[OK] Release assets for $Tag:"
foreach ($name in @($readableName, $selfExtractName, $archiveName, $checksumName, 'RELEASE_NOTES.md')) {
  $item = Get-Item -LiteralPath (Join-Path $releaseDir $name)
  Write-Host ("  {0} ({1} bytes)" -f $item.Name, $item.Length)
}
