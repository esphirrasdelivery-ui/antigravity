# build.ps1 — gera cheferp.html com CSS e JS embutidos (substituicao LITERAL, sem regex)
$base = 'C:\Users\luxan\.gemini\antigravity\scratch\kitchen-erp'

$css      = [IO.File]::ReadAllText("$base\css\style.css")
$jsOrder  = @('db','barcode','dashboard','produtos','fichas','entrada','producao','armazenamento','saida','pedidos','relatorios','dp','app')
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
Copy-Item "$base\pedido.html"  "$deployDir\pedido.html"  -Force
Copy-Item "$base\meta-loja.html" "$deployDir\meta-loja.html" -Force
Copy-Item "$base\funcionario.html" "$deployDir\funcionario.html" -Force
Copy-Item "$base\whatsapp.html" "$deployDir\whatsapp.html" -Force
Set-Content -Path "$deployDir\_headers" -Value "/*`n  Content-Type: text/html; charset=utf-8" -Encoding UTF8

$zipPath = "$base\netlify_deploy.zip"
if (Test-Path $zipPath) { Remove-Item -Force $zipPath }
Compress-Archive -Path "$deployDir\*" -DestinationPath $zipPath -Force
Write-Host "ZIP gerado => netlify_deploy.zip"

# Autodeploy Cloudflare Pages via Wrangler CLI
$secretsFile = "$base\secrets.ps1"
if (Test-Path $secretsFile) { . $secretsFile } else {
    Write-Host "AVISO: secrets.ps1 nao encontrado. Crie o arquivo com seu token Cloudflare."
    Write-Host "Modelo: scratch\kitchen-erp\secrets.ps1"
    $cfToken = $null; $cfAccount = "954dd9950aa76a0a182396b4ffd7bbc8"; $cfProject = "esphirras-erp"
}
$cfUrl = "https://dash.cloudflare.com/" + $cfAccount + "/pages/view/" + $cfProject + "/deployments"

$nodeOk = $null -ne (Get-Command node -ErrorAction SilentlyContinue)
$npxOk  = $null -ne (Get-Command npx  -ErrorAction SilentlyContinue)

if ($nodeOk -and $npxOk -and $cfToken) {
    Write-Host "Fazendo deploy via Wrangler..."
    $env:CLOUDFLARE_API_TOKEN  = $cfToken
    $env:CLOUDFLARE_ACCOUNT_ID = $cfAccount
    npx wrangler@3 pages deploy $deployDir --project-name $cfProject --branch main
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Deploy concluido! Acesse: https://$cfProject.pages.dev"
    } else {
        Write-Host "Wrangler falhou. Abrindo pasta e dashboard para deploy manual..."
        Start-Process explorer.exe $deployDir
        Start-Process $cfUrl
    }
} else {
    Write-Host "Node.js nao encontrado. Abrindo pasta deploy e dashboard Cloudflare..."
    Write-Host "Instale Node.js em https://nodejs.org para autodeploy futuro."
    Start-Process explorer.exe $deployDir
    Start-Process $cfUrl
}
