# build.ps1 — gera cheferp.html com CSS e JS embutidos (substituicao LITERAL, sem regex)
$base = 'C:\Users\luxan\.gemini\antigravity\scratch\kitchen-erp'

$css      = [IO.File]::ReadAllText("$base\css\style.css")
$jsOrder  = @('db','barcode','dashboard','produtos','fichas','entrada','producao','armazenamento','saida','pedidos','relatorios','app')
$jsContent = $jsOrder | ForEach-Object { [IO.File]::ReadAllText("$base\js\$_.js") }
$allJs    = [string]::Join("`n`n", $jsContent)

$html = [IO.File]::ReadAllText("$base\index.html")

# Substituicoes LITERAIS (.Replace) — nao interpreta $ como regex
$html = $html.Replace('<link rel="stylesheet" href="css/style.css" />', '<style>' + $css + '</style>')

foreach ($f in $jsOrder) {
    $html = $html.Replace('<script src="js/' + $f + '.js"></script>', '')
}

$html = $html.Replace('</body>', '<script>' + $allJs + '</script>' + [char]10 + '</body>')

# Embute logo base64
$logoPath = 'C:\Users\luxan\.gemini\antigravity\brain\cb3ec020-8f18-40e4-8b75-33be527aca8f\esphirras_logo_real_1776310939220.png'
if (Test-Path $logoPath) {
    $b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($logoPath))
    $dataUrl = 'data:image/png;base64,' + $b64
    $html = $html.Replace('LOGO_BASE64_PLACEHOLDER', $dataUrl)
}

[IO.File]::WriteAllText("$base\cheferp.html", $html, [Text.Encoding]::UTF8)
Write-Host "cheferp.html gerado! Tamanho: $([Math]::Round((Get-Item "$base\cheferp.html").Length/1KB)) KB"

# Montagem do diretório de Deploy
$deployDir = "$base\deploy"
if (Test-Path $deployDir) { Remove-Item -Recurse -Force $deployDir }
New-Item -ItemType Directory -Path $deployDir | Out-Null

Copy-Item "$base\cheferp.html" "$deployDir\index.html" -Force
Copy-Item "$base\pedido.html" "$deployDir\pedido.html" -Force
Set-Content -Path "$deployDir\_headers" -Value "/*`n  Content-Type: text/html; charset=utf-8" -Encoding UTF8

$zipPath = "$base\netlify_deploy.zip"
if (Test-Path $zipPath) { Remove-Item -Force $zipPath }
Compress-Archive -Path "$deployDir\*" -DestinationPath $zipPath -Force
Write-Host "ZIP pronto para Netlify => netlify_deploy.zip"

# Autodeploy
try {
    $token = "nfp_2QTx7CVQEnL15Zv8MS62tm6xubBgZT55cec4"
    $newSiteId = "74326dfc-a119-4459-8b86-30700dcbb8b9"
    $zB = [IO.File]::ReadAllBytes($zipPath)
    $deploy = Invoke-RestMethod -Uri "https://api.netlify.com/api/v1/sites/$newSiteId/deploys" -Method POST -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/zip"} -Body $zB -ErrorAction Stop
    Write-Host "✅ Deploy na nuvem concluído! Status: $($deploy.state)"
} catch {
    Write-Host "⚠️ Erro no autodeploy: $($_.Exception.Message)"
}
