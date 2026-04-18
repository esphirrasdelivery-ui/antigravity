$f = 'C:\Users\luxan\.gemini\antigravity\scratch\kitchen-erp\cheferp.html'
$txt = [IO.File]::ReadAllText($f)
Write-Host "Tem pageContainer:" ($txt.Contains('id="pageContainer"'))
Write-Host "Tem App.init:" ($txt.Contains('App.init'))
Write-Host "Tem ProdutosPage:" ($txt.Contains('ProdutosPage'))
Write-Host "Tem NOVO PRODUTO:" ($txt.Contains('NOVO PRODUTO'))
Write-Host "Tem DOMContentLoaded:" ($txt.Contains('DOMContentLoaded'))
Write-Host "Tem template literal p.nome:" ($txt.Contains('p.nome'))
Write-Host "Tamanho total:" $txt.Length
