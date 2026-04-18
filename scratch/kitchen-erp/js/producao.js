/**
 * producao.js — Módulo de Produção
 */

const ProducaoPage = {
  fichaPreSelecionada: null,

  render() {
    const producoes = DB.getProducoes().sort((a, b) => new Date(b.data) - new Date(a.data));
    const fichas = DB.getFichas();

    return `
      <div class="page-header">
        <div>
          <h1>🍳 Produção</h1>
          <p>Registro de produções e controle de ingredientes consumidos</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="ProducaoPage.openModal()">+ Nova Produção</button>
        </div>
      </div>

      <!-- Cards de Fichas -->
      ${fichas.length > 0 ? `
      <div class="card mb-16">
        <h3 style="font-size:.9rem;font-weight:600;color:var(--text-secondary);margin-bottom:12px">🚀 Produção Rápida — Selecione uma Ficha Técnica</h3>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          ${fichas.map(f => {
            const disponivel = FichasPage.verificarDisponibilidade(f);
            return `
              <button class="btn ${disponivel ? 'btn-secondary' : 'btn-secondary'} btn-sm"
                style="${disponivel ? 'border-color:var(--accent);color:var(--accent)' : 'opacity:.6'}"
                onclick="ProducaoPage.iniciarProducaoFicha('${f.id}')"
                title="${disponivel ? 'Iniciar produção' : 'Ingredientes insuficientes'}">
                ${disponivel ? '✅' : '⚠️'} ${f.nome}
              </button>
            `;
          }).join('')}
        </div>
      </div>` : ''}

      <!-- Histórico de Produções -->
      <div class="table-container">
        <div class="table-toolbar">
          <div style="font-weight:600;font-size:.9rem">Histórico de Produções</div>
          <span style="font-size:.8rem;color:var(--text-muted)">${producoes.length} produções</span>
        </div>
        ${producoes.length === 0 ?
          `<div class="empty-state"><div class="empty-icon">🍳</div><h3>Nenhuma produção registrada</h3><p>Clique em "+ Nova Produção" para começar</p></div>` :
          `<table>
            <thead><tr><th>Data</th><th>Produto/Ficha</th><th>Lote</th><th>Rendimento</th><th>Ingredientes Consumidos</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              ${producoes.slice(0,50).map(p => {
                const ficha = p.fichaId ? DB.getFichas().find(f => f.id === p.fichaId) : null;
                const numIng = p.ingredientesConsumidos?.length || 0;
                return `<tr>
                  <td style="font-size:.8rem;white-space:nowrap">${new Date(p.data).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'})}</td>
                  <td>
                    <strong>${p.nomeProduto || ficha?.nome || '—'}</strong>
                    ${ficha ? `<br><span style="font-size:.72rem;color:var(--text-muted)">Ficha: ${ficha.nome}</span>` : ''}
                  </td>
                  <td><code style="font-size:.75rem;color:var(--text-secondary)">${p.lote}</code></td>
                  <td class="text-accent fw-bold">${p.quantidade} ${p.unidade||'un'}</td>
                  <td style="font-size:.78rem;color:var(--text-muted)">${numIng} item(ns)</td>
                  <td><span class="badge badge-success">✅ Concluído</span></td>
                  <td>
                    <button class="btn btn-secondary btn-sm" onclick="ProducaoPage.verDetalhes('${p.id}')">👁️</button>
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>`
        }
      </div>
    `;
  },

  iniciarProducaoFicha(fichaId) {
    this.fichaPreSelecionada = fichaId;
    this.openModal();
  },

  openModal() {
    const fichas = DB.getFichas();
    const produtos = DB.getProdutos();
    const fichaId = this.fichaPreSelecionada;
    const ficha = fichaId ? fichas.find(f => f.id === fichaId) : null;

    const body = `
      <form id="formProducao" onsubmit="ProducaoPage.salvar(event)">
        <div class="form-grid">
          <div class="form-group full-width">
            <label>Ficha Técnica (opcional)</label>
            <select id="prFicha" onchange="ProducaoPage.onFichaChange(this.value)">
              <option value="">— Produção sem ficha técnica —</option>
              ${fichas.map(f => `<option value="${f.id}" ${fichaId===f.id?'selected':''}>${f.nome} (${f.rendimento} ${f.unidadeRendimento||'porções'})</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Produto Produzido *</label>
            <select id="prProduto" required>
              <option value="">Selecione...</option>
              ${produtos.map(p => `<option value="${p.id}">${p.nome}</option>`).join('')}
            </select>
            <span class="form-hint">Produto que irá para o estoque</span>
          </div>
          <div class="form-group">
            <label>Quantidade Produzida *</label>
            <input type="number" id="prQtd" required min="0.001" step="0.001" placeholder="0" value="${ficha?.rendimento||''}" />
          </div>
          <div class="form-group">
            <label>Unidade</label>
            <input type="text" id="prUnidade" placeholder="Ex: porções" value="${ficha?.unidadeRendimento||'un'}" />
          </div>
          <div class="form-group">
            <label>Data de Validade do Produto</label>
            <input type="date" id="prValidade" />
          </div>
          <div class="form-group">
            <label>Local de Armazenamento</label>
            <select id="prLocal">
              ${['Câmara Fria','Câmara Seca','Despensa','Congelador','Prateleira'].map(l=>`<option>${l}</option>`).join('')}
            </select>
          </div>
          <div class="form-group full-width">
            <label>Observações da Produção</label>
            <textarea id="prObs" placeholder="Anotações, alterações na receita..."></textarea>
          </div>
        </div>

        <div id="ingredientesConsumo" style="margin-top:16px">
          ${ficha ? this.renderIngredientesConsumo(ficha) : ''}
        </div>

        <input type="submit" style="display:none" />
      </form>
    `;

    App.openModal('Nova Produção', body, [
      { label: 'Cancelar', class: 'btn-secondary', action: 'App.closeModal(); ProducaoPage.fichaPreSelecionada = null;' },
      { label: '🍳 Registrar Produção', class: 'btn-primary', action: `document.getElementById('formProducao').requestSubmit()` }
    ], 'modal-lg');

    this.fichaPreSelecionada = null;
  },

  renderIngredientesConsumo(ficha) {
    if (!ficha?.ingredientes?.length) return '';
    return `
      <div>
        <h4 style="font-size:.85rem;font-weight:600;color:var(--text-secondary);margin-bottom:8px">📦 Ingredientes que serão consumidos do estoque:</h4>
        <div style="background:var(--bg-input);border-radius:8px;overflow:hidden">
          <table style="margin:0">
            <thead><tr><th>Ingrediente</th><th>Quantidade</th><th>Estoque Atual</th><th>Após Produção</th><th>OK?</th></tr></thead>
            <tbody>
              ${ficha.ingredientes.map(ing => {
                const p = DB.getProdutoPorId(ing.produtoId);
                const estoque = parseFloat(p?.estoque || 0);
                const consumo = parseFloat(ing.quantidade || 0);
                const apos = estoque - consumo;
                const ok = apos >= 0;
                return `<tr>
                  <td style="font-size:.83rem"><strong>${p?.nome || '—'}</strong></td>
                  <td style="font-size:.83rem">${consumo} ${ing.unidade}</td>
                  <td style="font-size:.83rem">${estoque.toFixed(2)} ${p?.unidade||''}</td>
                  <td style="font-size:.83rem" class="${ok ? 'text-accent' : 'text-danger'}">${apos.toFixed(2)} ${p?.unidade||''}</td>
                  <td><span class="badge ${ok?'badge-success':'badge-danger'}">${ok?'✅':'❌'}</span></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  onFichaChange(fichaId) {
    const ficha = fichaId ? DB.getFichas().find(f => f.id === fichaId) : null;
    const div = document.getElementById('ingredientesConsumo');
    if (div) div.innerHTML = ficha ? this.renderIngredientesConsumo(ficha) : '';

    if (ficha) {
      const qtd = document.getElementById('prQtd');
      const und = document.getElementById('prUnidade');
      if (qtd) qtd.value = ficha.rendimento;
      if (und) und.value = ficha.unidadeRendimento || 'un';
    }
  },

  salvar(e) {
    e.preventDefault();
    const fichaId = document.getElementById('prFicha').value;
    const produtoId = document.getElementById('prProduto').value;
    const quantidade = parseFloat(document.getElementById('prQtd').value);
    const unidade = document.getElementById('prUnidade').value;
    const validade = document.getElementById('prValidade').value;
    const local = document.getElementById('prLocal').value;
    const obs = document.getElementById('prObs').value;

    const produto = DB.getProdutoPorId(produtoId);
    const ficha = fichaId ? DB.getFichas().find(f => f.id === fichaId) : null;

    // Verificar disponibilidade
    if (ficha?.ingredientes) {
      for (const ing of ficha.ingredientes) {
        const p = DB.getProdutoPorId(ing.produtoId);
        if (p && parseFloat(p.estoque || 0) < parseFloat(ing.quantidade || 0)) {
          if (!confirm(`⚠️ Estoque insuficiente de "${p.nome}" (${p.estoque} < ${ing.quantidade} ${ing.unidade}). Continuar mesmo assim?`)) return;
          break;
        }
      }
    }

    const lote = DB._gerarLote();
    const ingredientesConsumidos = [];

    // Dar baixa nos ingredientes
    if (ficha?.ingredientes) {
      for (const ing of ficha.ingredientes) {
        const p = DB.getProdutoPorId(ing.produtoId);
        if (p) {
          ingredientesConsumidos.push({ produtoId: p.id, produtoNome: p.nome, quantidade: ing.quantidade, unidade: ing.unidade });
          DB.addMovimentacao({
            tipo: 'consumo',
            produtoId: p.id,
            produtoNome: p.nome,
            quantidade: ing.quantidade,
            motivo: `Produção: ${ficha.nome} (Lote ${lote})`,
            fichaId,
            loteProducao: lote
          });
        }
      }
    }

    // Registrar a produção
    const producao = DB.addProducao({
      fichaId,
      fichaName: ficha?.nome,
      produtoId,
      nomeProduto: produto?.nome,
      quantidade,
      unidade: unidade || produto?.unidade,
      validade,
      local,
      ingredientesConsumidos,
      observacoes: obs
    });

    // Adicionar ao estoque o produto produzido
    DB.addMovimentacao({
      tipo: 'entrada',
      produtoId,
      produtoNome: produto?.nome,
      quantidade,
      validade,
      lote: producao.lote,
      motivo: `Produção interna — ${ficha?.nome || 'Avulso'}`,
      producaoId: producao.id
    });

    // Criar lote do produto produzido
    DB.addLote({
      produtoId,
      produtoNome: produto?.nome,
      lote: producao.lote,
      quantidadeInicial: quantidade,
      quantidadeAtual: quantidade,
      local,
      validade,
      fornecedor: 'Produção Interna'
    });

    App.showToast(`Produção registrada! Lote: ${producao.lote}`, 'success');
    App.closeModal();
    App.navigateTo('producao');
  },

  verDetalhes(id) {
    const p = DB.getProducoes().find(pr => pr.id === id);
    if (!p) return;

    const body = `
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px">
        <div class="card" style="flex:1;min-width:140px;text-align:center">
          <div style="font-size:1.2rem;font-weight:800;color:var(--accent)">${p.quantidade} ${p.unidade||'un'}</div>
          <div style="font-size:.72rem;color:var(--text-muted)">Produzido</div>
        </div>
        <div class="card" style="flex:1;min-width:140px;text-align:center">
          <div style="font-size:1rem;font-weight:700;color:var(--info)">${p.lote}</div>
          <div style="font-size:.72rem;color:var(--text-muted)">Lote</div>
        </div>
        <div class="card" style="flex:1;min-width:140px;text-align:center">
          <div style="font-size:1rem;font-weight:700;color:var(--warning)">${p.validade || '—'}</div>
          <div style="font-size:.72rem;color:var(--text-muted)">Validade</div>
        </div>
      </div>
      ${p.ingredientesConsumidos?.length ? `
        <h4 style="font-size:.85rem;color:var(--text-secondary);margin-bottom:8px">Ingredientes Consumidos</h4>
        <div class="table-container" style="margin-bottom:12px">
          <table>
            <thead><tr><th>Ingrediente</th><th>Quantidade</th><th>Unidade</th></tr></thead>
            <tbody>
              ${p.ingredientesConsumidos.map(i=>`<tr><td>${i.produtoNome}</td><td>${i.quantidade}</td><td>${i.unidade}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}
      ${p.observacoes ? `<p style="font-size:.83rem;color:var(--text-secondary)">${p.observacoes}</p>` : ''}
    `;

    App.openModal(`Produção — ${p.nomeProduto || p.fichaName}`, body, [
      { label: 'Fechar', class: 'btn-secondary', action: 'App.closeModal()' }
    ]);
  },

  postRender() {}
};

// Helper estendido em FichasPage
FichasPage.verificarDisponibilidade = function(ficha) {
  if (!ficha?.ingredientes?.length) return true;
  return ficha.ingredientes.every(ing => {
    const p = DB.getProdutoPorId(ing.produtoId);
    return p && parseFloat(p.estoque || 0) >= parseFloat(ing.quantidade || 0);
  });
};
