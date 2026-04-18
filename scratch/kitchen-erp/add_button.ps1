$file = 'C:\Users\luxan\.gemini\antigravity\scratch\kitchen-erp\cheferp.html'
$html = [IO.File]::ReadAllText($file)

# Remove o botão antigo se existir
$html = $html -replace '(?s)<div id=.emergencyBtn.*?</div>\s*', ''

# Adiciona botão grande no pageContainer
$btn = @'
<div id="emergencyBtn" style="position:fixed;top:50%;left:calc(50% + 120px);transform:translate(-50%,-50%);z-index:99;text-align:center">
  <button id="btnNovoGrande"
    style="background:linear-gradient(135deg,#10b981,#059669);color:#000;border:none;border-radius:20px;padding:28px 56px;font-size:1.5rem;font-weight:800;cursor:pointer;box-shadow:0 0 50px rgba(16,185,129,0.6);display:flex;align-items:center;gap:16px;font-family:Inter,sans-serif;letter-spacing:-.5px">
    <span style="font-size:2.2rem">➕</span>
    <span>NOVO PRODUTO</span>
  </button>
  <p style="color:#8b949e;margin-top:18px;font-family:Inter,sans-serif;font-size:.95rem">Clique para cadastrar um novo produto</p>
</div>
<script>
  document.addEventListener('DOMContentLoaded', function() {
    var btn = document.getElementById('btnNovoGrande');
    if (btn) {
      btn.addEventListener('click', function() {
        if (typeof App !== 'undefined' && typeof ProdutosPage !== 'undefined') {
          App.navigateTo('produtos');
          setTimeout(function() { ProdutosPage.openModal(); }, 250);
        }
      });
    }
    // Esconde o botão quando o pageContainer tiver conteúdo renderizado
    var container = document.getElementById('pageContainer');
    var eb = document.getElementById('emergencyBtn');
    var observer = new MutationObserver(function() {
      if (container && container.innerHTML.trim().length > 50) {
        if (eb) eb.style.display = 'none';
      }
    });
    if (container) observer.observe(container, { childList: true, subtree: true });
  });
</script>
'@

$html = $html -replace [regex]::Escape('<div class="page-container" id="pageContainer">'), ('<div class="page-container" id="pageContainer">' + $btn)

[IO.File]::WriteAllText($file, $html, [Text.Encoding]::UTF8)
Write-Host 'Botão grande adicionado!'
