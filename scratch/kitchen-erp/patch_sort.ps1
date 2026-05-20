$f = 'C:\Users\luxan\.gemini\antigravity\scratch\kitchen-erp\pedido.html'
$content = [IO.File]::ReadAllText($f, [Text.Encoding]::UTF8)

$old = 'cat.itens.forEach(item =>'
$new = @'
// Exibe em ordem alfabetica
    const itensOrdenados = [...cat.itens].sort((a, b) => {
      const nA = (typeof a === 'object' ? a.nome : a) || '';
      const nB = (typeof b === 'object' ? b.nome : b) || '';
      return nA.localeCompare(nB, 'pt-BR', { sensitivity: 'base' });
    });

    itensOrdenados.forEach(item =>
'@

$result = $content.Replace($old, $new)

if ($result -eq $content) {
  Write-Host "ATENCAO: Texto nao encontrado para substituicao!"
} else {
  [IO.File]::WriteAllText($f, $result, [Text.Encoding]::UTF8)
  Write-Host "OK: pedido.html atualizado com ordenacao alfabetica."
}
