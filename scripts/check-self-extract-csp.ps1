$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest
$testRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("frame-animator-csp-" + [Guid]::NewGuid().ToString("N"))
$builder = Join-Path $PSScriptRoot "build-self-extract.ps1"
$verifier = Join-Path $PSScriptRoot "verify-self-extract.ps1"
$encoding = New-Object System.Text.UTF8Encoding($false)
try {
  New-Item -ItemType Directory -Force -Path $testRoot | Out-Null
  foreach ($allowWasm in @($false, $true)) {
    $capability = if ($allowWasm) { " 'wasm-unsafe-eval'" } else { "" }
    $sourcePath = Join-Path $testRoot "source.html"
    $outputPath = Join-Path $testRoot "wrapper.html"
    $source = @"
<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self' 'unsafe-inline'$capability blob:; connect-src 'none'">
<link rel="icon" href="data:image/svg+xml;base64,PHN2Zy8+">
</head><body>CSP fixture</body></html>
"@
    [System.IO.File]::WriteAllText($sourcePath, $source, $encoding)
    & $builder -InputPath $sourcePath -OutputPath $outputPath
    $wrapper = [System.IO.File]::ReadAllText($outputPath)
    $actualWasm = $wrapper -match 'script-src[^;"]*''wasm-unsafe-eval'''
    if ($actualWasm -ne $allowWasm) { throw "Loader WASM capability differs from source." }
    if ($wrapper -notmatch "connect-src 'none'") { throw "Loader network block changed." }

    # Both removal of required WASM permission and addition of unnecessary
    # permission must fail verification; general JavaScript eval always fails.
    $mismatched = if ($allowWasm) { $wrapper.Replace(" 'wasm-unsafe-eval'", "") } else { $wrapper.Replace("'unsafe-inline'", "'unsafe-inline' 'wasm-unsafe-eval'") }
    foreach ($invalid in @($mismatched, $wrapper.Replace("'unsafe-inline'", "'unsafe-inline' 'unsafe-eval'"))) {
      [System.IO.File]::WriteAllText($outputPath, $invalid, $encoding)
      $rejected = $false
      try { & $verifier -Path $outputPath -ExpectedSourcePath $sourcePath } catch { $rejected = $true }
      if (-not $rejected) { throw "Unsafe or mismatched loader CSP was accepted." }
    }
  }
} finally {
  Remove-Item -LiteralPath $testRoot -Recurse -Force -ErrorAction SilentlyContinue
}
Write-Host "[OK] Self-extract CSP parity and rejection regressions passed." -ForegroundColor Green
