/**
 * etiquetas.js 
 * Módulo para emissão de Etiquetas Térmicas (Zebra 60x30)
 */

window.EtiquetasPage = {
  render() {
    const produtos = DB.getProdutos() || [];
    
    // Sort alfabeticamente
    produtos.sort((a,b) => a.nome.localeCompare(b.nome));

    let optionsStr = '<option value="">Selecione o que você manipulou...</option>';
    produtos.forEach(p => {
       optionsStr += `<option value="${p.id}" data-dias="${p.validadeDias}">${p.nome} (Val: ${p.validadeDias}d)</option>`;
    });

    const hoje = new Date().toISOString().split('T')[0];

    return `
      <div class="card" style="max-width: 600px; margin: 0 auto;">
        <div class="card-header" style="text-align:center">
          <h2 style="color:var(--accent); font-size:2rem; margin-bottom:5px;">🏷️ Etiquetas (Zebra 60x30)</h2>
          <p>Selecione o insumo, confira a data e imprima o adesivo de validade.</p>
        </div>
        <div class="card-body">
          <form id="formEtiqueta" onsubmit="EtiquetasPage.gerarImpressao(event)">

            <div class="form-group" style="margin-bottom:20px;">
              <label style="font-weight:bold; font-size:1.1rem">1. Produto / Insumo *</label>
              <select id="etiqProduto" class="input-form" onchange="EtiquetasPage.onProdutoSelecionado()" required style="font-size:1.1rem; padding:12px;">
                ${optionsStr}
              </select>
            </div>

            <div style="display:flex; gap:15px; margin-bottom:20px;">
                <div class="form-group" style="flex:1">
                  <label>Data de Fabricação / Abertura *</label>
                  <input type="date" id="etiqFab" class="input-form" required value="${hoje}" onchange="EtiquetasPage.calcularValidade()" />
                </div>
                <div class="form-group" style="flex:1">
                  <label style="color:var(--danger); font-weight:bold">Válido Até (Vencimento) *</label>
                  <input type="date" id="etiqVal" class="input-form" required style="border-color:var(--danger)" />
                </div>
            </div>

            <div class="form-group" style="margin-bottom:20px;">
              <label>Lote / Responsável / Obs (Opcional)</label>
              <input type="text" id="etiqLote" class="input-form" placeholder="Ex: L-014 ou Pedro..." maxlength="20" />
            </div>

            <div class="form-group" style="margin-bottom:30px;">
              <label style="font-weight:bold; font-size:1.1rem">Quantidade de Etiquetas *</label>
              <input type="number" id="etiqQtd" class="input-form" value="1" min="1" max="100" required style="font-size:1.2rem; padding:10px; text-align:center" />
            </div>

            <button type="submit" class="btn btn-primary" style="width:100%; font-size:1.3rem; padding:15px; border-radius:10px">
              🖨️ MUDAR PARA TELA DE IMPRESSÃO
            </button>
          </form>
        </div>
      </div>
    `;
  },

  postRender() { },

  onProdutoSelecionado() {
    this.calcularValidade();
  },

  calcularValidade() {
    const select = document.getElementById('etiqProduto');
    const fabInput = document.getElementById('etiqFab');
    const valInput = document.getElementById('etiqVal');

    if (!select.value || !fabInput.value) return;

    // Achar o 'data-dias' da option selecionada
    const option = select.options[select.selectedIndex];
    const dias = parseInt(option.getAttribute('data-dias')) || 0;

    // Calcular data atual + dias
    const dt = new Date(fabInput.value); // Data vem no fuso UTC para inputs type="date"
    // Pulo de dias - adicionar offset UTC para evitar problemas de relógio de timezone local encurtar um dia no .toISOString
    dt.setUTCHours(12); // Pula pro meio do dia pra evitar que soma de dias troque o date na visualizacao final
    dt.setUTCDate(dt.getUTCDate() + dias);
    
    valInput.value = dt.toISOString().split('T')[0];
  },

  gerarImpressao(e) {
    e.preventDefault();

    const produtoId = document.getElementById('etiqProduto').value;
    const dtFabOrig = document.getElementById('etiqFab').value; // Formato YYYY-MM-DD
    const dtValOrig = document.getElementById('etiqVal').value;
    const lote = document.getElementById('etiqLote').value.trim();
    const qtd = parseInt(document.getElementById('etiqQtd').value) || 1;

    const p = DB.getProdutos().find(x => x.id === produtoId);
    if (!p) return alert("Produto não encontrado.");

    // Formatadores locais para aparecer bonito DD/MM/YYYY
    const brFormat = (strDate) => {
        const parts = strDate.split('-');
        return \`\${parts[2]}/\${parts[1]}/\${parts[0]}\`;
    };

    const fabFormat = brFormat(dtFabOrig);
    const valFormat = brFormat(dtValOrig);

    let htmlLabels = '';
    
    for (let i = 0; i < qtd; i++) {
        htmlLabels += `
           <div class="zebra-label">
             <div class="zebra-header" style="font-weight:900; font-family:Arial,sans-serif; text-align:center; font-size:15px; max-height: 20px; overflow:hidden; text-transform:uppercase; margin-bottom:5px; padding-bottom:2px; border-bottom:2px solid #000">${p.nome}</div>
             
             <div style="font-size:12px; font-family:Arial,sans-serif; display:flex; justify-content:space-between; align-items:center; margin-bottom:2px">
                <span>FAB: <strong style="font-size:14px">${fabFormat}</strong></span>
             </div>
             
             <div style="font-size:13px; font-family:Arial,sans-serif; display:flex; justify-content:space-between; align-items:center; border:2px solid #000; padding:2px; background:#000; color:#fff; border-radius:3px; margin:4px 0">
                <span style="font-weight:bold; margin-left:2px">VAL: </span>
                <strong style="font-size:16px; margin-right:2px">${valFormat}</strong>
             </div>
             
             <div style="display:flex; justify-content:space-between; font-size:11px; font-family:Arial,sans-serif; margin-top:5px; font-weight:bold;">
                 <span style="border: 1px solid #000; padding:1px 3px">${p.temperatura.substring(0,3).toUpperCase()}</span>
                 ${lote ? `<span style="border-bottom:1px dashed #000; padding-bottom:1px; max-width:80px; overflow:hidden">${lote}</span>` : '<span>ESPHIRRAS</span>'}
             </div>
           </div>
        `;
    }

    const printWin = window.open('', '_blank');
    printWin.document.write(`
      <html>
        <head>
          <title>Impressão Termica - ${p.nome}</title>
          <style>
             @page {
                size: 60mm 30mm;
                /* As margens devem ser cortadas ao extremo na térmica */
                margin: 0 !important;
             }
             body {
                margin: 0;
                padding: 0;
                background: #fff;
             }
             /* O tamanho exato do container da etiqueta pra simular a zebra */
             .zebra-label {
                width: 58mm;
                height: 28mm;
                page-break-after: always; /* Importante para impressoras de rolo, quebra página por etiqueta */
                box-sizing: border-box;
                padding: 2mm;
                margin: 0;
             }
             /* Oculte o botão ao imprimir */
             @media print {
                #btnImprimir { display: none; }
             }
          </style>
        </head>
        <body>
          <button id="btnImprimir" style="position:fixed; top:20px; right:20px; padding:15px; font-size:20px; background:blue; color:white; border:none; z-index:999; cursor:pointer" onclick="window.print()">IMPRIMIR AGORA</button>
          
          <div style="margin-top: 100px;" id="avisoTela">
             <div style="text-align:center;font-family:sans-serif;color:#555;padding:40px; border:2px dashed #ccc; width:300px; margin:0 auto">
                Se as etiquetas ficaram pequenas acima desta caixa, significa que o layout foi formatado com sucesso.<br><br>
                1. Certifique-se de escolher a impressora Zebra no Chrome.<br>
                2. Nas configurações de impressão do Chrome, defina Margens: "Nenhuma".<br>
                3. Tamanho do Papel: "User Defined" ou "60x30".<br>
             </div>
          </div>
          <style>@media print { #avisoTela { display:none; } body { margin-top: 0 !important; } }</style>
          
          ${htmlLabels}
          
          <script>
            // Abre o dialog imediatamente se quiser
            setTimeout(() => {
                document.getElementById('avisoTela').style.marginTop = '0px';
                window.print();
            }, 500);
          </script>
        </body>
      </html>
    `);

    printWin.document.close();
  }
};
