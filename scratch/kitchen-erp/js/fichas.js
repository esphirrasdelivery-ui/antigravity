/**
 * fichas.js — Módulo de Fichas Técnicas (Receitas)
 */

const FichasPage = {
  ingredientesTmp: [],

  render() {
    const fichas = DB.getFichas();
    return `
      <div class="page-header">
        <div>
          <h1>📋 Fichas Técnicas</h1>
          <p>Receitas e formulações dos pratos produzidos</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="FichasPage.openModal()">+ Nova Ficha</button>
        </div>
      </div>

      ${fichas.length === 0 ? `
        <div class="empty-state card"><div class="empty-icon">📋</div><h3>Nenhuma ficha técnica</h3><p>Crie fichas técnicas para controlar a produção</p></div>
      ` : `
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px">
          ${fichas.map(f => this.renderFichaCard(f)).join('')}
        </div>
      `}
    `;
  },

  renderFichaCard(f) {
    const custo = this.calcularCusto(f);
    return `
      <div class="card" style="cursor:default;transition:all .2s" onmouseenter="this.style.borderColor='var(--accent)'" onmouseleave="this.style.borderColor='var(--border)'">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px">
          <div>
            <h3 style="font-size:1rem;font-weight:700;color:var(--text-primary)">${f.nome}</h3>
            <span class="badge badge-info" style="margin-top:4px">${f.categoria||'Geral'}</span>
          </div>
          <div style="display:flex;gap:4px">
            <button class="btn btn-secondary btn-sm" onclick="FichasPage.verDetalhes('${f.id}')" title="Ver">👁️</button>
            <button class="btn btn-secondary btn-sm" onclick="FichasPage.openModal('${f.id}')" title="Editar">✏️</button>
            <button class="btn btn-danger btn-sm" onclick="FichasPage.deletar('${f.id}')" title="Excluir">🗑️</button>
          </div>
        </div>
        <div style="display:flex;gap:16px;margin-bottom:12px">
          <div style="text-align:center">
            <div style="font-size:1.2rem;font-weight:700;color:var(--accent)">${f.rendimento}</div>
            <div style="font-size:.7rem;color:var(--text-muted)">${f.unidadeRendimento||'porções'}</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:1.2rem;font-weight:700;color:var(--info)">${f.tempoPreparo||0}min</div>
            <div style="font-size:.7rem;color:var(--text-muted)">Preparo</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:1.2rem;font-weight:700;color:var(--warning)">R$${custo.total.toFixed(2)}</div>
            <div style="font-size:.7rem;color:var(--text-muted)">Custo total</div>
          </div>
        </div>
        <div style="font-size:.78rem;color:var(--text-muted)">
          ${f.ingredientes?.length||0} ingrediente(s) • R$ ${custo.porPorcao.toFixed(2)}/porção
        </div>
        <button class="btn btn-primary w-full mt-16" style="justify-content:center" onclick="ProducaoPage.iniciarProducaoFicha('${f.id}'); App.navigateTo('producao')">
          🍳 Iniciar Produção
        </button>
      </div>
    `;
  },

  calcularCusto(ficha) {
    let total = 0;
    (ficha.ingredientes || []).forEach(ing => {
      const p = DB.getProdutoPorId(ing.produtoId);
      if (p) total += parseFloat(p.custo || 0) * parseFloat(ing.quantidade || 0);
    });
    const rendimento = parseFloat(ficha.rendimento || 1);
    return { total, porPorcao: rendimento > 0 ? total / rendimento : 0 };
  },

  openModal(id = null) {
    const ficha = id ? DB.getFichas().find(f => f.id === id) : null;
    this.ingredientesTmp = ficha ? JSON.parse(JSON.stringify(ficha.ingredientes || [])) : [];

    const categorias = ['Sopas', 'Proteínas', 'Acompanhamentos', 'Saladas', 'Sobremesas', 'Bebidas', 'Lanches', 'Geral'];
    const unidades = ['kg', 'g', 'L', 'ml', 'un', 'colher', 'xícara', 'pitada'];
    const produtos = DB.getProdutos();

    const body = `
      <form id="formFicha" onsubmit="FichasPage.salvar(event, '${id||''}')">
        <div class="form-grid">
          <div class="form-group">
            <label>Nome da Ficha *</label>
            <input type="text" id="fNome" required placeholder="Ex: Frango ao Molho" value="${ficha?.nome||''}" />
          </div>
          <div class="form-group">
            <label>Categoria</label>
            <select id="fCategoria">
              ${categorias.map(c => `<option value="${c}" ${ficha?.categoria===c?'selected':''}>${c}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Rendimento</label>
            <input type="number" id="fRendimento" min="1" step="0.1" value="${ficha?.rendimento||10}" />
          </div>
          <div class="form-group">
            <label>Unidade do Rendimento</label>
            <input type="text" id="fUnidadeRend" placeholder="Ex: porções" value="${ficha?.unidadeRendimento||'porções'}" />
          </div>
          <div class="form-group">
            <label>Tempo de Preparo (min)</label>
            <input type="number" id="fTempo" min="0" value="${ficha?.tempoPreparo||30}" />
          </div>
        </div>

        <div style="margin: 16px 0">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
            <label style="margin:0">Ingredientes</label>
            <button type="button" class="btn btn-secondary btn-sm" onclick="FichasPage.adicionarIngrediente()">+ Adicionar</button>
          </div>
          <div class="ingredient-list" id="ingredientesList">
            ${this.renderIngredientes(produtos, unidades)}
          </div>
        </div>

        <div class="form-group">
          <label>Modo de Preparo</label>
          <textarea id="fModo" rows="4" placeholder="Descreva o passo a passo...">${ficha?.modoPreparo||''}</textarea>
        </div>
        <div class="form-group">
          <label>Observações</label>
          <textarea id="fObs" rows="2" placeholder="Alérgicos, variações...">${ficha?.observacoes||''}</textarea>
        </div>
        <input type="submit" style="display:none" />
      </form>
    `;

    App.openModal(ficha ? 'Editar Ficha Técnica' : 'Nova Ficha Técnica', body, [
      { label: 'Cancelar', class: 'btn-secondary', action: 'App.closeModal()' },
      { label: 'Salvar', class: 'btn-primary', action: `document.getElementById('formFicha').requestSubmit()` }
    ], 'modal-lg');
  },

  renderIngredientes(produtos, unidades) {
    if (this.ingredientesTmp.length === 0) {
      return `<div id="emptyIng" style="text-align:center;padding:20px;color:var(--text-muted);font-size:.85rem">Nenhum ingrediente. Clique em "+ Adicionar"</div>`;
    }
    const unids = unidades || ['kg', 'g', 'L', 'ml', 'un'];
    return this.ingredientesTmp.map((ing, i) => `
      <div class="ingredient-item" id="ing_${i}">
        <select style="flex:2" onchange="FichasPage.updateIngrediente(${i}, 'produtoId', this.value)">
          <option value="">Selecione o produto...</option>
          ${(produtos || DB.getProdutos()).map(p => `<option value="${p.id}" ${ing.produtoId===p.id?'selected':''}>${p.nome} (${p.unidade})</option>`).join('')}
        </select>
        <input type="number" style="flex:0.8;min-width:70px" placeholder="Qtd" min="0" step="0.001" value="${ing.quantidade||''}" onchange="FichasPage.updateIngrediente(${i}, 'quantidade', this.value)" />
        <select style="flex:0.6" onchange="FichasPage.updateIngrediente(${i}, 'unidade', this.value)">
          ${unids.map(u => `<option value="${u}" ${ing.unidade===u?'selected':''}>${u}</option>`).join('')}
        </select>
        <button type="button" class="remove-btn" onclick="FichasPage.removerIngrediente(${i})">✕</button>
      </div>
    `).join('');
  },

  adicionarIngrediente() {
    this.ingredientesTmp.push({ produtoId: '', quantidade: '', unidade: 'kg' });
    document.getElementById('ingredientesList').innerHTML = this.renderIngredientes(DB.getProdutos(), ['kg','g','L','ml','un','colher','xícara','pitada']);
  },

  removerIngrediente(i) {
    this.ingredientesTmp.splice(i, 1);
    document.getElementById('ingredientesList').innerHTML = this.renderIngredientes(DB.getProdutos(), ['kg','g','L','ml','un','colher','xícara','pitada']);
  },

  updateIngrediente(i, campo, valor) {
    this.ingredientesTmp[i][campo] = campo === 'quantidade' ? parseFloat(valor) : valor;
    if (campo === 'produtoId' && valor) {
      const p = DB.getProdutoPorId(valor);
      if (p) this.ingredientesTmp[i].unidade = p.unidade;
    }
  },

  salvar(e, id) {
    e.preventDefault();
    const dados = {
      nome: document.getElementById('fNome').value.trim(),
      categoria: document.getElementById('fCategoria').value,
      rendimento: parseFloat(document.getElementById('fRendimento').value) || 1,
      unidadeRendimento: document.getElementById('fUnidadeRend').value.trim(),
      tempoPreparo: parseInt(document.getElementById('fTempo').value) || 0,
      ingredientes: this.ingredientesTmp.filter(i => i.produtoId && i.quantidade > 0),
      modoPreparo: document.getElementById('fModo').value.trim(),
      observacoes: document.getElementById('fObs').value.trim()
    };

    if (id) {
      DB.updateFicha(id, dados);
      App.showToast('Ficha técnica atualizada!', 'success');
    } else {
      DB.addFicha(dados);
      App.showToast('Ficha técnica criada!', 'success');
    }
    App.closeModal();
    App.navigateTo('fichas');
  },

  deletar(id) {
    const f = DB.getFichas().find(f => f.id === id);
    if (!confirm(`Excluir ficha "${f?.nome}"?`)) return;
    DB.deleteFicha(id);
    App.showToast('Ficha excluída.', 'info');
    App.navigateTo('fichas');
  },

  verDetalhes(id) {
    const f = DB.getFichas().find(fi => fi.id === id);
    if (!f) return;
    const custo = this.calcularCusto(f);

    const body = `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:20px">
        <div class="card" style="text-align:center">
          <div style="font-size:1.5rem;font-weight:800;color:var(--accent)">${f.rendimento}</div>
          <div style="font-size:.75rem;color:var(--text-muted)">${f.unidadeRendimento||'porções'}</div>
        </div>
        <div class="card" style="text-align:center">
          <div style="font-size:1.5rem;font-weight:800;color:var(--info)">${f.tempoPreparo||0}min</div>
          <div style="font-size:.75rem;color:var(--text-muted)">Tempo de Preparo</div>
        </div>
        <div class="card" style="text-align:center">
          <div style="font-size:1.5rem;font-weight:800;color:var(--warning)">R$ ${custo.porPorcao.toFixed(2)}</div>
          <div style="font-size:.75rem;color:var(--text-muted)">Custo/porção</div>
        </div>
      </div>

      <h4 style="font-size:.85rem;font-weight:600;color:var(--text-secondary);margin-bottom:8px">INGREDIENTES</h4>
      <div class="table-container" style="margin-bottom:16px">
        <table>
          <thead><tr><th>Produto</th><th>Quantidade</th><th>Unidade</th><th>Custo</th><th>Disponível</th></tr></thead>
          <tbody>
            ${(f.ingredientes||[]).map(ing => {
              const p = DB.getProdutoPorId(ing.produtoId);
              const custoIng = p ? parseFloat(p.custo||0) * parseFloat(ing.quantidade||0) : 0;
              const disponivel = p ? parseFloat(p.estoque||0) >= parseFloat(ing.quantidade||0) : false;
              return `<tr>
                <td><strong>${p?.nome || ing.nome || '—'}</strong></td>
                <td>${ing.quantidade}</td>
                <td>${ing.unidade}</td>
                <td>R$ ${custoIng.toFixed(2)}</td>
                <td><span class="badge ${disponivel?'badge-success':'badge-danger'}">${disponivel?'✅ OK':'❌ Insuf.'}</span></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>

      ${f.modoPreparo ? `
        <h4 style="font-size:.85rem;font-weight:600;color:var(--text-secondary);margin-bottom:8px">MODO DE PREPARO</h4>
        <div style="background:var(--bg-input);border-radius:8px;padding:12px;font-size:.85rem;line-height:1.6;white-space:pre-line">${f.modoPreparo}</div>
      ` : ''}
    `;

    App.openModal(f.nome, body, [
      { label: 'Fechar', class: 'btn-secondary', action: 'App.closeModal()' },
      { label: '🍳 Iniciar Produção', class: 'btn-primary', action: `App.closeModal();ProducaoPage.iniciarProducaoFicha('${f.id}');App.navigateTo('producao')` }
    ], 'modal-lg');
  },

  postRender() {}
};
