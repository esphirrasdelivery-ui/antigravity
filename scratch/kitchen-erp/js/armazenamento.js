/**
 * armazenamento.js — Módulo de Armazenamento
 */

const ArmazenamentoPage = {
  localAtivo: null,
  filtroStatus: 'todos',

  render() {
    const lotes = DB.getLotesAtivos();
    const locais = [...new Set(lotes.map(l => l.local).filter(Boolean))];
    locais.unshift('Todos');

    const hoje = new Date();
    const lotesFiltrados = this.localAtivo && this.localAtivo !== 'Todos'
      ? lotes.filter(l => l.local === this.localAtivo)
      : lotes;

    const totalLocais = {};
    lotes.forEach(l => {
      if (!totalLocais[l.local || 'Sem local']) totalLocais[l.local || 'Sem local'] = 0;
      totalLocais[l.local || 'Sem local']++;
    });

    return `
      <div class="page-header">
        <div>
          <h1>🗄️ Armazenamento</h1>
          <p>Gestão de lotes e localização de produtos em estoque</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary btn-sm" onclick="ArmazenamentoPage.verificarValidades()">
            ⏰ Verificar Validades
          </button>
          <button class="btn btn-primary" onclick="ArmazenamentoPage.openModal()">
            + Registrar Lote
          </button>
        </div>
      </div>

      <!-- Locais de Armazenamento -->
      <div class="storage-grid mb-16">
        ${[
          { nome: 'Todos', icon: '📦', desc: `${lotes.length} lotes` },
          { nome: 'Câmara Fria', icon: '🧊', desc: `${totalLocais['Câmara Fria']||0} lotes` },
          { nome: 'Câmara Seca', icon: '🏠', desc: `${totalLocais['Câmara Seca']||0} lotes` },
          { nome: 'Congelador', icon: '❄️', desc: `${totalLocais['Congelador']||0} lotes` },
          { nome: 'Despensa', icon: '🗃️', desc: `${totalLocais['Despensa']||0} lotes` },
          { nome: 'Prateleira', icon: '📚', desc: `${totalLocais['Prateleira']||0} lotes` },
        ].map(l => `
          <div class="storage-card ${this.localAtivo === l.nome || (!this.localAtivo && l.nome === 'Todos') ? 'selected' : ''}"
               onclick="ArmazenamentoPage.filtrarLocal('${l.nome}')">
            <div class="storage-icon">${l.icon}</div>
            <div class="storage-name">${l.nome}</div>
            <div class="storage-items">${l.desc}</div>
          </div>
        `).join('')}
      </div>

      <!-- Filtros de Status -->
      <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
        <button class="tab-btn ${this.filtroStatus==='todos'?'active':''}" onclick="ArmazenamentoPage.filtrarStatus('todos')">Todos (${lotes.length})</button>
        <button class="tab-btn ${this.filtroStatus==='ok'?'active':''}" onclick="ArmazenamentoPage.filtrarStatus('ok')">✅ OK</button>
        <button class="tab-btn ${this.filtroStatus==='vencendo'?'active':''}" onclick="ArmazenamentoPage.filtrarStatus('vencendo')" style="color:var(--warning)">⏰ Vencendo (${DB.getLotesVencendo().length})</button>
        <button class="tab-btn ${this.filtroStatus==='vencido'?'active':''}" onclick="ArmazenamentoPage.filtrarStatus('vencido')" style="color:var(--danger)">❌ Vencidos (${DB.getLotesVencidos().length})</button>
      </div>

      <!-- Tabela de Lotes -->
      <div class="table-container">
        <div class="table-toolbar">
          <div style="font-weight:600;font-size:.9rem">
            ${this.localAtivo && this.localAtivo !== 'Todos' ? this.localAtivo : 'Todos os Armazéns'}
          </div>
          <span style="font-size:.8rem;color:var(--text-muted)">${this.getLotesFiltrados().length} lotes</span>
        </div>
        ${this.renderTabela()}
      </div>
    `;
  },

  getLotesFiltrados() {
    let lotes = DB.getLotesAtivos();
    const hoje = new Date();

    if (this.localAtivo && this.localAtivo !== 'Todos') {
      lotes = lotes.filter(l => l.local === this.localAtivo);
    }

    if (this.filtroStatus === 'vencendo') {
      const limite = new Date();
      limite.setDate(limite.getDate() + 7);
      lotes = lotes.filter(l => l.validade && new Date(l.validade) <= limite && new Date(l.validade) >= hoje);
    } else if (this.filtroStatus === 'vencido') {
      lotes = lotes.filter(l => l.validade && new Date(l.validade) < hoje);
    } else if (this.filtroStatus === 'ok') {
      lotes = lotes.filter(l => !l.validade || new Date(l.validade) >= new Date(Date.now() + 7*24*60*60*1000));
    }

    return lotes.sort((a, b) => {
      if (!a.validade) return 1;
      if (!b.validade) return -1;
      return new Date(a.validade) - new Date(b.validade);
    });
  },

  renderTabela() {
    const lotes = this.getLotesFiltrados();
    const hoje = new Date();

    if (lotes.length === 0) {
      return `<div class="empty-state"><div class="empty-icon">🗄️</div><h3>Nenhum lote encontrado</h3><p>Registre entradas para ver os lotes aqui</p></div>`;
    }

    return `
      <table>
        <thead><tr>
          <th>Produto</th><th>Lote</th><th>Local</th><th>Qtd Inicial</th><th>Qtd Atual</th>
          <th>Validade</th><th>Fornecedor</th><th>Status</th><th>Ações</th>
        </tr></thead>
        <tbody>
          ${lotes.map(l => {
            const val = l.validade ? new Date(l.validade) : null;
            const diasRestantes = val ? Math.ceil((val - hoje) / (1000*60*60*24)) : null;
            let statusBadge = '<span class="badge badge-success">✅ OK</span>';
            let expiryClass = '';
            if (val) {
              if (val < hoje) { statusBadge = '<span class="badge badge-danger">❌ Vencido</span>'; expiryClass = 'expiry-expired'; }
              else if (diasRestantes <= 3) { statusBadge = `<span class="badge badge-danger">⚠️ ${diasRestantes}d</span>`; expiryClass = 'expiry-expired'; }
              else if (diasRestantes <= 7) { statusBadge = `<span class="badge badge-warning">⏰ ${diasRestantes}d</span>`; expiryClass = 'expiry-near'; }
            }
            const pct = l.quantidadeInicial > 0 ? Math.min(100, (l.quantidadeAtual / l.quantidadeInicial) * 100) : 100;

            return `<tr>
              <td><strong>${l.produtoNome}</strong></td>
              <td><code style="font-size:.75rem;color:var(--text-secondary)">${l.lote}</code></td>
              <td><span class="badge badge-gray">${l.local || '—'}</span></td>
              <td style="font-size:.83rem">${parseFloat(l.quantidadeInicial||0).toFixed(2)}</td>
              <td>
                <div class="stock-level">
                  <div class="stock-level-text"><span style="font-weight:600">${parseFloat(l.quantidadeAtual||0).toFixed(2)}</span></div>
                  <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
                </div>
              </td>
              <td class="${expiryClass}" style="font-size:.82rem;font-weight:500">${l.validade || '—'}</td>
              <td style="font-size:.78rem">${l.fornecedor || '—'}</td>
              <td>${statusBadge}</td>
              <td>
                <div style="display:flex;gap:4px">
                  <button class="btn btn-secondary btn-sm" onclick="ArmazenamentoPage.editarLote('${l.id}')" title="Editar">✏️</button>
                  <button class="btn btn-warning btn-sm" onclick="ArmazenamentoPage.transferir('${l.id}')" title="Transferir">↔️</button>
                  <button class="btn btn-danger btn-sm" onclick="ArmazenamentoPage.descartar('${l.id}')" title="Descartar">🗑️</button>
                </div>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    `;
  },

  filtrarLocal(local) {
    this.localAtivo = local;
    App.navigateTo('armazenamento');
  },

  filtrarStatus(status) {
    this.filtroStatus = status;
    App.navigateTo('armazenamento');
  },

  verificarValidades() {
    const vencidos = DB.getLotesVencidos();
    const vencendo = DB.getLotesVencendo(7);

    if (vencidos.length === 0 && vencendo.length === 0) {
      App.showToast('✅ Todas as validades estão em dia!', 'success');
      return;
    }

    const body = `
      ${vencidos.length > 0 ? `
        <div class="alert alert-danger">❌ ${vencidos.length} lote(s) VENCIDOS — Descarte imediato necessário!</div>
        <div class="table-container" style="margin-bottom:16px">
          <table>
            <thead><tr><th>Produto</th><th>Lote</th><th>Validade</th><th>Qtd</th><th>Local</th></tr></thead>
            <tbody>${vencidos.map(l=>
              `<tr style="background:var(--danger-dim)">
                <td><strong>${l.produtoNome}</strong></td>
                <td><code style="font-size:.75rem">${l.lote}</code></td>
                <td class="expiry-expired">${l.validade}</td>
                <td>${l.quantidadeAtual}</td>
                <td>${l.local}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>` : ''}

      ${vencendo.length > 0 ? `
        <div class="alert alert-warning">⏰ ${vencendo.length} lote(s) vencem nos próximos 7 dias</div>
        <div class="table-container">
          <table>
            <thead><tr><th>Produto</th><th>Lote</th><th>Validade</th><th>Dias</th><th>Local</th></tr></thead>
            <tbody>${vencendo.map(l=>{
              const dias = Math.ceil((new Date(l.validade)-new Date())/(1000*60*60*24));
              return `<tr>
                <td><strong>${l.produtoNome}</strong></td>
                <td><code style="font-size:.75rem">${l.lote}</code></td>
                <td class="expiry-near">${l.validade}</td>
                <td class="expiry-near fw-bold">${dias}d</td>
                <td>${l.local}</td>
              </tr>`;
            }).join('')}
            </tbody>
          </table>
        </div>` : ''}
    `;

    App.openModal('⚠️ Alerta de Validades', body, [
      { label: 'Fechar', class: 'btn-secondary', action: 'App.closeModal()' }
    ], 'modal-lg');
  },

  openModal() {
    const produtos = DB.getProdutos();
    const body = `
      <form id="formLote" onsubmit="ArmazenamentoPage.salvarLote(event)">
        <div class="form-grid">
          <div class="form-group full-width">
            <label>Produto *</label>
            <select id="lProduto" required>
              <option value="">Selecione...</option>
              ${produtos.map(p=>`<option value="${p.id}">${p.nome}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Quantidade *</label>
            <input type="number" id="lQtd" required min="0.001" step="0.001" />
          </div>
          <div class="form-group">
            <label>Local de Armazenamento</label>
            <select id="lLocal">
              ${['Câmara Fria','Câmara Seca','Congelador','Despensa','Prateleira','Adega'].map(l=>`<option>${l}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Data de Validade</label>
            <input type="date" id="lValidade" />
          </div>
          <div class="form-group">
            <label>Fornecedor</label>
            <input type="text" id="lFornecedor" placeholder="Nome" />
          </div>
        </div>
        <input type="submit" style="display:none" />
      </form>
    `;
    App.openModal('Registrar Lote', body, [
      { label: 'Cancelar', class: 'btn-secondary', action: 'App.closeModal()' },
      { label: 'Salvar', class: 'btn-primary', action: `document.getElementById('formLote').requestSubmit()` }
    ]);
  },

  salvarLote(e) {
    e.preventDefault();
    const produtoId = document.getElementById('lProduto').value;
    const quantidade = parseFloat(document.getElementById('lQtd').value);
    const local = document.getElementById('lLocal').value;
    const validade = document.getElementById('lValidade').value;
    const fornecedor = document.getElementById('lFornecedor').value;
    const produto = DB.getProdutoPorId(produtoId);

    DB.addLote({
      produtoId, produtoNome: produto?.nome,
      lote: DB._gerarLote(),
      quantidadeInicial: quantidade, quantidadeAtual: quantidade,
      local, validade, fornecedor
    });
    DB.addMovimentacao({ tipo: 'entrada', produtoId, produtoNome: produto?.nome, quantidade, local, validade, motivo: 'Registro manual de lote' });

    App.showToast('Lote registrado!', 'success');
    App.closeModal();
    App.navigateTo('armazenamento');
  },

  editarLote(id) {
    const lote = DB.getLotes().find(l => l.id === id);
    if (!lote) return;
    const locais = ['Câmara Fria','Câmara Seca','Congelador','Despensa','Prateleira','Adega'];
    const body = `
      <form id="formEditLote" onsubmit="ArmazenamentoPage.salvarEdicaoLote(event, '${id}')">
        <div class="form-grid">
          <div class="form-group">
            <label>Quantidade Atual</label>
            <input type="number" id="elQtd" value="${lote.quantidadeAtual}" min="0" step="0.001" />
          </div>
          <div class="form-group">
            <label>Local</label>
            <select id="elLocal">
              ${locais.map(l=>`<option ${l===lote.local?'selected':''}>${l}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Validade</label>
            <input type="date" id="elValidade" value="${lote.validade||''}" />
          </div>
        </div>
        <input type="submit" style="display:none" />
      </form>
    `;
    App.openModal(`Editar Lote — ${lote.produtoNome}`, body, [
      { label: 'Cancelar', class: 'btn-secondary', action: 'App.closeModal()' },
      { label: 'Salvar', class: 'btn-primary', action: `document.getElementById('formEditLote').requestSubmit()` }
    ]);
  },

  salvarEdicaoLote(e, id) {
    e.preventDefault();
    DB.updateLote(id, {
      quantidadeAtual: parseFloat(document.getElementById('elQtd').value),
      local: document.getElementById('elLocal').value,
      validade: document.getElementById('elValidade').value
    });
    App.showToast('Lote atualizado!', 'success');
    App.closeModal();
    App.navigateTo('armazenamento');
  },

  transferir(id) {
    const lote = DB.getLotes().find(l => l.id === id);
    if (!lote) return;
    const locais = ['Câmara Fria','Câmara Seca','Congelador','Despensa','Prateleira','Adega'];
    const body = `
      <p style="margin-bottom:16px;font-size:.85rem">Transferindo lote <strong>${lote.lote}</strong> de <span class="badge badge-info">${lote.local}</span></p>
      <div class="form-group">
        <label>Novo Local</label>
        <select id="transLocal">
          ${locais.filter(l=>l!==lote.local).map(l=>`<option>${l}</option>`).join('')}
        </select>
      </div>
    `;
    App.openModal('Transferir Lote', body, [
      { label: 'Cancelar', class: 'btn-secondary', action: 'App.closeModal()' },
      { label: '↔️ Transferir', class: 'btn-primary', action: `ArmazenamentoPage.confirmarTransferencia('${id}')` }
    ]);
  },

  confirmarTransferencia(id) {
    const novoLocal = document.getElementById('transLocal').value;
    DB.updateLote(id, { local: novoLocal });
    App.showToast(`Lote transferido para ${novoLocal}`, 'success');
    App.closeModal();
    App.navigateTo('armazenamento');
  },

  descartar(id) {
    const lote = DB.getLotes().find(l => l.id === id);
    if (!lote) return;
    if (!confirm(`Descartar lote "${lote.lote}" (${lote.quantidadeAtual} un. de ${lote.produtoNome})?`)) return;

    DB.addMovimentacao({
      tipo: 'saida',
      produtoId: lote.produtoId,
      produtoNome: lote.produtoNome,
      quantidade: lote.quantidadeAtual,
      motivo: 'Descarte — vencimento/avaria',
      lote: lote.lote
    });
    DB.updateLote(id, { quantidadeAtual: 0 });
    App.showToast('Lote descartado e baixa no estoque realizada.', 'warning');
    App.navigateTo('armazenamento');
  },

  postRender() {}
};
