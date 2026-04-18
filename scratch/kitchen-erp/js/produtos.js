/**
 * produtos.js — Módulo de Cadastro de Produtos
 */

const ProdutosPage = {
  filtro: '',
  categoriaFiltro: '',

  render() {
    const categorias = [...new Set(DB.getProdutos().map(p => p.categoria).filter(Boolean))];
    return `
      <div class="page-header">
        <div>
          <h1>📦 Produtos</h1>
          <p>Cadastro e gerenciamento de todos os produtos</p>
        </div>
      </div>

      <!-- Botão grande centralizado -->
      <div style="display:flex;justify-content:center;margin-bottom:28px">
        <button onclick="ProdutosPage.openModal()"
          style="background:linear-gradient(135deg,#10b981,#059669);color:#000;border:none;border-radius:16px;
                 padding:22px 56px;font-size:1.3rem;font-weight:800;cursor:pointer;
                 box-shadow:0 0 40px rgba(16,185,129,0.45);display:flex;align-items:center;
                 gap:14px;font-family:Inter,sans-serif;letter-spacing:-.3px;
                 transition:transform .15s,box-shadow .15s"
          onmouseover="this.style.transform='scale(1.04)';this.style.boxShadow='0 0 60px rgba(16,185,129,0.65)'"
          onmouseout="this.style.transform='scale(1)';this.style.boxShadow='0 0 40px rgba(16,185,129,0.45)'">
          <span style="font-size:1.8rem">➕</span>
          <span>NOVO PRODUTO</span>
        </button>
      </div>

      <div class="table-container">
        <div class="table-toolbar">
          <div class="search-input-wrap">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" id="searchProduto" placeholder="Buscar produto..." value="${this.filtro}" oninput="ProdutosPage.setFiltro(this.value)" />
          </div>
          <select id="filtroCategoria" style="width:auto;padding:8px 12px" onchange="ProdutosPage.setCategoria(this.value)">
            <option value="">Todas as categorias</option>
            ${categorias.map(c => `<option value="${c}" ${this.categoriaFiltro === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
          <div class="table-actions">
            <button class="btn btn-secondary btn-sm" onclick="ProdutosPage.openScannerBusca()">📷 Ler Barcode</button>
            <button class="btn btn-secondary btn-sm" onclick="ProdutosPage.exportCSV()">⬇️ Exportar CSV</button>
          </div>
        </div>
        <div id="produtosTableBody">
          ${this.renderTable()}
        </div>
      </div>
    `;
  },

  renderTable() {
    let produtos = DB.getProdutos();
    if (this.filtro) {
      const f = this.filtro.toLowerCase();
      produtos = produtos.filter(p =>
        p.nome.toLowerCase().includes(f) ||
        (p.codigoInterno || '').toLowerCase().includes(f) ||
        (p.codigoBarras || '').includes(f) ||
        (p.categoria || '').toLowerCase().includes(f)
      );
    }
    if (this.categoriaFiltro) {
      produtos = produtos.filter(p => p.categoria === this.categoriaFiltro);
    }

    if (produtos.length === 0) {
      return `<div class="empty-state"><div class="empty-icon">📦</div><h3>Nenhum produto encontrado</h3><p>Clique em "+ Novo Produto" para começar</p></div>`;
    }

    const tempMap = {
      'Congelado':            { icon: '❄️', cls: 'badge-info' },
      'Resfriado':            { icon: '🧊', cls: 'badge-info' },
      'Temperatura Ambiente': { icon: '🌡️', cls: 'badge-gray' },
    };

    const rows = produtos.map(p => {
      const estoque  = parseFloat(p.estoque || 0);
      const minimo   = parseFloat(p.estoqueMinimo || 0);
      const maximo   = parseFloat(p.estoqueMaximo || 0);

      let status, badgeClass;
      if (estoque === 0)                         { status = 'Zerado';  badgeClass = 'badge-danger'; }
      else if (minimo > 0 && estoque <= minimo)  { status = 'Crítico'; badgeClass = 'badge-warning'; }
      else if (maximo > 0 && estoque >= maximo)  { status = 'Máximo';  badgeClass = 'badge-info'; }
      else                                       { status = 'Normal';  badgeClass = 'badge-success'; }

      const pct    = maximo > 0 ? Math.min(100, (estoque / maximo) * 100) : 50;
      const corBar = estoque === 0 ? 'danger' : (estoque <= minimo ? 'warning' : '');
      const temp   = tempMap[p.temperatura] || null;

      const codigoCell = p.codigoInterno || p.codigoBarras
        ? `<code style="font-size:.78rem;color:var(--text-secondary)">${p.codigoInterno || p.codigoBarras}</code>${p.codigoBarras && p.codigoInterno ? `<br><code style="font-size:.68rem;color:var(--text-muted)">${p.codigoBarras}</code>` : ''}`
        : '—';

      const tempCell = temp
        ? `<span class="badge ${temp.cls}">${temp.icon} ${p.temperatura}</span>`
        : '<span style="color:var(--text-muted)">—</span>';

      return `
        <tr>
          <td>${codigoCell}</td>
          <td>
            <span style="font-weight:600">${p.nome}</span>
            ${p.fornecedor ? `<br><span style="font-size:.72rem;color:var(--text-muted)">${p.fornecedor}</span>` : ''}
          </td>
          <td><span class="badge badge-gray">${p.categoria || '—'}</span></td>
          <td style="font-size:.82rem">
            ${p.formaEntrega || '—'}
            ${p.qtdPorUnidade > 0 ? '<br><span style="font-size:.7rem;color:var(--text-muted)">1 ' + p.formaEntrega + ' = ' + p.qtdPorUnidade + ' ' + p.unidade + '</span>' : ''}
          </td>
          <td>${tempCell}</td>
          <td>
            <div class="stock-level">
              <div class="stock-level-text">
                <span style="font-weight:600">${estoque.toFixed(2)}</span>
                <span>${p.unidade || ''}</span>
              </div>
              <div class="progress-bar"><div class="progress-fill ${corBar}" style="width:${pct}%"></div></div>
            </div>
          </td>
          <td style="font-size:.8rem;color:var(--text-secondary)">${minimo}/${maximo} ${p.unidade || ''}</td>
          <td>R$ ${parseFloat(p.custo || 0).toFixed(2)}</td>
          <td style="font-size:.82rem">${p.local || '—'}</td>
          <td><span class="badge ${badgeClass}">${status}</span></td>
          <td>
            <div style="display:flex;gap:4px;justify-content:center">
              <button class="btn btn-secondary btn-sm" onclick="ProdutosPage.openModal('${p.id}')" title="Editar">✏️</button>
              <button class="btn btn-secondary btn-sm" onclick="ProdutosPage.verHistorico('${p.id}')" title="Histórico">📋</button>
              <button class="btn btn-danger btn-sm" onclick="ProdutosPage.deletar('${p.id}')" title="Excluir">🗑️</button>
            </div>
          </td>
        </tr>`;
    }).join('');

    return `
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Nome</th>
            <th>Categoria</th>
            <th>Forma de Entrega</th>
            <th>Temperatura</th>
            <th>Estoque Atual</th>
            <th>Mín/Máx</th>
            <th>Custo Unit.</th>
            <th>Local</th>
            <th>Status</th>
            <th style="text-align:center">Ações</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
  },

  setFiltro(v) {
    this.filtro = v;
    document.getElementById('produtosTableBody').innerHTML = this.renderTable();
  },

  setCategoria(v) {
    this.categoriaFiltro = v;
    document.getElementById('produtosTableBody').innerHTML = this.renderTable();
  },

  openScannerBusca() {
    BarcodeScanner.open(codigo => {
      const p = DB.getProdutoPorCodigo(codigo);
      if (p) {
        this.filtro = codigo;
        document.getElementById('searchProduto').value = codigo;
        document.getElementById('produtosTableBody').innerHTML = this.renderTable();
        App.showToast('Produto encontrado!', 'success');
      } else {
        App.showToast('Código não encontrado. Deseja cadastrar?', 'warning');
        this.openModal(null, codigo);
      }
    });
  },

  // ── MODAL DE CADASTRO / EDIÇÃO ──────────────────────────────────────────────
  openModal(id, codigoBarrasParam) {
    id              = id || null;
    codigoBarrasParam = codigoBarrasParam || '';

    const produto = id ? DB.getProdutoPorId(id) : null;
    const titulo  = produto ? 'Editar Produto' : 'Novo Produto';

    const categorias    = ['Carnes','Hortifruti','Laticínios','Grãos e Cereais','Condimentos','Bebidas','Embalagens','Higiene/Limpeza','Outros'];
    const unidades      = ['kg','g','L','ml','un','cx','fardo','pct','dz'];
    const locais        = ['Câmara Fria','Câmara Seca','Despensa','Congelador','Prateleira','Adega'];
    const formasEntrega = ['Caixa','Saco','Bandeja','Fardo','Engradado','Galão','Lata','Pacote','Pote','Saco a vácuo','Unidade','Outro'];

    // helpers para não quebrar aspas dentro de template literals
    const val  = k => (produto && produto[k]) ? produto[k] : '';
    const sel  = (k, v) => val(k) === v ? 'selected' : '';
    const chk  = v => val('temperatura') === v ? 'checked' : '';

    const estInicialHtml = id ? '' : `
      <div class="form-group">
        <label>Estoque Inicial</label>
        <input type="number" id="pEstInicial" min="0" step="0.01" placeholder="0" value="0" />
      </div>`;

    const body = `
      <form id="formProduto" onsubmit="ProdutosPage.salvar(event, '${id || ''}')">

        <!-- IDENTIFICAÇÃO -->
        <div class="form-section-title">Identificação</div>
        <div class="form-grid" style="margin-bottom:20px">
          <div class="form-group">
            <label>Nome do Produto *</label>
            <input type="text" id="pNome" required placeholder="Ex: Frango Inteiro" value="${val('nome')}" />
          </div>
          <div class="form-group">
            <label>Categoria *</label>
            <select id="pCategoria" required>
              <option value="">Selecione...</option>
              ${categorias.map(c => `<option value="${c}" ${sel('categoria', c)}>${c}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Código Interno</label>
            <input type="text" id="pCodigoInt" placeholder="Ex: FRA001" value="${val('codigoInterno')}" />
          </div>
          <div class="form-group">
            <label>Código de Barras (EAN)</label>
            <div class="input-group">
              <input type="text" id="pCodigoBar" placeholder="Digite ou escaneie" value="${val('codigoBarras') || codigoBarrasParam}" />
              <button type="button" class="btn btn-secondary" onclick="ProdutosPage.scanBarcode()" title="Escanear câmera">📷</button>
            </div>
          </div>
        </div>

        <!-- ENTREGA E CONSERVAÇÃO -->
        <div class="form-section-title">Entrega e Conservação</div>
        <div class="form-grid" style="margin-bottom:20px">
          <div class="form-group">
            <label>Forma de Entrega *</label>
            <select id="pFormaEntrega" required onchange="ProdutosPage.onFormaEntregaChange()">
              <option value="">Como o produto chega?</option>
              ${formasEntrega.map(f => '<option value="' + f + '" ' + sel('formaEntrega', f) + '>' + f + '</option>').join('')}
            </select>
            <span class="form-hint">Embalagem usada pelo fornecedor na entrega</span>
          </div>
          <div class="form-group">
            <label id="lblQtdUnidade">Quantidade por Unidade de Entrega</label>
            <div style="display:flex;gap:8px;align-items:center">
              <input type="number" id="pQtdPorUnidade" min="0" step="0.001" placeholder="Ex: 20"
                value="${val('qtdPorUnidade')}" style="flex:1"
                oninput="ProdutosPage.onQtdUnidadeInput()" />
              <span id="spanQtdUnidade" style="font-size:.82rem;color:var(--text-secondary);white-space:nowrap">kg / unidade</span>
            </div>
            <span class="form-hint" id="hintQtdUnidade">Ex: 1 Caixa contém 20 kg → Ao dar entrada de 1 caixa, o sistema adiciona 20 kg automaticamente</span>
          </div>
          <div class="form-group">
            <label>Temperatura de Conservação *</label>
            <div style="display:flex;flex-direction:column;gap:8px;margin-top:4px">

              <label class="temp-option" id="lbl-congelado" onclick="ProdutosPage.onTemperaturaChange('Congelado')">
                <input type="radio" name="pTemperatura" value="Congelado" ${chk('Congelado')}
                  style="width:auto;accent-color:var(--info)" />
                <span style="font-size:1.1rem">❄️</span>
                <div>
                  <div style="font-size:.875rem;font-weight:600;color:var(--text-primary)">Congelado</div>
                  <div style="font-size:.72rem;color:var(--text-muted)">Abaixo de -18°C — Congelador</div>
                </div>
              </label>

              <label class="temp-option" id="lbl-resfriado" onclick="ProdutosPage.onTemperaturaChange('Resfriado')">
                <input type="radio" name="pTemperatura" value="Resfriado" ${chk('Resfriado')}
                  style="width:auto;accent-color:var(--info)" />
                <span style="font-size:1.1rem">🧊</span>
                <div>
                  <div style="font-size:.875rem;font-weight:600;color:var(--text-primary)">Resfriado</div>
                  <div style="font-size:.72rem;color:var(--text-muted)">Entre 0°C e 10°C — Câmara Fria</div>
                </div>
              </label>

              <label class="temp-option" id="lbl-ambiente" onclick="ProdutosPage.onTemperaturaChange('Temperatura Ambiente')">
                <input type="radio" name="pTemperatura" value="Temperatura Ambiente" ${chk('Temperatura Ambiente')}
                  style="width:auto;accent-color:var(--info)" />
                <span style="font-size:1.1rem">🌡️</span>
                <div>
                  <div style="font-size:.875rem;font-weight:600;color:var(--text-primary)">Temperatura Ambiente</div>
                  <div style="font-size:.72rem;color:var(--text-muted)">Acima de 10°C — Despensa / Câmara Seca</div>
                </div>
              </label>

            </div>
          </div>
        </div>

        <!-- ESTOQUE E ARMAZENAMENTO -->
        <div class="form-section-title">Estoque e Armazenamento</div>
        <div class="form-grid" style="margin-bottom:20px">
          <div class="form-group">
            <label>Unidade de Medida *</label>
            <select id="pUnidade" required>
              ${unidades.map(u => `<option value="${u}" ${sel('unidade', u)}>${u}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Local de Armazenamento</label>
            <select id="pLocal">
              <option value="">Selecione...</option>
              ${locais.map(l => `<option value="${l}" ${sel('local', l)}>${l}</option>`).join('')}
            </select>
            <span class="form-hint" id="localHint">Sugestão automática pela temperatura</span>
          </div>
          <div class="form-group">
            <label>Estoque Mínimo</label>
            <input type="number" id="pEstMin" min="0" step="0.01" placeholder="0" value="${val('estoqueMinimo')}" />
          </div>
          <div class="form-group">
            <label>Estoque Máximo</label>
            <input type="number" id="pEstMax" min="0" step="0.01" placeholder="0" value="${val('estoqueMaximo')}" />
          </div>
          ${estInicialHtml}
          <div class="form-group">
            <label>Custo Unitário (R$)</label>
            <input type="number" id="pCusto" min="0" step="0.01" placeholder="0.00" value="${val('custo')}" />
          </div>
          <div class="form-group">
            <label>Fornecedor Principal</label>
            <input type="text" id="pFornecedor" placeholder="Nome do fornecedor" value="${val('fornecedor')}" />
          </div>
          <div class="form-group full-width">
            <label>Observações</label>
            <textarea id="pObs" placeholder="Informações adicionais...">${val('observacoes')}</textarea>
          </div>
        </div>

        <input type="submit" style="display:none" />
      </form>`;

    App.openModal(titulo, body, [
      { label: 'Cancelar',                      class: 'btn-secondary', action: 'App.closeModal()' },
      { label: produto ? 'Atualizar' : 'Cadastrar', class: 'btn-primary',
        action: "document.getElementById('formProduto').requestSubmit()" }
    ], 'modal-lg');

    // Destacar temperatura já selecionada (edição)
    if (produto && produto.temperatura) {
      setTimeout(() => ProdutosPage.onTemperaturaChange(produto.temperatura), 60);
    }
  },

  onTemperaturaChange(valor) {
    const ids = { 'Congelado': 'lbl-congelado', 'Resfriado': 'lbl-resfriado', 'Temperatura Ambiente': 'lbl-ambiente' };
    Object.entries(ids).forEach(([v, lblId]) => {
      const lbl = document.getElementById(lblId);
      if (!lbl) return;
      const ativo = v === valor;
      lbl.style.borderColor = ativo ? 'var(--info)' : 'var(--border)';
      lbl.style.background  = ativo ? 'rgba(59,130,246,0.1)' : 'transparent';
    });

    // Sugerir local automaticamente (só se ainda não tiver sido escolhido)
    const localSel = document.getElementById('pLocal');
    const hint     = document.getElementById('localHint');
    if (!localSel) return;
    const mapa = {
      'Congelado':            { local: 'Congelador',  txt: '💡 Sugestão: Congelador' },
      'Resfriado':            { local: 'Câmara Fria', txt: '💡 Sugestão: Câmara Fria' },
      'Temperatura Ambiente': { local: 'Câmara Seca', txt: '💡 Sugestão: Câmara Seca' },
    };
    const sug = mapa[valor];
    if (sug && !localSel.value) {
      localSel.value = sug.local;
      if (hint) hint.textContent = sug.txt;
    }
  },

  scanBarcode() {
    BarcodeScanner.open(codigo => {
      document.getElementById('pCodigoBar').value = codigo;
    });
  },

  onFormaEntregaChange() {
    var forma = document.getElementById('pFormaEntrega');
    var lbl   = document.getElementById('lblQtdUnidade');
    var span  = document.getElementById('spanQtdUnidade');
    var hint  = document.getElementById('hintQtdUnidade');
    var unid  = (document.getElementById('pUnidade') || {}).value || 'kg';
    if (!forma || !lbl) return;
    var f = forma.value || 'Unidade';
    if (lbl)  lbl.textContent  = 'Quantidade em ' + unid + ' por ' + f;
    if (span) span.textContent = unid + ' / ' + f;
    if (hint) hint.textContent = 'Ex: 1 ' + f + ' cont\u00e9m ___ ' + unid + '. Ao dar entrada de 1 ' + f + ', o sistema adiciona esse valor ao estoque automaticamente.';
  },

  onQtdUnidadeInput() {
    var forma = (document.getElementById('pFormaEntrega') || {}).value || 'unidade';
    var unid  = (document.getElementById('pUnidade') || {}).value || 'kg';
    var qtd   = parseFloat((document.getElementById('pQtdPorUnidade') || {}).value) || 0;
    var hint  = document.getElementById('hintQtdUnidade');
    if (hint && qtd > 0) {
      hint.innerHTML = '\u2705 1 <strong>' + forma + '</strong> = <strong>' + qtd + ' ' + unid + '</strong>. Ao receber 2 ' + forma + 's, o sistema adicionar\u00e1 <strong>' + (qtd * 2) + ' ' + unid + '</strong> ao estoque.';
      hint.style.color = 'var(--accent)';
    }
  },

  salvar(e, id) {
    e.preventDefault();
    const temperaturaEl = document.querySelector('input[name="pTemperatura"]:checked');
    const dados = {
      nome:            document.getElementById('pNome').value.trim(),
      categoria:       document.getElementById('pCategoria').value,
      codigoInterno:   document.getElementById('pCodigoInt').value.trim(),
      codigoBarras:    document.getElementById('pCodigoBar').value.trim(),
      formaEntrega:    document.getElementById('pFormaEntrega').value,
      qtdPorUnidade:   parseFloat(document.getElementById('pQtdPorUnidade').value) || 0,
      temperatura:     temperaturaEl ? temperaturaEl.value : '',
      unidade:         document.getElementById('pUnidade').value,
      local:           document.getElementById('pLocal').value,
      estoqueMinimo:   parseFloat(document.getElementById('pEstMin').value) || 0,
      estoqueMaximo:   parseFloat(document.getElementById('pEstMax').value) || 0,
      custo:           parseFloat(document.getElementById('pCusto').value) || 0,
      fornecedor:      document.getElementById('pFornecedor').value.trim(),
      observacoes:     document.getElementById('pObs').value.trim(),
    };

    if (id) {
      DB.updateProduto(id, dados);
      App.showToast('Produto atualizado!', 'success');
    } else {
      const estInicial = parseFloat(document.getElementById('pEstInicial').value) || 0;
      dados.estoque = estInicial;
      DB.addProduto(dados);
      App.showToast('Produto cadastrado!', 'success');
    }

    App.closeModal();
    App.navigateTo('produtos');
  },

  deletar(id) {
    const p = DB.getProdutoPorId(id);
    if (!confirm('Excluir "' + p?.nome + '"? Esta ação não pode ser desfeita.')) return;
    DB.deleteProduto(id);
    App.showToast('Produto excluído.', 'info');
    App.navigateTo('produtos');
  },

  verHistorico(id) {
    const produto = DB.getProdutoPorId(id);
    const movs    = DB.getMovimentacoesPorProduto(id).sort((a, b) => new Date(b.data) - new Date(a.data));

    const rows = movs.map(m => {
      const tipo = m.tipo === 'entrada' ? '📥 Entrada' : m.tipo === 'saida' ? '📤 Saída' : '🍳 Produção';
      const cor  = m.tipo === 'entrada' ? 'text-accent' : m.tipo === 'saida' ? 'text-danger' : '';
      const sinal = m.tipo === 'saida' ? '-' : '+';
      const data  = new Date(m.data).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' });
      return `<tr>
        <td style="font-size:.8rem">${data}</td>
        <td>${tipo}</td>
        <td class="${cor}" style="font-weight:600">${sinal} ${m.quantidade} ${produto?.unidade || ''}</td>
        <td style="font-size:.78rem;color:var(--text-muted)">${m.observacao || m.motivo || '—'}</td>
      </tr>`;
    }).join('');

    const body = `
      <div style="margin-bottom:16px">
        <h4 style="color:var(--accent)">${produto?.nome}</h4>
        <p style="font-size:.82rem;color:var(--text-muted)">
          Estoque atual: <strong style="color:var(--text-primary)">${parseFloat(produto?.estoque || 0).toFixed(2)} ${produto?.unidade || ''}</strong>
          ${produto?.formaEntrega ? ` &nbsp;|&nbsp; Entrega: <strong>${produto.formaEntrega}</strong>` : ''}
          ${produto?.temperatura  ? ` &nbsp;|&nbsp; Temp.: <strong>${produto.temperatura}</strong>` : ''}
        </p>
      </div>
      ${movs.length === 0
        ? '<p class="text-muted" style="text-align:center;padding:20px">Sem movimentações registradas</p>'
        : `<div style="max-height:320px;overflow-y:auto">
            <table>
              <thead><tr><th>Data</th><th>Tipo</th><th>Qtd</th><th>Obs</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
           </div>`}`;

    App.openModal('Histórico — ' + produto?.nome, body, [
      { label: 'Fechar', class: 'btn-secondary', action: 'App.closeModal()' }
    ], 'modal-lg');
  },

  exportCSV() {
    const produtos = DB.getProdutos();
    const header   = 'ID,Nome,Categoria,Forma de Entrega,Temperatura,Cod.Interno,Cod.Barras,Unidade,Estoque,Est.Mínimo,Est.Máximo,Custo,Fornecedor,Local';
    const rows     = produtos.map(p =>
      [p.id, p.nome, p.categoria, p.formaEntrega, p.temperatura,
       p.codigoInterno, p.codigoBarras, p.unidade, p.estoque,
       p.estoqueMinimo, p.estoqueMaximo, p.custo, p.fornecedor, p.local]
        .map(v => `"${v || ''}"`)
        .join(',')
    );
    const csv  = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = 'produtos_' + new Date().toISOString().split('T')[0] + '.csv';
    a.click();
  },

  postRender() {}
};
