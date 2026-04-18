/**
 * saida.js — Módulo de Saída de Produtos
 */

const SaidaPage = {
  render() {
    const saidas = DB.getMovimentacoesPorTipo('saida')
      .sort((a, b) => new Date(b.data) - new Date(a.data));

    return `
      <div class="page-header">
        <div>
          <h1>📤 Saída de Produtos</h1>
          <p>Registro de consumo, vendas, transferências e descartes</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary btn-sm" onclick="SaidaPage.scanSaida()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/><rect x="3" y="16" width="5" height="5"/><rect x="16" y="16" width="5" height="5"/></svg>
            Ler Barcode
          </button>
          <button class="btn btn-primary" onclick="SaidaPage.openModal()">+ Registrar Saída</button>
        </div>
      </div>

      <!-- Form Rápido -->
      <div class="card mb-16">
        <h3 style="font-size:.9rem;font-weight:600;color:var(--text-secondary);margin-bottom:16px">⚡ Saída Rápida</h3>
        <form id="formSaidaRapida" onsubmit="SaidaPage.salvarRapido(event)">
          <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end">
            <div class="form-group" style="flex:2;min-width:200px">
              <label>Produto *</label>
              <div class="input-group">
                <select id="srProduto" required style="border-radius:var(--radius-sm) 0 0 var(--radius-sm)" onchange="SaidaPage.atualizarEstoqueInfo(this.value)">
                  <option value="">Selecione ou escaneie...</option>
                  ${DB.getProdutos()
                    .filter(p => parseFloat(p.estoque || 0) > 0)
                    .sort((a,b) => a.nome.localeCompare(b.nome))
                    .map(p => `<option value="${p.id}">${p.nome} (${parseFloat(p.estoque||0).toFixed(2)} ${p.unidade} em estoque)</option>`)
                    .join('')}
                </select>
                <button type="button" class="btn btn-secondary" onclick="SaidaPage.scanSaida()" title="Escanear" style="border-radius:0 var(--radius-sm) var(--radius-sm) 0">📷</button>
              </div>
              <div id="srEstoqueInfo" class="form-hint"></div>
            </div>
            <div class="form-group" style="flex:0.7;min-width:100px">
              <label>Quantidade *</label>
              <input type="number" id="srQtd" required min="0.001" step="0.001" placeholder="0" />
            </div>
            <div class="form-group" style="flex:1;min-width:160px">
              <label>Motivo *</label>
              <select id="srMotivo" required>
                <option value="Consumo interno">Consumo interno</option>
                <option value="Venda">Venda</option>
                <option value="Descarte/Vencimento">Descarte/Vencimento</option>
                <option value="Transferência">Transferência</option>
                <option value="Ajuste de estoque">Ajuste de estoque</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            <div class="form-group" style="flex:1;min-width:130px">
              <label>Observação</label>
              <input type="text" id="srObs" placeholder="Opcional" />
            </div>
            <button type="submit" class="btn btn-primary" style="align-self:flex-end;white-space:nowrap">
              📤 Registrar
            </button>
          </div>
        </form>
      </div>

      <!-- Saída em Lote (múltiplos produtos) -->
      <div class="card mb-16">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <h3 style="font-size:.9rem;font-weight:600;color:var(--text-secondary)">📋 Saída em Lote (múltiplos produtos)</h3>
          <button class="btn btn-secondary btn-sm" onclick="SaidaPage.openLote()">Abrir Formulário</button>
        </div>
        <p style="font-size:.82rem;color:var(--text-muted)">Para registrar saída de múltiplos produtos ao mesmo tempo (ex: saída para um evento, buffet ou serviço).</p>
      </div>

      <!-- Histórico -->
      <div class="table-container">
        <div class="table-toolbar">
          <div style="font-weight:600;font-size:.9rem">Histórico de Saídas</div>
          <span style="font-size:.8rem;color:var(--text-muted)">${saidas.length} registros</span>
        </div>
        ${saidas.length === 0 ?
          `<div class="empty-state"><div class="empty-icon">📤</div><h3>Nenhuma saída registrada</h3></div>` :
          `<div style="max-height:400px;overflow-y:auto">
            <table>
              <thead><tr><th>Data/Hora</th><th>Produto</th><th>Quantidade</th><th>Motivo</th><th>Observação</th><th>Responsável</th></tr></thead>
              <tbody>
                ${saidas.slice(0,60).map(s => {
                  const p = DB.getProdutoPorId(s.produtoId);
                  const motivoColor = s.motivo?.toLowerCase().includes('descarte') ? 'badge-danger' : 
                    s.motivo?.toLowerCase().includes('venda') ? 'badge-success' : 'badge-gray';
                  return `<tr>
                    <td style="font-size:.8rem;white-space:nowrap">${new Date(s.data).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'})}</td>
                    <td><strong>${p?.nome || s.produtoNome || '—'}</strong></td>
                    <td class="text-danger fw-bold">-${s.quantidade} ${p?.unidade||''}</td>
                    <td><span class="badge ${motivoColor}">${s.motivo||'—'}</span></td>
                    <td style="font-size:.78rem;color:var(--text-muted)">${s.observacao||'—'}</td>
                    <td style="font-size:.78rem">${s.responsavel||'—'}</td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>`
        }
      </div>
    `;
  },

  atualizarEstoqueInfo(produtoId) {
    const el = document.getElementById('srEstoqueInfo');
    if (!el) return;
    const p = DB.getProdutoPorId(produtoId);
    if (!p) { el.textContent = ''; return; }
    const estoque = parseFloat(p.estoque || 0);
    const cor = estoque <= parseFloat(p.estoqueMinimo || 0) ? 'var(--danger)' : 'var(--accent)';
    el.innerHTML = `<span style="color:${cor}">Estoque disponível: <strong>${estoque.toFixed(2)} ${p.unidade}</strong></span>`;
  },

  scanSaida() {
    BarcodeScanner.open((codigo) => {
      const p = DB.getProdutoPorCodigo(codigo);
      if (p) {
        const sel = document.getElementById('srProduto');
        if (sel) {
          sel.value = p.id;
          this.atualizarEstoqueInfo(p.id);
          App.showToast(`Produto: ${p.nome}`, 'success');
        }
      } else {
        App.showToast(`Código ${codigo} não encontrado`, 'warning');
      }
    });
  },

  salvarRapido(e) {
    e.preventDefault();
    const produtoId = document.getElementById('srProduto').value;
    const quantidade = parseFloat(document.getElementById('srQtd').value);
    const motivo = document.getElementById('srMotivo').value;
    const obs = document.getElementById('srObs').value.trim();

    const produto = DB.getProdutoPorId(produtoId);
    if (!produto || !quantidade) return;

    const estoque = parseFloat(produto.estoque || 0);
    if (quantidade > estoque) {
      if (!confirm(`⚠️ Quantidade (${quantidade}) maior que o estoque (${estoque} ${produto.unidade}). Continuar?`)) return;
    }

    DB.addMovimentacao({ tipo: 'saida', produtoId, produtoNome: produto.nome, quantidade, motivo, observacao: obs });

    App.showToast(`Saída de ${quantidade} ${produto.unidade} de "${produto.nome}" registrada!`, 'success');
    e.target.reset();
    document.getElementById('srEstoqueInfo').textContent = '';
    App.navigateTo('saida');
  },

  openModal() {
    const produtos = DB.getProdutos().filter(p => parseFloat(p.estoque || 0) > 0);
    const body = `
      <form id="formSaidaCompleto" onsubmit="SaidaPage.salvarCompleto(event)">
        <div class="form-grid">
          <div class="form-group full-width">
            <label>Produto *</label>
            <div class="input-group">
              <select id="scProduto" required onchange="SaidaPage.updateEstoqueModal(this.value)">
                <option value="">Selecione...</option>
                ${produtos.map(p => `<option value="${p.id}">${p.nome} (${parseFloat(p.estoque||0).toFixed(2)} ${p.unidade})</option>`).join('')}
              </select>
              <button type="button" class="btn btn-secondary" onclick="SaidaPage.scanCompleto()">📷</button>
            </div>
            <div id="scEstoqueInfo" class="form-hint"></div>
          </div>
          <div class="form-group">
            <label>Quantidade *</label>
            <input type="number" id="scQtd" required min="0.001" step="0.001" />
          </div>
          <div class="form-group">
            <label>Motivo *</label>
            <select id="scMotivo" required>
              <option>Consumo interno</option>
              <option>Venda</option>
              <option>Descarte/Vencimento</option>
              <option>Transferência</option>
              <option>Ajuste de estoque</option>
              <option>Outro</option>
            </select>
          </div>
          <div class="form-group">
            <label>Responsável</label>
            <input type="text" id="scResponsavel" placeholder="Nome do responsável" />
          </div>
          <div class="form-group full-width">
            <label>Observação</label>
            <textarea id="scObs" placeholder="Detalhes da saída..."></textarea>
          </div>
        </div>
        <input type="submit" style="display:none" />
      </form>
    `;
    App.openModal('Registrar Saída', body, [
      { label: 'Cancelar', class: 'btn-secondary', action: 'App.closeModal()' },
      { label: '📤 Registrar Saída', class: 'btn-primary', action: `document.getElementById('formSaidaCompleto').requestSubmit()` }
    ]);
  },

  updateEstoqueModal(produtoId) {
    const el = document.getElementById('scEstoqueInfo');
    if (!el) return;
    const p = DB.getProdutoPorId(produtoId);
    if (!p) { el.textContent = ''; return; }
    el.innerHTML = `Estoque atual: <strong style="color:var(--accent)">${parseFloat(p.estoque||0).toFixed(2)} ${p.unidade}</strong>`;
  },

  scanCompleto() {
    BarcodeScanner.open((codigo) => {
      const p = DB.getProdutoPorCodigo(codigo);
      if (p) {
        const sel = document.getElementById('scProduto');
        if (sel) { sel.value = p.id; this.updateEstoqueModal(p.id); }
      }
    });
  },

  salvarCompleto(e) {
    e.preventDefault();
    const produtoId = document.getElementById('scProduto').value;
    const quantidade = parseFloat(document.getElementById('scQtd').value);
    const motivo = document.getElementById('scMotivo').value;
    const responsavel = document.getElementById('scResponsavel').value.trim();
    const obs = document.getElementById('scObs').value.trim();
    const produto = DB.getProdutoPorId(produtoId);

    DB.addMovimentacao({ tipo: 'saida', produtoId, produtoNome: produto?.nome, quantidade, motivo, observacao: obs, responsavel });
    App.showToast('Saída registrada!', 'success');
    App.closeModal();
    App.navigateTo('saida');
  },

  openLote() {
    const produtos = DB.getProdutos().filter(p => parseFloat(p.estoque||0) > 0);
    let itens = [{ produtoId: '', quantidade: '', motivo: 'Consumo interno' }];

    const renderItens = () => {
      const motivos = ['Consumo interno','Venda','Descarte/Vencimento','Ajuste de estoque'];
      return itens.map((item, i) => `
        <div style="display:flex;gap:8px;align-items:center;padding:8px;background:var(--bg-input);border-radius:8px;margin-bottom:8px" id="lote_item_${i}">
          <select style="flex:2" onchange="(function(){SaidaPage._loteItens[${i}].produtoId=this.value})()" >
            <option value="">Produto...</option>
            ${produtos.map(p=>`<option value="${p.id}" ${item.produtoId===p.id?'selected':''}>${p.nome}</option>`).join('')}
          </select>
          <input type="number" style="flex:0.7;min-width:70px" placeholder="Qtd" min="0.001" step="0.001" value="${item.quantidade||''}" onchange="SaidaPage._loteItens[${i}].quantidade=this.value" />
          <select style="flex:1" onchange="SaidaPage._loteItens[${i}].motivo=this.value">
            ${motivos.map(m=>`<option ${item.motivo===m?'selected':''}>${m}</option>`).join('')}
          </select>
          <button type="button" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:1.1rem" onclick="SaidaPage.removeLoteItem(${i})">✕</button>
        </div>
      `).join('');
    };

    SaidaPage._loteItens = itens;

    const body = `
      <div id="loteItensContainer">${renderItens()}</div>
      <button type="button" class="btn btn-secondary btn-sm mt-8" onclick="SaidaPage.addLoteItem()">+ Adicionar Item</button>
      <div class="form-group mt-16">
        <label>Responsável / Observação geral</label>
        <input type="text" id="loteObs" placeholder="Ex: Serviço do dia / Mesa 5" />
      </div>
    `;

    App.openModal('Saída em Lote', body, [
      { label: 'Cancelar', class: 'btn-secondary', action: 'App.closeModal()' },
      { label: '📤 Registrar Tudo', class: 'btn-primary', action: 'SaidaPage.salvarLote()' }
    ], 'modal-lg');
  },

  _loteItens: [],

  addLoteItem() {
    this._loteItens.push({ produtoId: '', quantidade: '', motivo: 'Consumo interno' });
    this.refreshLoteContainer();
  },

  removeLoteItem(i) {
    this._loteItens.splice(i, 1);
    this.refreshLoteContainer();
  },

  refreshLoteContainer() {
    const produtos = DB.getProdutos().filter(p => parseFloat(p.estoque||0) > 0);
    const motivos = ['Consumo interno','Venda','Descarte/Vencimento','Ajuste de estoque'];
    const container = document.getElementById('loteItensContainer');
    if (container) {
      container.innerHTML = this._loteItens.map((item, i) => `
        <div style="display:flex;gap:8px;align-items:center;padding:8px;background:var(--bg-input);border-radius:8px;margin-bottom:8px">
          <select style="flex:2" onchange="SaidaPage._loteItens[${i}].produtoId=this.value">
            <option value="">Produto...</option>
            ${produtos.map(p=>`<option value="${p.id}" ${item.produtoId===p.id?'selected':''}>${p.nome}</option>`).join('')}
          </select>
          <input type="number" style="flex:0.7;min-width:70px" placeholder="Qtd" value="${item.quantidade||''}" onchange="SaidaPage._loteItens[${i}].quantidade=parseFloat(this.value)" />
          <select style="flex:1" onchange="SaidaPage._loteItens[${i}].motivo=this.value">
            ${motivos.map(m=>`<option ${item.motivo===m?'selected':''}>${m}</option>`).join('')}
          </select>
          <button type="button" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:1.1rem" onclick="SaidaPage.removeLoteItem(${i})">✕</button>
        </div>
      `).join('');
    }
  },

  salvarLote() {
    const obs = document.getElementById('loteObs')?.value || '';
    let count = 0;
    for (const item of this._loteItens) {
      if (!item.produtoId || !item.quantidade) continue;
      const p = DB.getProdutoPorId(item.produtoId);
      if (!p) continue;
      DB.addMovimentacao({ tipo: 'saida', produtoId: p.id, produtoNome: p.nome, quantidade: parseFloat(item.quantidade), motivo: item.motivo, observacao: obs });
      count++;
    }
    if (count === 0) { App.showToast('Nenhum item válido para registrar.', 'warning'); return; }
    App.showToast(`${count} saída(s) registrada(s)!`, 'success');
    App.closeModal();
    App.navigateTo('saida');
  },

  postRender() {}
};
