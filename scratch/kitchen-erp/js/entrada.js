/**
 * entrada.js — Módulo de Entrada de Produtos (Recebimento)
 */

const EntradaPage = {
  render() {
    const entradas = DB.getMovimentacoesPorTipo('entrada')
      .sort((a, b) => new Date(b.data) - new Date(a.data));

    return `
      <div class="page-header">
        <div>
          <h1>📥 Entrada de Produtos</h1>
          <p>Registro de recebimento de mercadorias e matérias-primas</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="EntradaPage.openImportarNFe()" title="Importar NF-e pela chave de acesso ou XML">
            📄 Importar NF-e
          </button>
          <button class="btn btn-primary" onclick="EntradaPage.openModal()">+ Registrar Entrada</button>
        </div>
      </div>

      <!-- Form Rápido -->
      <div class="card mb-16">
        <h3 style="font-size:.9rem;font-weight:600;color:var(--text-secondary);margin-bottom:16px">⚡ Entrada Rápida</h3>
        <form id="formEntradaRapida" onsubmit="EntradaPage.salvarRapido(event)">

          <!-- Campo de Código de Barras -->
          <div style="margin-bottom:16px;padding:14px 16px;background:var(--bg-input);border:1px solid var(--border);border-radius:var(--radius-sm)">
            <label style="font-size:.75rem;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:.6px;display:block;margin-bottom:8px">
              📦 Código de Barras — leitor USB, Bluetooth ou manual
            </label>
            <div style="display:flex;gap:8px;align-items:center">
              <div style="position:relative;flex:1">
                <svg style="position:absolute;left:10px;top:50%;transform:translateY(-50%);opacity:.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/><rect x="3" y="16" width="5" height="5"/><rect x="16" y="16" width="5" height="5"/></svg>
                <input type="text" id="erBarcode"
                  placeholder="Aponte o leitor aqui ou digite o código..."
                  style="padding-left:34px;width:100%;box-sizing:border-box;font-family:monospace;font-size:.95rem;letter-spacing:1px"
                  oninput="EntradaPage.onBarcodeInput(this.value)"
                  onkeydown="if(event.key==='Enter'){event.preventDefault();EntradaPage.buscarPorBarcode();}" />
              </div>
              <button type="button" class="btn btn-primary" onclick="EntradaPage.buscarPorBarcode()" style="white-space:nowrap;min-width:80px">
                🔍 Buscar
              </button>
              <button type="button" class="btn btn-secondary" onclick="EntradaPage.scanEntrada()" title="Usar câmera" style="white-space:nowrap">
                📷 Câmera
              </button>
            </div>
            <div id="erBarcodeStatus" style="margin-top:8px;font-size:.8rem;min-height:18px"></div>
          </div>

          <!-- Restante do formulário -->
          <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end">
            <div class="form-group" style="flex:2;min-width:200px">
              <label>Produto *</label>
              <select id="erProduto" required onchange="EntradaPage.onProdutoChange()">
                <option value="">Selecione ou escaneie...</option>
                ${DB.getProdutos().sort((a,b)=>a.nome.localeCompare(b.nome)).map(p =>
                  '<option value="' + p.id + '">' + p.nome + ' (Est: ' + parseFloat(p.estoque||0).toFixed(1) + ' ' + p.unidade + ')</option>'
                ).join('')}
              </select>
            </div>
            <div class="form-group" style="flex:0.7;min-width:100px">
              <label>Quantidade *</label>
              <input type="number" id="erQtd" required min="0.001" step="0.001" placeholder="0"
                oninput="EntradaPage.onQtdManualChange()" />
            </div>
            <div class="form-group" style="flex:1;min-width:130px">
              <label>Custo Unitário (R$)</label>
              <input type="number" id="erCusto" min="0" step="0.01" placeholder="Opcional" />
            </div>
            <div class="form-group" style="flex:1;min-width:130px">
              <label>Fornecedor</label>
              <input type="text" id="erFornecedor" placeholder="Nome" />
            </div>
            <div class="form-group" style="flex:1;min-width:130px">
              <label>Nº Nota Fiscal</label>
              <input type="text" id="erNF" placeholder="Opcional" />
            </div>
            <div class="form-group" style="flex:1;min-width:130px">
              <label>Validade do Lote</label>
              <input type="date" id="erValidade" />
            </div>
            <button type="submit" class="btn btn-primary" style="align-self:flex-end;white-space:nowrap">
              📥 Registrar
            </button>
          </div>

          <!-- Painel de Forma de Entrega (aparece quando produto tem unidade configurada) -->
          <div id="erUnidadePanel" style="display:none;margin-top:16px;padding:14px 16px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.3);border-radius:var(--radius-sm)">
            <div style="font-size:.75rem;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px">
              📦 Entrada por Unidade de Entrega
            </div>
            <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
              <div>
                <label style="font-size:.8rem;color:var(--text-secondary)">Quantas <span id="erFormaLabel">unidades</span> chegaram?</label>
                <div style="display:flex;gap:8px;align-items:center;margin-top:4px">
                  <input type="number" id="erUnidades" min="1" step="1" placeholder="Ex: 2"
                    style="width:90px"
                    oninput="EntradaPage.calcularPorUnidade()" />
                  <span id="erUnidadeNome" style="font-size:.9rem;font-weight:600;color:var(--accent)">caixas</span>
                </div>
              </div>
              <div style="font-size:1.4rem;color:var(--text-muted)">×</div>
              <div>
                <label style="font-size:.8rem;color:var(--text-secondary)">Qtd por unidade</label>
                <div style="font-size:1.1rem;font-weight:700;color:var(--text-primary);padding-top:8px">
                  <span id="erQtdPorUnidade">0</span> <span id="erUnidadeMedida">kg</span>
                </div>
              </div>
              <div style="font-size:1.4rem;color:var(--text-muted)">=</div>
              <div style="background:var(--bg-card);border-radius:8px;padding:10px 20px;text-align:center">
                <div style="font-size:.72rem;color:var(--text-muted)">Total a adicionar</div>
                <div style="font-size:1.5rem;font-weight:800;color:var(--accent)" id="erTotalCalc">0</div>
                <div style="font-size:.78rem;color:var(--text-secondary)" id="erTotalUnid">kg</div>
              </div>
              <button type="button" class="btn btn-primary" onclick="EntradaPage.aplicarCalculo()" style="align-self:flex-end">
                ✅ Aplicar
              </button>
            </div>
          </div>

        </form>
      </div>

      <!-- Histórico de Entradas -->
      <div class="table-container">
        <div class="table-toolbar">
          <div style="font-weight:600;font-size:.9rem">Histórico de Entradas</div>
          <div class="table-actions">
            <span style="font-size:.8rem;color:var(--text-muted)">${entradas.length} registros</span>
          </div>
        </div>
        ${entradas.length === 0 ?
          `<div class="empty-state"><div class="empty-icon">📥</div><h3>Nenhuma entrada registrada</h3><p>Use o formulário acima para registrar entradas</p></div>` :
          `<div style="max-height:360px;overflow-y:auto">
            <table>
              <thead><tr><th>Data/Hora</th><th>Produto</th><th>Quantidade</th><th>Custo Unit.</th><th>Total</th><th>Fornecedor</th><th>NF</th><th>Validade</th><th>Lote</th></tr></thead>
              <tbody>
                ${entradas.slice(0, 50).map(e => {
                  const p = DB.getProdutoPorId(e.produtoId);
                  return `<tr>
                    <td style="font-size:.8rem;white-space:nowrap">${new Date(e.data).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'})}</td>
                    <td><strong>${p?.nome || e.produtoNome || '—'}</strong></td>
                    <td class="text-accent fw-bold">${e.quantidade} ${p?.unidade||''}</td>
                    <td>R$ ${parseFloat(e.custo||0).toFixed(2)}</td>
                    <td>R$ ${(parseFloat(e.custo||0) * parseFloat(e.quantidade||0)).toFixed(2)}</td>
                    <td style="font-size:.82rem">${e.fornecedor||'—'}</td>
                    <td style="font-size:.78rem">${e.notaFiscal||'—'}</td>
                    <td style="font-size:.78rem">${e.validade||'—'}</td>
                    <td><code style="font-size:.7rem;color:var(--text-muted)">${e.lote||'—'}</code></td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>`
        }
      </div>
    `;
  },

  scanEntrada() {
    BarcodeScanner.open(function(codigo) {
      var p = DB.getProdutoPorCodigo(codigo);
      if (p) {
        var sel = document.getElementById('erProduto');
        if (sel) {
          sel.value = p.id;
          EntradaPage._setBarcodeStatus('success', '✅ Produto encontrado: ' + p.nome);
          App.showToast('Produto: ' + p.nome, 'success');
        } else {
          EntradaPage.openModal(p.id);
        }
      } else {
        App.showToast('Código não encontrado', 'warning');
        EntradaPage._setBarcodeStatus('warn', '⚠️ Código não encontrado: ' + codigo);
      }
    });
  },

  // Chamado enquanto o usuário digita — detecta leitura rápida do scanner (termina em Enter automaticamente)
  _barcodeTimer: null,
  onBarcodeInput: function(val) {
    // Leitores USB enviam o código inteiro em ~100ms. Se o campo tiver 5+ chars e parar de receber
    // input por 300ms, faz a busca automaticamente (sem precisar apertar Enter)
    clearTimeout(EntradaPage._barcodeTimer);
    if (val.length >= 4) {
      EntradaPage._barcodeTimer = setTimeout(function() {
        EntradaPage.buscarPorBarcode();
      }, 300);
    }
  },

  buscarPorBarcode: function() {
    var input = document.getElementById('erBarcode');
    if (!input) return;
    var codigo = input.value.trim();
    if (!codigo) return;

    var p = DB.getProdutoPorCodigo(codigo);
    if (p) {
      var sel = document.getElementById('erProduto');
      if (sel) sel.value = p.id;
      EntradaPage._setBarcodeStatus('success', '✅ Produto encontrado: <strong>' + p.nome + '</strong> — Estoque: ' + parseFloat(p.estoque||0).toFixed(2) + ' ' + p.unidade);
      EntradaPage._atualizarPainelUnidade(p);
      var qtdEl = document.getElementById('erQtd');
      if (qtdEl && !qtdEl.value) { setTimeout(function(){ qtdEl.focus(); qtdEl.select(); }, 50); }
    } else {
      EntradaPage._setBarcodeStatus('warn', '⚠️ Nenhum produto com o código: <strong>' + codigo + '</strong>');
    }
  },

  _setBarcodeStatus: function(tipo, msg) {
    var el = document.getElementById('erBarcodeStatus');
    if (!el) return;
    var cor = tipo === 'success' ? '#10b981' : tipo === 'warn' ? '#f59e0b' : '#ef4444';
    el.innerHTML = '<span style="color:' + cor + '">' + msg + '</span>';
  },

  // Chamado quando o produto é selecionado no dropdown
  onProdutoChange: function() {
    var sel = document.getElementById('erProduto');
    if (!sel || !sel.value) {
      var panel = document.getElementById('erUnidadePanel');
      if (panel) panel.style.display = 'none';
      return;
    }
    var p = DB.getProdutoPorId(sel.value);
    if (!p) return;
    EntradaPage._atualizarPainelUnidade(p);
  },

  _atualizarPainelUnidade: function(p) {
    var panel = document.getElementById('erUnidadePanel');
    if (!panel) return;
    var qtdPor = parseFloat(p.qtdPorUnidade || 0);
    if (qtdPor <= 0) {
      panel.style.display = 'none';
      return;
    }
    panel.style.display = 'block';
    var forma = p.formaEntrega || 'Unidade';
    var unid  = p.unidade || 'kg';
    var formaLabel  = document.getElementById('erFormaLabel');
    var unidadeNome = document.getElementById('erUnidadeNome');
    var qtdSpan     = document.getElementById('erQtdPorUnidade');
    var medSpan     = document.getElementById('erUnidadeMedida');
    var totalUnid   = document.getElementById('erTotalUnid');
    if (formaLabel)  formaLabel.textContent  = forma;
    if (unidadeNome) unidadeNome.textContent = forma + (forma.slice(-1) === 'a' ? 's' : 's');
    if (qtdSpan)     qtdSpan.textContent     = qtdPor;
    if (medSpan)     medSpan.textContent     = unid;
    if (totalUnid)   totalUnid.textContent   = unid;
    // Limpa o campo de unidades
    var erUnidades = document.getElementById('erUnidades');
    if (erUnidades) erUnidades.value = '';
    var erTotal = document.getElementById('erTotalCalc');
    if (erTotal) erTotal.textContent = '0';
  },

  calcularPorUnidade: function() {
    var prodSel = document.getElementById('erProduto');
    if (!prodSel || !prodSel.value) return;
    var p = DB.getProdutoPorId(prodSel.value);
    if (!p) return;
    var qtdPor = parseFloat(p.qtdPorUnidade || 0);
    var nUnid  = parseFloat((document.getElementById('erUnidades') || {}).value) || 0;
    var total  = qtdPor * nUnid;
    var el     = document.getElementById('erTotalCalc');
    if (el) el.textContent = total % 1 === 0 ? total : total.toFixed(3);
  },

  aplicarCalculo: function() {
    var prodSel = document.getElementById('erProduto');
    if (!prodSel || !prodSel.value) { App.showToast('Selecione um produto primeiro', 'warning'); return; }
    var p = DB.getProdutoPorId(prodSel.value);
    if (!p) return;
    var qtdPor = parseFloat(p.qtdPorUnidade || 0);
    var nUnid  = parseFloat((document.getElementById('erUnidades') || {}).value) || 0;
    if (nUnid <= 0) { App.showToast('Informe quantas ' + (p.formaEntrega || 'unidades') + ' chegaram', 'warning'); return; }
    var total = qtdPor * nUnid;
    var qtdEl = document.getElementById('erQtd');
    if (qtdEl) { qtdEl.value = total % 1 === 0 ? total : total.toFixed(3); }
    App.showToast(nUnid + ' ' + (p.formaEntrega || 'unidade(s)') + ' = ' + total + ' ' + p.unidade + ' aplicados!', 'success');
  },

  onQtdManualChange: function() {
    // Se o usuário digitou a quantidade manualmente, limpa o campo de unidades para evitar confusão
    var erUnidades = document.getElementById('erUnidades');
    if (erUnidades) erUnidades.value = '';
    var erTotal = document.getElementById('erTotalCalc');
    if (erTotal) erTotal.textContent = '0';
  },

  salvarRapido(e) {
    e.preventDefault();
    const produtoId = document.getElementById('erProduto').value;
    const quantidade = parseFloat(document.getElementById('erQtd').value);
    const custo = parseFloat(document.getElementById('erCusto').value) || 0;
    const fornecedor = document.getElementById('erFornecedor').value.trim();
    const notaFiscal = document.getElementById('erNF').value.trim();
    const validade = document.getElementById('erValidade').value;

    const produto = DB.getProdutoPorId(produtoId);
    if (!produto || !quantidade) return;

    const lote = DB._gerarLote();
    DB.addMovimentacao({
      tipo: 'entrada',
      produtoId,
      produtoNome: produto.nome,
      quantidade,
      custo,
      fornecedor,
      notaFiscal,
      validade,
      lote
    });

    // Criar lote de armazenamento
    if (validade || true) {
      DB.addLote({
        produtoId,
        produtoNome: produto.nome,
        lote,
        quantidadeInicial: quantidade,
        quantidadeAtual: quantidade,
        local: produto.local || 'Câmara Seca',
        validade,
        fornecedor,
        notaFiscal
      });
    }

    // Atualizar custo unitário se fornecido
    if (custo > 0) {
      DB.updateProduto(produtoId, { custo });
    }

    // Atualizar badge
    const badgeEl = document.getElementById('badge-entrada');
    if (badgeEl) {
      const tot = parseInt(badgeEl.textContent || '0') + 1;
      badgeEl.textContent = tot;
      badgeEl.classList.add('visible');
    }

    App.showToast(`Entrada de ${quantidade} ${produto.unidade} de "${produto.nome}" registrada!`, 'success');
    e.target.reset();
    App.navigateTo('entrada');
  },

  openModal(produtoId = null) {
    const produtos = DB.getProdutos().sort((a,b) => a.nome.localeCompare(b.nome));
    const body = `
      <form id="formEntradaCompleto" onsubmit="EntradaPage.salvarCompleto(event)">
        <div class="form-grid">
          <div class="form-group full-width">
            <label>Produto *</label>
            <div class="input-group">
              <select id="ecProduto" required>
                <option value="">Selecione o produto...</option>
                ${produtos.map(p => `<option value="${p.id}" ${produtoId===p.id?'selected':''}>${p.nome} (Est: ${parseFloat(p.estoque||0).toFixed(1)} ${p.unidade})</option>`).join('')}
              </select>
              <button type="button" class="btn btn-secondary" onclick="EntradaPage.scanCompleto()">📷</button>
            </div>
          </div>
          <div class="form-group">
            <label>Quantidade *</label>
            <input type="number" id="ecQtd" required min="0.001" step="0.001" placeholder="0" />
          </div>
          <div class="form-group">
            <label>Custo Unitário (R$)</label>
            <input type="number" id="ecCusto" min="0" step="0.01" placeholder="0.00" />
          </div>
          <div class="form-group">
            <label>Fornecedor</label>
            <input type="text" id="ecFornecedor" placeholder="Nome do fornecedor" />
          </div>
          <div class="form-group">
            <label>Nota Fiscal</label>
            <input type="text" id="ecNF" placeholder="Nº da NF" />
          </div>
          <div class="form-group">
            <label>Data de Validade do Lote</label>
            <input type="date" id="ecValidade" />
          </div>
          <div class="form-group">
            <label>Local de Armazenamento</label>
            <select id="ecLocal">
              ${['Câmara Fria','Câmara Seca','Despensa','Congelador','Prateleira','Adega'].map(l=>`<option>${l}</option>`).join('')}
            </select>
          </div>
          <div class="form-group full-width">
            <label>Observações</label>
            <textarea id="ecObs" placeholder="Informações adicionais da entrada..."></textarea>
          </div>
        </div>
        <input type="submit" style="display:none" />
      </form>
    `;
    App.openModal('Registrar Entrada', body, [
      { label: 'Cancelar', class: 'btn-secondary', action: 'App.closeModal()' },
      { label: '📥 Registrar Entrada', class: 'btn-primary', action: `document.getElementById('formEntradaCompleto').requestSubmit()` }
    ]);
  },

  scanCompleto() {
    BarcodeScanner.open((codigo) => {
      const p = DB.getProdutoPorCodigo(codigo);
      if (p) {
        const sel = document.getElementById('ecProduto');
        if (sel) sel.value = p.id;
      }
    });
  },

  salvarCompleto(e) {
    e.preventDefault();
    const produtoId = document.getElementById('ecProduto').value;
    const quantidade = parseFloat(document.getElementById('ecQtd').value);
    const custo = parseFloat(document.getElementById('ecCusto').value) || 0;
    const fornecedor = document.getElementById('ecFornecedor').value.trim();
    const notaFiscal = document.getElementById('ecNF').value.trim();
    const validade = document.getElementById('ecValidade').value;
    const local = document.getElementById('ecLocal').value;
    const obs = document.getElementById('ecObs').value.trim();

    const produto = DB.getProdutoPorId(produtoId);
    if (!produto || !quantidade) return;

    const lote = DB._gerarLote();
    DB.addMovimentacao({ tipo: 'entrada', produtoId, produtoNome: produto.nome, quantidade, custo, fornecedor, notaFiscal, validade, lote, observacao: obs });
    DB.addLote({ produtoId, produtoNome: produto.nome, lote, quantidadeInicial: quantidade, quantidadeAtual: quantidade, local, validade, fornecedor, notaFiscal });
    if (custo > 0) DB.updateProduto(produtoId, { custo, local });

    App.showToast('Entrada registrada com sucesso!', 'success');
    App.closeModal();
    App.navigateTo('entrada');
  },

  postRender() {},

  // ═══════════════════════════════════════════════════════════
  // IMPORTAÇÃO NF-e
  // ═══════════════════════════════════════════════════════════

  openImportarNFe: function() {
    var body = '<div style="display:flex;flex-direction:column;gap:20px">'

    + '<div>'
    + '<div class="form-section-title">🔑 Busca pela Chave de Acesso</div>'
    + '<div class="form-group">'
    + '<label>Chave de Acesso NF-e (44 dígitos)</label>'
    + '<input type="text" id="nfeChave" maxlength="59" inputmode="numeric"'
    + ' placeholder="0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 00"'
    + ' style="font-family:monospace;font-size:.9rem;letter-spacing:1px"'
    + ' oninput="EntradaPage.formatarChave(this)" />'
    + '<span class="form-hint">Localizada na DANFE (nota impressa), abaixo do código de barras</span>'
    + '</div>'
    + '<div id="nfeChaveInfo" style="font-size:.8rem;color:var(--text-muted);min-height:20px"></div>'
    + '<button class="btn btn-primary" onclick="EntradaPage.buscarNFePorChave()" style="margin-top:8px">🔍 Buscar NF-e na Internet</button>'
    + '</div>'

    + '<div style="display:flex;align-items:center;gap:12px;color:var(--text-muted);font-size:.82rem">'
    + '<div style="flex:1;height:1px;background:var(--border)"></div><span>ou</span><div style="flex:1;height:1px;background:var(--border)"></div>'
    + '</div>'

    + '<div>'
    + '<div class="form-section-title">📂 Importar XML da NF-e</div>'
    + '<p style="font-size:.82rem;color:var(--text-secondary);margin-bottom:12px">Seu fornecedor envia o XML da NF-e por e-mail. Salve o arquivo e importe aqui.</p>'
    + '<label style="display:inline-flex;align-items:center;gap:8px;background:var(--bg-input);border:2px dashed var(--border);border-radius:var(--radius-sm);padding:16px 24px;cursor:pointer;font-size:.9rem;color:var(--text-secondary)">'
    + '<span style="font-size:1.5rem">📁</span><span>Clique para selecionar o arquivo XML</span>'
    + '<input type="file" id="nfeXMLFile" accept=".xml,text/xml" style="display:none" onchange="EntradaPage.processarXmlFile(this)">'
    + '</label>'
    + '<div id="nfeXMLStatus" style="margin-top:8px;font-size:.82rem;min-height:18px"></div>'
    + '</div>'

    + '<div id="nfeProcessingStatus" style="display:none;padding:16px;background:var(--bg-input);border-radius:8px;text-align:center">'
    + '<div style="font-size:1.2rem;margin-bottom:8px">⏳</div>'
    + '<div id="nfeStatusMsg" style="font-size:.85rem;color:var(--text-secondary)">Buscando NF-e...</div>'
    + '</div>'

    + '</div>';

    App.openModal('📄 Importar Nota Fiscal Eletrônica', body, [
      { label: 'Fechar', class: 'btn-secondary', action: 'App.closeModal()' }
    ], 'modal-lg');
  },

  formatarChave: function(input) {
    var nums = input.value.replace(/\D/g, '').substr(0, 44);
    var fmt  = nums.match(/.{1,4}/g);
    input.value = fmt ? fmt.join(' ') : nums;
    var infoEl = document.getElementById('nfeChaveInfo');
    if (!infoEl) return;
    if (nums.length === 44) {
      infoEl.innerHTML = '<span style="color:var(--accent)">✅ Chave válida — ' + EntradaPage._extrairInfoChave(nums) + '</span>';
    } else {
      infoEl.innerHTML = nums.length > 0 ? '<span style="color:var(--text-muted)">' + nums.length + '/44 dígitos</span>' : '';
    }
  },

  _extrairInfoChave: function(chave) {
    var estados = {'11':'RO','12':'AC','13':'AM','14':'RR','15':'PA','16':'AP','17':'TO','21':'MA','22':'PI','23':'CE','24':'RN','25':'PB','26':'PE','27':'AL','28':'SE','29':'BA','31':'MG','32':'ES','33':'RJ','35':'SP','41':'PR','42':'SC','43':'RS','50':'MS','51':'MT','52':'GO','53':'DF'};
    var cuf = chave.substr(0,2), aamm = chave.substr(2,4), cnpj = chave.substr(6,14), mod = chave.substr(20,2);
    var nNF = parseInt(chave.substr(25,9));
    var uf  = estados[cuf] || 'UF'+cuf;
    var modelo = mod === '65' ? 'NFC-e' : 'NF-e';
    return modelo + ' nº ' + nNF + ' | ' + uf + ' | ' + aamm.substr(2,2) + '/20' + aamm.substr(0,2) + ' | CNPJ: ' + cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,'$1.$2.$3/$4-$5');
  },

  buscarNFePorChave: function() {
    var input = document.getElementById('nfeChave');
    if (!input) return;
    var chave = input.value.replace(/\D/g, '');
    if (chave.length !== 44) { App.showToast('Chave de acesso deve ter 44 dígitos', 'warning'); return; }
    EntradaPage._setNFeStatus(true, 'Conectando ao portal SEFAZ...');
    var urls = [
      'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://www.nfe.fazenda.gov.br/portal/downloadNFe.aspx?chave=' + chave + '&tipo=XML'),
      'https://corsproxy.io/?' + encodeURIComponent('https://nfe.fazenda.gov.br/portal/downloadNFe.aspx?chave=' + chave + '&tipo=XML')
    ];
    EntradaPage._tentarUrls(urls, 0, chave);
  },

  _tentarUrls: function(urls, idx, chave) {
    if (idx >= urls.length) {
      EntradaPage._setNFeStatus(false);
      App.showToast('Não foi possível buscar automaticamente — use o upload do XML.', 'warning');
      window.open('https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx?tipoConsulta=resumo&tipoConteudo=7PhJ+gAVw2g=&nfe=' + chave, '_blank');
      return;
    }
    EntradaPage._setNFeStatus(true, 'Tentativa ' + (idx+1) + '/' + urls.length + '...');
    fetch(urls[idx], { signal: AbortSignal.timeout(10000) })
      .then(function(r) { return r.text(); })
      .then(function(txt) {
        if (txt && (txt.includes('<nfeProc') || txt.includes('<NFe'))) {
          EntradaPage._setNFeStatus(false);
          EntradaPage._processarXmlText(txt);
        } else { EntradaPage._tentarUrls(urls, idx+1, chave); }
      })
      .catch(function() { EntradaPage._tentarUrls(urls, idx+1, chave); });
  },

  processarXmlFile: function(input) {
    if (!input || !input.files || !input.files[0]) return;
    var file = input.files[0];
    var statusEl = document.getElementById('nfeXMLStatus');
    if (statusEl) statusEl.innerHTML = '<span style="color:var(--text-secondary)">📖 Lendo <strong>' + file.name + '</strong>...</span>';
    var reader = new FileReader();
    reader.onload = function(e) { EntradaPage._processarXmlText(e.target.result); };
    reader.onerror = function() { if (statusEl) statusEl.innerHTML = '<span style="color:#ef4444">❌ Erro ao ler o arquivo</span>'; };
    reader.readAsText(file, 'UTF-8');
  },

  _processarXmlText: function(xmlStr) {
    var parser = new DOMParser();
    var doc    = parser.parseFromString(xmlStr, 'application/xml');
    var infNFe = doc.querySelector('infNFe') || doc.getElementsByTagName('infNFe')[0];
    if (!infNFe) { App.showToast('XML inválido ou não é uma NF-e', 'danger'); return; }

    var getVal = function(root, tag) {
      var found = root.querySelector ? root.querySelector(tag) : null;
      if (!found) { var els = root.getElementsByTagName(tag); found = els && els[0] ? els[0] : null; }
      return found ? found.textContent.trim() : '';
    };

    var emitente = getVal(doc, 'xNome') || 'Fornecedor';
    var nNF      = getVal(doc, 'nNF');
    var dEmi     = (getVal(doc, 'dEmi') || getVal(doc, 'dhEmi') || '').substr(0,10);

    var detEls = doc.querySelectorAll ? doc.querySelectorAll('det') : doc.getElementsByTagName('det');
    var itens  = [];
    for (var d = 0; d < detEls.length; d++) {
      var det = detEls[d];
      var xProd = getVal(det,'xProd'), cEAN = getVal(det,'cEAN');
      var qCom  = parseFloat(getVal(det,'qCom') || '0');
      var vUnCom = parseFloat(getVal(det,'vUnCom') || '0');
      var uCom  = getVal(det,'uCom');
      if (!xProd || qCom <= 0) continue;
      itens.push({ xProd:xProd, cEAN:cEAN, qCom:qCom, vUnCom:vUnCom, uCom:uCom, prodMatch: EntradaPage._matchProduto(cEAN, xProd) });
    }

    if (itens.length === 0) { App.showToast('Nenhum item encontrado no XML', 'warning'); return; }
    App.closeModal();
    setTimeout(function() { EntradaPage._exibirPreviewNFe(emitente, nNF, dEmi, itens); }, 200);
  },

  _matchProduto: function(cEAN, xProd) {
    var produtos = DB.getProdutos();
    if (cEAN && cEAN.length > 3 && cEAN !== 'SEM GTIN') {
      var byEAN = null;
      for (var i = 0; i < produtos.length; i++) { if (produtos[i].codigoBarras === cEAN) { byEAN = produtos[i]; break; } }
      if (byEAN) return { produto: byEAN, metodo: 'EAN', confianca: 100 };
    }
    var norm = function(s) { return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,'').trim(); };
    var nomeNF = norm(xProd);
    var melhor = null, melhorScore = 0;
    produtos.forEach(function(p) {
      var words1 = nomeNF.split(' ').filter(function(w){return w.length>2;});
      var words2 = norm(p.nome).split(' ').filter(function(w){return w.length>2;});
      var comuns = words1.filter(function(w){return words2.indexOf(w)>=0;}).length;
      var score  = words1.length > 0 ? comuns / words1.length * 100 : 0;
      if (score > melhorScore && score >= 40) { melhorScore = score; melhor = p; }
    });
    return melhor ? { produto: melhor, metodo: 'Nome', confianca: Math.round(melhorScore) } : null;
  },

  _exibirPreviewNFe: function(emitente, nNF, dEmi, itens) {
    var prodOptions = function(selId) {
      return DB.getProdutos().sort(function(a,b){return a.nome.localeCompare(b.nome);}).map(function(p) {
        return '<option value="' + p.id + '">' + p.nome + '</option>';
      }).join('');
    };

    var rows = itens.map(function(item, idx) {
      var match    = item.prodMatch;
      var selVal   = match ? match.produto.id : '';
      var opts     = '<option value="">— Ignorar —</option>' + DB.getProdutos().sort(function(a,b){return a.nome.localeCompare(b.nome);}).map(function(p){ return '<option value="' + p.id + '"' + (p.id===selVal?' selected':'') + '>' + p.nome + '</option>'; }).join('');

      var vinculoCell;
      if (match) {
        vinculoCell = '<span style="color:var(--accent);font-size:.72rem">✅ ' + match.produto.nome + ' (' + match.metodo + ' ' + match.confianca + '%)</span>'
          + '<br><select id="nfeProdSel_'+idx+'" style="font-size:.75rem;padding:3px;width:100%;margin-top:4px">' + opts + '</select>';
      } else {
        vinculoCell = '<div id="nfeCadastroArea_'+idx+'" style="display:flex;flex-direction:column;gap:6px">'
          + '<button type="button" onclick="EntradaPage.cadastrarProdutoNFe('+idx+')"'
          + ' style="background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;border:none;border-radius:6px;'
          + 'padding:6px 10px;font-size:.75rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:5px;width:fit-content">'
          + '<span style="font-size:.9rem">➕</span> Cadastrar Produto</button>'
          + '<span style="color:#f59e0b;font-size:.7rem">⚠️ Não encontrado no sistema</span>'
          + '<select id="nfeProdSel_'+idx+'" style="font-size:.75rem;padding:3px;width:100%">' + opts + '</select>'
          + '</div>';
      }

      return '<tr id="nfeRow_'+idx+'">'
        + '<td style="font-size:.78rem">' + item.xProd + (item.cEAN && item.cEAN.length>3 ? '<br><code style="font-size:.68rem;color:var(--text-muted)">EAN: '+item.cEAN+'</code>' : '') + '</td>'
        + '<td style="font-weight:700">' + item.qCom + ' ' + item.uCom + '</td>'
        + '<td>R$ ' + item.vUnCom.toFixed(2) + '</td>'
        + '<td id="nfeVinculoCell_'+idx+'">' + vinculoCell + '</td>'
        + '<td style="text-align:center"><input type="checkbox" id="nfeCheck_'+idx+'" '+(match?'checked':'')+' style="width:18px;height:18px;cursor:pointer"></td>'
        + '</tr>';
    }).join('');

    var dataFmt = dEmi ? dEmi.split('-').reverse().join('/') : '—';
    var body = '<div><div style="display:flex;gap:24px;flex-wrap:wrap;padding:12px 16px;background:var(--bg-input);border-radius:8px;margin-bottom:16px">'
      + '<div><div style="font-size:.7rem;color:var(--text-muted)">FORNECEDOR</div><div style="font-weight:700">' + emitente + '</div></div>'
      + '<div><div style="font-size:.7rem;color:var(--text-muted)">NF-e Nº</div><div style="font-weight:700">' + (nNF||'—') + '</div></div>'
      + '<div><div style="font-size:.7rem;color:var(--text-muted)">EMISSÃO</div><div style="font-weight:700">' + dataFmt + '</div></div>'
      + '<div><div style="font-size:.7rem;color:var(--text-muted)">ITENS</div><div style="font-weight:700">' + itens.length + '</div></div>'
      + '</div>'
      + '<div style="max-height:360px;overflow-y:auto"><table><thead><tr><th>Produto na NF-e</th><th>Qtd</th><th>Custo Unit.</th><th>Vincular ao cadastro</th><th>✔</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
      + '<p style="margin-top:12px;font-size:.78rem;color:var(--text-secondary)">Marque os itens a importar e vincule cada produto da NF ao cadastro do sistema. Itens não vinculados são ignorados.</p>'
      + '</div>';

    window._nfeItens = itens;
    window._nfeMeta  = { emitente: emitente, nNF: nNF };

    App.openModal('📋 Prévia NF-e — Confirmar Importação', body, [
      { label: 'Cancelar', class: 'btn-secondary', action: 'App.closeModal()' },
      { label: '📥 Importar Selecionados', class: 'btn-primary', action: 'EntradaPage.confirmarImportacaoNFe()' }
    ], 'modal-lg');
  },

  confirmarImportacaoNFe: function() {
    var itens = window._nfeItens || [], meta = window._nfeMeta || {}, count = 0;
    itens.forEach(function(item, idx) {
      var chk   = document.getElementById('nfeCheck_' + idx);
      var selEl = document.getElementById('nfeProdSel_' + idx);
      if (!chk || !chk.checked || !selEl || !selEl.value) return;
      var produto = DB.getProdutoPorId(selEl.value);
      if (!produto) return;
      var lote = DB._gerarLote();
      DB.addMovimentacao({ tipo:'entrada', produtoId:produto.id, produtoNome:produto.nome, quantidade:item.qCom, custo:item.vUnCom, fornecedor:meta.emitente||'', notaFiscal:meta.nNF||'', validade:'', lote:lote, observacao:'Importado NF-e: '+item.xProd });
      DB.addLote({ produtoId:produto.id, produtoNome:produto.nome, lote:lote, quantidadeInicial:item.qCom, quantidadeAtual:item.qCom, local:produto.local||'Câmara Seca', validade:'', fornecedor:meta.emitente||'', notaFiscal:meta.nNF||'' });
      if (item.vUnCom > 0) DB.updateProduto(produto.id, { custo: item.vUnCom });
      count++;
    });
    App.closeModal();
    App.showToast(count > 0 ? '✅ ' + count + ' produto(s) importados da NF-e!' : 'Nenhum item importado.', count > 0 ? 'success' : 'warning');
    App.navigateTo('entrada');
  },

  // Abre modal de cadastro rápido usando dados da NF-e, e após salvar atualiza o select da linha
  cadastrarProdutoNFe: function(idx) {
    var item = (window._nfeItens || [])[idx];
    if (!item) return;

    // Normaliza unidade NF-e → sistema
    var unitMap = {'KG':'kg','G':'g','L':'L','ML':'ml','UN':'un','CX':'cx','PCT':'pct','FD':'fardo','PC':'pct','DZ':'dz'};
    var unidade = unitMap[(item.uCom||'').toUpperCase()] || 'kg';
    var unidades = ['kg','g','L','ml','un','cx','fardo','pct','dz'];
    var unidOpts = unidades.map(function(u){ return '<option value="'+u+'"'+(u===unidade?' selected':'')+'>'+u+'</option>'; }).join('');

    var categorias = ['Carnes','Hortifruti','Laticínios','Grãos e Cereais','Condimentos','Bebidas','Embalagens','Higiene/Limpeza','Outros'];
    var catOpts = categorias.map(function(c){ return '<option value="'+c+'">'+c+'</option>'; }).join('');

    // Nome tratado: capitaliza primeira letra de cada palavra
    var nomeFormatado = item.xProd.toLowerCase().replace(/\b\w/g, function(l){ return l.toUpperCase(); });

    var body = '<form id="formCadAutoNFe" onsubmit="return false">'
      + '<div style="background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.3);border-radius:8px;padding:12px;margin-bottom:16px;font-size:.8rem">'
      + '<strong style="color:#818cf8">📄 Dados da NF-e:</strong> ' + item.xProd
      + (item.cEAN && item.cEAN.length>3 ? ' &nbsp;|&nbsp; EAN: <code>'+item.cEAN+'</code>' : '')
      + ' &nbsp;|&nbsp; ' + item.qCom + ' ' + item.uCom + ' &nbsp;|&nbsp; R$ ' + item.vUnCom.toFixed(2)
      + '</div>'
      + '<div class="form-grid">'
      + '<div class="form-group"><label>Nome do Produto *</label><input type="text" id="cadAutoNome" required value="'+nomeFormatado+'" /></div>'
      + '<div class="form-group"><label>Categoria *</label><select id="cadAutoCat" required><option value="">Selecione...</option>'+catOpts+'</select></div>'
      + '<div class="form-group"><label>Código de Barras EAN</label><input type="text" id="cadAutoEAN" value="'+(item.cEAN && item.cEAN.length>3 ? item.cEAN : '')+'" style="font-family:monospace" /></div>'
      + '<div class="form-group"><label>Unidade de Medida *</label><select id="cadAutoUnidade" required>'+unidOpts+'</select></div>'
      + '<div class="form-group"><label>Custo Unitário (R$)</label><input type="number" id="cadAutoCusto" min="0" step="0.01" value="'+item.vUnCom.toFixed(2)+'" /></div>'
      + '<div class="form-group"><label>Fornecedor</label><input type="text" id="cadAutoFornecedor" value="'+(window._nfeMeta && window._nfeMeta.emitente ? window._nfeMeta.emitente : '')+'" /></div>'
      + '</div>'
      + '</form>';

    App.openModal('➕ Cadastrar Produto da NF-e', body, [
      { label: 'Cancelar', class: 'btn-secondary', action: 'App.closeModal()' },
      { label: '✅ Cadastrar e Vincular', class: 'btn-primary',
        action: 'EntradaPage._salvarCadastroAutoNFe(' + idx + ')' }
    ]);
  },

  _salvarCadastroAutoNFe: function(idx) {
    var nome     = (document.getElementById('cadAutoNome')     || {}).value || '';
    var cat      = (document.getElementById('cadAutoCat')      || {}).value || '';
    var ean      = (document.getElementById('cadAutoEAN')      || {}).value || '';
    var unidade  = (document.getElementById('cadAutoUnidade')  || {}).value || 'kg';
    var custo    = parseFloat((document.getElementById('cadAutoCusto') || {}).value) || 0;
    var fornec   = (document.getElementById('cadAutoFornecedor') || {}).value || '';

    if (!nome.trim()) { App.showToast('Informe o nome do produto', 'warning'); return; }
    if (!cat)         { App.showToast('Selecione a categoria', 'warning'); return; }

    var item       = (window._nfeItens || [])[idx];
    var meta       = window._nfeMeta || {};

    var novoProduto = DB.addProduto({
      nome: nome.trim(),
      categoria: cat,
      codigoBarras: ean.trim(),
      codigoInterno: '',
      unidade: unidade,
      custo: custo,
      fornecedor: fornec.trim(),
      estoque: 0,
      estoqueMinimo: 0,
      estoqueMaximo: 0,
      local: 'Câmara Fria',
      formaEntrega: '',
      qtdPorUnidade: 0,
      temperatura: '',
      observacoes: 'Cadastrado automaticamente via NF-e'
    });

    // Alimenta o estoque imediatamente com a quantidade da NF-e
    if (item && item.qCom > 0) {
      var lote = DB._gerarLote();
      DB.addMovimentacao({
        tipo:        'entrada',
        produtoId:   novoProduto.id,
        produtoNome: novoProduto.nome,
        quantidade:  item.qCom,
        custo:       item.vUnCom || custo,
        fornecedor:  meta.emitente || fornec.trim(),
        notaFiscal:  meta.nNF || '',
        validade:    '',
        lote:        lote,
        observacao:  'Entrada automática via NF-e: ' + item.xProd
      });
      DB.addLote({
        produtoId:        novoProduto.id,
        produtoNome:      novoProduto.nome,
        lote:             lote,
        quantidadeInicial: item.qCom,
        quantidadeAtual:  item.qCom,
        local:            'Câmara Fria',
        validade:         '',
        fornecedor:       meta.emitente || fornec.trim(),
        notaFiscal:       meta.nNF || ''
      });
    }

    App.closeModal();

    // Atualiza a célula da linha no preview sem fechar o preview
    var cellEl = document.getElementById('nfeVinculoCell_' + idx);
    if (cellEl) {
      var qtdTexto = item ? item.qCom + ' ' + item.uCom : '';
      cellEl.innerHTML = '<span style="color:var(--accent);font-size:.78rem;font-weight:700">✅ ' + novoProduto.nome + '</span>'
        + '<br><span style="color:#10b981;font-size:.7rem">📦 Estoque atualizado: +' + qtdTexto + ' já registrado</span>';
    }

    // Marca o checkbox como já importado e desabilita para não duplicar
    var chk = document.getElementById('nfeCheck_' + idx);
    if (chk) {
      chk.checked  = false;   // desmarca — já foi importado diretamente
      chk.disabled = true;
      chk.title    = 'Já importado automaticamente';
    }

    // Destaca a linha em verde
    var row = document.getElementById('nfeRow_' + idx);
    if (row) {
      row.style.background  = 'rgba(16,185,129,0.12)';
      row.style.transition  = 'background 0.4s';
    }

    App.showToast('✅ "' + novoProduto.nome + '" cadastrado e ' + (item ? item.qCom + ' ' + item.uCom : '') + ' adicionados ao estoque!', 'success');
  },

  _setNFeStatus: function(show, msg) {
    var el = document.getElementById('nfeProcessingStatus');
    var txt = document.getElementById('nfeStatusMsg');
    if (el) el.style.display = show ? 'block' : 'none';
    if (txt && msg) txt.textContent = msg;
  }
};

