$f = 'C:\Users\luxan\.gemini\antigravity\scratch\kitchen-erp\pedido.html'
$lines = Get-Content $f
$clean = $lines[0..381]
$clean | Out-File -FilePath $f -Encoding UTF8
Write-Host "Truncado para $($clean.Length) linhas."
