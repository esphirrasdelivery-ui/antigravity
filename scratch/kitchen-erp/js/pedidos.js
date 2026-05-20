/**
 * pedidos.js
 * Módulo de Gerenciamento de Metas (Par-Level) e Separação (Picking & Packing)
 */

window.PedidosPage = {
  activeSeparacao: null, // ID do pedido em separação

  ITENS_FIXOS: [
    "Pepperoni", "Carne Hamburguer", "Bacon em cubos", "Calabresa triturada", "Carne moída", 
    "Carne de Panela", "Cebola caramelizada", "Filé em Cubos", "Frango Desfiado", "Frango defumado", 
    "Lombo Assado", "Mexicana", "Mini kibe", "Mistura Liquida", "Mistura para maionese", 
    "Mistura Seca 5 kg", "Mistura Seca 15 kg", "Molho Gorgonzola", "Presunto triturado", "Chocolate Branco",
    "Caixa 1", "Caixa 2", "Caixa 4", "Caixa 6", "Caixa 8", "Caixa 12", 
    "Tira P", "Tira G", "Bandeja P", "Bandeja G", "Papel Bandeja", 
    "Garra 300ml", "Garra 1 litro",
    "Coca-Cola 2L", "Coca-Cola Zero 2L", "Guaraná Antarctica 2L", "Fanta Laranja 2L", "Fanta Uva 2L", "Sprite 2L", "Kuat 2L",
    "Coca-Cola Lata", "Coca-Cola Zero Lata", "Guaraná Lata", "Fanta Lata", "Sprite Lata", "H2OH! Limão",
    "Água sem gás 500ml", "Água com gás 500ml", "Suco Del Valle 1L", "Tônica Lata",
    "Multiuso Caixa", "Detergente Caixa", "Cloro Galão", "Sabão pó CX 500G", "Bombril Pacote",
    "Esponja fina pacote", "Esponja grossa UN", "Limpador Forno", "Saco Lixo 100L Fardo",
    "Saco Lixo 200 l Fardo", "Luva Preta Caixa", "Touca Pacote", "Papel para mãos"
  ],

  LOJAS_FIXAS: ["VALPARAISO", "VITORIA", "ITAPARICA", "GUARAPARI", "LINHARES", "ITAPOÃ", "Outro"],

  LOJAS_CORES: {
    'GUARAPARI': { bg: '#111111', text: '#ffffff' },
    'VITORIA':   { bg: '#1d4ed8', text: '#ffffff' },
    'ITAPOÃ':    { bg: '#ea580c', text: '#ffffff' },
    'ITAPOA':    { bg: '#ea580c', text: '#ffffff' },
    'ITAPARICA': { bg: '#16a34a', text: '#ffffff' },
    'VALPARAISO': { bg: '#eab308', text: '#000000' },
  },

  _corLoja(loja) {
    return this.LOJAS_CORES[(loja || '').toUpperCase()] || { bg: '#6b7280', text: '#ffffff' };
  },

  _badgeLoja(loja) {
    const c = this._corLoja(loja);
    return `<span style="display:inline-block;padding:3px 12px;border-radius:20px;font-weight:700;font-size:.85rem;letter-spacing:.03em;background:${c.bg};color:${c.text}">${loja}</span>`;
  },

  render() {
    // Limpa itens expirados a cada abertura da aba
    DB.limparLixeiraExpirada();
    if (this.activeSeparacao) return this.renderSeparacaoView();
    if (this.viewLixeira) return this.renderLixeiraView();
    return this.renderListView();
  },

  postRender() {
    // Inicialização se necessário
  },

  // Busca a config de meta da loja informada, ou 0 se n tiver
  getMetaLojaCache: function(lojaStr) {
      if(!this._metasCache) this._metasCache = DB.getMetas();
      const meta = this._metasCache.find(m => m.loja === lojaStr);
      return meta ? meta.itens : {};
  },

  // ===== VIEW DE LISTAGEM =====
  renderListView() {
    const pedidos = DB.getPedidos() || [];
    this._metasCache = DB.getMetas(); // recarrega pro render
    
    // Sort desc by data
    pedidos.sort((a,b) => new Date(b.data).getTime() - new Date(a.data).getTime());

    let rows = '';
    
    if (pedidos.length === 0) {
      rows = `<tr><td colspan="5" class="text-center" style="padding:40px;color:var(--text-muted)">Nenhum inventário recebido das lojas ainda.</td></tr>`;
    } else {
      pedidos.forEach(p => {
        const dataStr = new Date(p.data).toLocaleString('pt-BR');
        let statusBadge = '';
        if(p.status === 'pendente') statusBadge = `<span class="badge" style="background:var(--warning-dim);color:var(--warning)">A Separar</span>`;
        else if(p.status === 'conferido') statusBadge = `<span class="badge" style="background:var(--info-dim);color:var(--info)">Separado/Enviado</span>`;
        else statusBadge = `<span class="badge">${p.status}</span>`;

        let acoes = '';
        if(p.status === 'pendente') {
          acoes = `
            <button class="btn btn-secondary btn-sm" onclick="PedidosPage.imprimirRomaneio('${p.id}')">📄 Romaneio</button>
            <button class="btn btn-primary btn-sm" onclick="PedidosPage.iniciarSeparacao('${p.id}')">📦 Conferir e Separar</button>
            <button class="btn btn-sm" onclick="PedidosPage.excluirPedido('${p.id}')" style="background:var(--danger);color:#fff;border:none;border-radius:6px;padding:5px 10px;cursor:pointer;margin-left:4px" title="Excluir pedido">🗑️</button>
          `;
        } else {
          acoes = `
            <button class="btn btn-secondary btn-sm" onclick="PedidosPage.imprimirRomaneio('${p.id}')">📄 Ver Romaneio</button>
            <button class="btn btn-sm" onclick="PedidosPage.excluirPedido('${p.id}')" style="background:var(--danger);color:#fff;border:none;border-radius:6px;padding:5px 10px;cursor:pointer;margin-left:4px" title="Excluir pedido">🗑️</button>
          `;
        }

        // Calcula quantos itens de fato serão repostos
        const metasLoja = this.getMetaLojaCache(p.loja);
        let enviosNecessarios = 0;
        
        if (p.itens) {
            p.itens.forEach(i => {
                const max = Number(metasLoja[i.nome] || 0);
                const atual = Number(i.quantidade || 0);
                const enviar = max - atual;
                if(enviar > 0) enviosNecessarios += enviar;
            });
        }

        let volStr;
        if (p.tipoPedido === 'direto') {
          const qtdItens = (p.itens || []).filter(i => Number(i.quantidade) > 0).length;
          volStr = `<span style="color:var(--info)">${qtdItens} iten(s) solicitados diretamente</span>`;
        } else {
          volStr = `${enviosNecessarios} envios (calculado)`;
          if (enviosNecessarios === 0 && p.status === 'pendente') volStr = '<span style="color:var(--danger)">Estoque cheio / Sem estoque máximo</span>';
        }

        rows += `
          <tr>
            <td>#${p.id.substring(3, 9)}</td>
            <td>${this._badgeLoja(p.loja)}</td>
            <td>${dataStr}</td>
            <td>${statusBadge}</td>
            <td>${volStr}</td>
            <td style="text-align:right">${acoes}</td>
          </tr>
        `;
      });
    }

    return `
      <div class="card">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <h2>🛒 Inventários / Romaneios de Loja</h2>
            <p>Gerencie as solicitações feitas pelas filiais baseadas no Estoque Máximo, emita romaneios e faça baixa via scanner.</p>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <button class="btn btn-outline" onclick="PedidosPage.abrirModalCatalogo()">📋 Itens do Formulário</button>
            <button class="btn btn-outline" onclick="PedidosPage.abrirModalMetas()">⚙️ Cfg Estoque Máximo Lojas</button>
            <button class="btn btn-outline" onclick="PedidosPage.abrirLixeira()" style="position:relative">
              🗑️ Lixeira
              ${DB.getLixeira().length > 0 ? `<span style="position:absolute;top:-6px;right:-6px;background:var(--danger);color:#fff;border-radius:50%;width:18px;height:18px;font-size:.68rem;display:flex;align-items:center;justify-content:center;font-weight:700">${DB.getLixeira().length}</span>` : ''}
            </button>
          </div>
        </div>
        <div class="card-body" style="overflow-x:auto;">
          <table class="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Loja Destino</th>
                <th>Data Inclusão</th>
                <th>Status</th>
                <th>Reposição (Par-Level)</th>
                <th style="text-align:right">Ações</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;
  },

  excluirPedido(id) {
    const pedidos = DB.getPedidos() || [];
    const pedido  = pedidos.find(p => p.id === id);
    if (!pedido) return;
    const label = `#${id.substring(3, 9)} — ${pedido.loja}`;
    if (!confirm(`Mover o pedido ${label} para a Lixeira?\n\nVocê poderá restaurá-lo por até 60 meses.`)) return;
    DB.deletePedido(id);
    App.showToast(`🗑️ Pedido ${label} movido para a Lixeira.`, 'success');
    App.navigateTo('pedidos');
  },

  abrirLixeira() {
    this.viewLixeira = true;
    App.navigateTo('pedidos');
  },

  fecharLixeira() {
    this.viewLixeira = false;
    App.navigateTo('pedidos');
  },

  restaurarPedido(id) {
    if (!confirm('Restaurar este pedido para a fila de separação?')) return;
    DB.restaurarDaLixeira(id);
    App.showToast('♻️ Pedido restaurado com sucesso!', 'success');
    App.navigateTo('pedidos');
  },

  excluirPermanente(id) {
    const item = DB.getLixeira().find(i => i.id === id);
    if (!item) return;
    const label = `#${id.substring(3,9)} — ${item.loja}`;
    if (!confirm(`ATENÇÃO: Excluir PERMANENTEMENTE o pedido ${label}?\n\nEsta ação NÃO pode ser desfeita.`)) return;
    DB.excluirDaLixeiraPermanentemente(id);
    App.showToast('❌ Pedido excluído permanentemente.', 'error');
    App.navigateTo('pedidos');
  },

  renderLixeiraView() {
    const lixeira = DB.getLixeira().sort((a,b) => new Date(b._deletadoEm) - new Date(a._deletadoEm));

    let rows = '';
    if (lixeira.length === 0) {
      rows = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">🗑️ Lixeira vazia</td></tr>`;
    } else {
      lixeira.forEach(p => {
        const deletadoEm = new Date(p._deletadoEm).toLocaleString('pt-BR');
        const expiraEm   = new Date(p._expiraEm);
        const diasRestantes = Math.ceil((expiraEm - new Date()) / (1000*60*60*24));
        const expiraLabel = diasRestantes > 0
          ? `<span style="font-size:.75rem;color:var(--text-muted)">${diasRestantes} dias restantes</span>`
          : `<span style="font-size:.75rem;color:var(--danger)">Expirado</span>`;

        rows += `
          <tr style="opacity:.85">
            <td>#${p.id.substring(3,9)}</td>
            <td><strong>${p.loja}</strong></td>
            <td>${deletadoEm}</td>
            <td><span class="badge" style="background:var(--bg-secondary);color:var(--text-muted)">${p.status}</span></td>
            <td>${expiraLabel}</td>
            <td style="text-align:right">
              <button class="btn btn-secondary btn-sm" onclick="PedidosPage.restaurarPedido('${p.id}')">♻️ Restaurar</button>
              <button class="btn btn-sm" onclick="PedidosPage.excluirPermanente('${p.id}')" style="background:var(--danger);color:#fff;border:none;border-radius:6px;padding:5px 10px;cursor:pointer;margin-left:4px">❌ Excluir</button>
            </td>
          </tr>
        `;
      });
    }

    return `
      <div class="card">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <h2>🗑️ Lixeira de Pedidos</h2>
            <p>Pedidos excluídos são mantidos por <strong>60 meses</strong> antes de serem apagados definitivamente.</p>
          </div>
          <button class="btn btn-outline" onclick="PedidosPage.fecharLixeira()">← Voltar aos Pedidos</button>
        </div>
        <div class="card-body" style="overflow-x:auto">
          <table class="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Loja</th>
                <th>Excluído em</th>
                <th>Status original</th>
                <th>Expira em</th>
                <th style="text-align:right">Ações</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;
  },

  // ===== GERENCIAMENTO DO CATÁLOGO DE ITENS DO FORMULÁRIO =====
  _catTab: 0, // ííndice da aba ativa no moídal de catálogo

  abrirModalCatalogo() {
    this._catTab = 0;
    App.openModal('📋 Itens do Formulário de Pedidos', this._renderCatalogoBody(), [
      { label: 'Fechar', class: 'btn-secondary', action: 'App.closeModal()' },
      { label: '💾 Salvar Tudo', class: 'btn-primary', action: 'PedidosPage.salvarCatalogo()' }
    ], 'modal-lg');
  },

  restaurarCatalogoPadrao() {
    if (!confirm('Restaurar o catalogo para os itens padrao?\nTodos os itens customizados serao perdidos.')) return;
    DB.saveCatalogoPedido(DB._catalogoPadrao());
    this._catTab = 0;
    const modalBodyEl = document.getElementById('modalBody');
    if (modalBodyEl) modalBodyEl.innerHTML = this._renderCatalogoBody();
    App.showToast('Catalogo restaurado para o padrao!', 'success');
  },

  _renderCatalogoBody() {
    const cats = DB.getCatalogoPedido();

    // Abas de categorias
    const tabs = cats.map((c, i) => `
      <button type="button"
        id="catTab_${i}"
        onclick="PedidosPage._trocarCatTab(${i})"
        style="padding:8px 18px; border:none; border-radius:8px 8px 0 0; cursor:pointer; font-weight:600; font-size:.9rem; font-family:inherit;
               background:${i===this._catTab?'var(--bg-card)':'var(--bg-secondary)'};
               color:${i===this._catTab?'var(--accent)':'var(--text-muted)'};
               border-bottom: ${i===this._catTab?'2px solid var(--accent)':'2px solid transparent'}">
        ${c.icon} ${c.nome}
      </button>
    `).join('');

    // Painel da aba ativa
    const cat = cats[this._catTab];

    // Recheios: somente leitura — gerenciado pelo cadastro de produtos
    if (cat.id === 'insumos') {
      const temProdutos = DB.getProdutos().some(p => p.categoria === 'Recheios');
      const linhasRO = cat.itens.map(item => `
        <tr>
          <td style="padding:7px 6px;font-size:.9rem">${item.nome}</td>
          <td style="padding:7px 6px;text-align:center;font-size:.88rem;color:var(--text-muted)">${item.max || 0}</td>
          <td style="padding:7px 6px;font-size:.85rem;color:var(--text-muted)">${item.fornecedor || '—'}</td>
        </tr>
      `).join('');

      const painel = `
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:0 8px 8px 8px;padding:20px">
          <div style="background:rgba(59,130,246,.08);border:1px solid rgba(59,130,246,.25);border-radius:8px;padding:14px 16px;margin-bottom:16px;font-size:.88rem;color:var(--text-secondary)">
            <strong style="color:var(--info)">Gerenciado pelo Cadastro de Produtos</strong><br>
            Os Recheios são derivados automaticamente dos produtos com categoria <strong>"Recheios"</strong>. Para editar, adicionar ou remover itens, use a aba <strong>Produtos</strong> do menu principal.
            ${!temProdutos ? `<br><br><button onclick="PedidosPage.migrarRecheiosParaERP()" style="background:var(--accent);color:#000;border:none;border-radius:7px;padding:8px 18px;font-weight:700;cursor:pointer;font-size:.88rem;margin-top:4px">⬆️ Importar itens atuais para o ERP</button>` : ''}
          </div>
          <div style="max-height:42vh;overflow-y:auto">
            <table style="width:100%;border-collapse:collapse">
              <thead><tr style="font-size:.78rem;color:var(--text-muted)">
                <th style="padding:4px 6px;text-align:left">Item</th>
                <th style="padding:4px 6px;text-align:center">Máx. Padrão</th>
                <th style="padding:4px 6px;text-align:left">Fornecedor</th>
              </tr></thead>
              <tbody>${linhasRO || '<tr><td colspan="3" style="padding:20px;text-align:center;color:var(--text-muted)">Nenhum produto com categoria Recheios cadastrado ainda.</td></tr>'}</tbody>
            </table>
          </div>
        </div>
      `;
      return `<div style="margin-bottom:-1px;display:flex;gap:4px;flex-wrap:wrap">${tabs}</div>${painel}`;
    }

    const _lojaAbbr = {VALPARAISO:'VALP',VITORIA:'VIT',ITAPARICA:'ITPAR',GUARAPARI:'GUAR',LINHARES:'LIN','ITAPOÃ':'ITPOA',Outro:'OUT'};
    const _lojaPills = (item, idx) => this.LOJAS_FIXAS.map((l, li) => {
      const checked = (item.lojas || []).includes(l);
      return `<label style="display:inline-flex;align-items:center;gap:3px;cursor:pointer;font-size:.65rem;font-weight:700;padding:2px 7px;border-radius:10px;border:1px solid ${checked?'rgba(59,130,246,.45)':'var(--border)'};background:${checked?'rgba(59,130,246,.1)':'var(--bg-secondary)'};color:${checked?'var(--info)':'var(--text-muted)'};transition:all .1s">
        <input type="checkbox" id="catLoja_${idx}_${li}" style="width:11px;height:11px;cursor:pointer;accent-color:var(--info)" ${checked?'checked':''}> ${_lojaAbbr[l]||l}
      </label>`;
    }).join('');

    const linhas = cat.itens.map((item, idx) => `
      <tr id="catRow_${idx}">
        <td style="padding:8px 6px">
          <input type="text" class="input-form" style="padding:6px 10px;font-size:.88rem"
            id="catNome_${idx}" value="${item.nome.replace(/"/g,'&quot;')}" />
        </td>
        <td style="padding:8px 6px; width:80px">
          <input type="number" class="input-form" style="padding:6px;text-align:center;font-size:.88rem"
            id="catMax_${idx}" value="${item.max}" min="0" />
        </td>
        <td style="padding:8px 6px">
          <input type="text" class="input-form" style="padding:6px 10px;font-size:.88rem"
            id="catForn_${idx}" value="${(item.fornecedor||'').replace(/"/g,'&quot;')}" placeholder="Fornecedor(es)..." />
        </td>
        <td style="padding:8px 6px;min-width:220px">
          <div style="display:flex;flex-wrap:wrap;gap:4px">${_lojaPills(item, idx)}</div>
        </td>
        <td style="padding:8px 6px; width:40px; text-align:center">
          <button type="button" onclick="PedidosPage._deletarItemCatalogo(${idx})"
            style="background:var(--danger);color:#fff;border:none;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:.85rem"
            title="Remover item">✕</button>
        </td>
      </tr>
    `).join('');

    const painel = `
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:0 8px 8px 8px;padding:16px;">
        <div style="font-size:.78rem;color:var(--text-muted);margin-bottom:12px">
          ${cat.itens.length} itens — marque as lojas em que cada item deve aparecer no formulário. <strong>Sem nenhuma marcada = aparece em todas.</strong>
        </div>
        <div style="max-height:45vh;overflow:auto">
          <table style="width:100%;border-collapse:collapse;min-width:700px">
            <thead>
              <tr style="font-size:.75rem;color:var(--text-muted);">
                <th style="padding:4px 6px;text-align:left">Nome do Item</th>
                <th style="padding:4px 6px;text-align:center">Máx.</th>
                <th style="padding:4px 6px;text-align:left">Fornecedor(es)</th>
                <th style="padding:4px 6px;text-align:left">Lojas que recebem este item</th>
                <th></th>
              </tr>
            </thead>
            <tbody>${linhas || '<tr><td colspan="5" style="padding:20px;text-align:center;color:var(--text-muted)">Nenhum item cadastrado</td></tr>'}</tbody>
          </table>
        </div>
        <div style="margin-top:14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding-top:12px;border-top:1px solid var(--border)">
          <input type="text" class="input-form" id="novoItemNome" placeholder="Nome do novo item..." style="flex:2;min-width:150px;padding:8px 12px;font-size:.9rem" />
          <input type="number" class="input-form" id="novoItemMax" placeholder="Máx" min="0" value="0" style="width:70px;padding:8px;text-align:center;font-size:.9rem" />
          <input type="text" class="input-form" id="novoItemForn" placeholder="Fornecedor(es)..." style="flex:2;min-width:150px;padding:8px 12px;font-size:.9rem" />
          <button type="button" onclick="PedidosPage._adicionarItemCatalogo()"
            style="background:var(--accent);color:#000;border:none;border-radius:8px;padding:8px 18px;cursor:pointer;font-weight:700;white-space:nowrap"
          >+ Adicionar</button>
        </div>
      </div>
    `;

    return `
      <div style="margin-bottom:-1px;display:flex;gap:4px;flex-wrap:wrap">${tabs}</div>
      ${painel}
    `;
  },

  _trocarCatTab(idx) {
    // Persiste edições da aba atual antes de trocar
    this._coletarEdicoesDaAba();
    this._catTab = idx;
    // Re-renderiza só o corpo do moídal sem fechar
    const modalBodyEl = document.getElementById('modalBody');
    if (modalBodyEl) modalBodyEl.innerHTML = this._renderCatalogoBody();
  },

  _coletarEdicoesDaAba() {
    const cats = DB.getCatalogoPedido();
    const cat  = cats[this._catTab];
    if (!cat || cat.id === 'insumos') return; // Recheios é somente leitura
    const newItens = [];
    cat.itens.forEach((_, idx) => {
      const nEl = document.getElementById('catNome_' + idx);
      const mEl = document.getElementById('catMax_'  + idx);
      const fEl = document.getElementById('catForn_' + idx);
      if (nEl) {
        const nome = nEl.value.trim();
        if (nome) {
          const lojas = this.LOJAS_FIXAS.filter((_, li) => {
            const cb = document.getElementById(`catLoja_${idx}_${li}`);
            return cb && cb.checked;
          });
          newItens.push({ nome, max: parseInt(mEl?.value) || 0, fornecedor: fEl?.value.trim() || '', lojas });
        }
      }
    });
    // Reordena alfabéticamente após edição
    newItens.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));
    cat.itens = newItens;
    DB.saveCatalogoPedido(cats);
  },

  _adicionarItemCatalogo() {
    const nomeEl = document.getElementById('novoItemNome');
    const maxEl  = document.getElementById('novoItemMax');
    const nome   = (nomeEl?.value || '').trim();
    if (!nome) { App.showToast('Digite o nome do item!', 'warning'); return; }

    const fornEl = document.getElementById('novoItemForn');
    this._coletarEdicoesDaAba();
    const cats = DB.getCatalogoPedido();
    cats[this._catTab].itens.push({ nome, max: parseInt(maxEl?.value) || 0, fornecedor: fornEl?.value.trim() || '', lojas: [] });
    // Mantém ordem alfabética
    cats[this._catTab].itens.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));
    DB.saveCatalogoPedido(cats);

    const modalBodyEl = document.getElementById('modalBody');
    if (modalBodyEl) modalBodyEl.innerHTML = this._renderCatalogoBody();
    App.showToast(`✅ "${nome}" adicionado em ordem alfabética!`, 'success');
  },

  _deletarItemCatalogo(idx) {
    this._coletarEdicoesDaAba();
    const cats = DB.getCatalogoPedido();
    const item = cats[this._catTab].itens[idx];
    if (!item) return;
    if (!confirm(`Remover "${item.nome}" da categoria?`)) return;
    cats[this._catTab].itens.splice(idx, 1);
    DB.saveCatalogoPedido(cats);
    const modalBodyEl = document.getElementById('modalBody');
    if (modalBodyEl) modalBodyEl.innerHTML = this._renderCatalogoBody();
    App.showToast(`🗑️ Item removido!`, 'success');
  },

  salvarCatalogo() {
    this._coletarEdicoesDaAba();
    // Salva apenas as categorias não-Recheios (Recheios é gerenciado pelo cadastro de produtos)
    const cats = DB.getCatalogoPedido().filter(c => c.id !== 'insumos');
    DB.saveCatalogoPedido(cats);
    App.showToast('Catalogo salvo e sincronizado!', 'success');
    App.closeModal();
  },

  // ===== CONFIGURAÇÃO DE METAS (PAR-LEVEL) =====
  abrirModalMetas() {
      const lojasOpts = this.LOJAS_FIXAS.map(l => `<option value="${l}">${l}</option>`).join('');
      
      const body = `
        <div class="form-group" style="margin-bottom:20px;">
          <label>Selecione a Loja para Configurar o Estoque Máximo</label>
          <select id="selLojaMeta" class="input-form" onchange="PedidosPage.carregarInputsMeta(this.value)">
            <option value="">Selecione...</option>
            ${lojasOpts}
          </select>
        </div>
        <div id="metasContainer" style="display:none; max-height: 50vh; overflow-y:auto; padding-right:10px;">
           <div class="alert alert-info">Digite o ESTOQUE MÁXIMO IDEAL que a loja deve ter de cada item. Se não houver teto, deixe 0.</div>
           <div class="grid" style="grid-template-columns: 1fr 1fr; gap:10px;" id="metasGrid">
           </div>
        </div>
      `;

      App.openModal('⚙️ Configurar Estoque Máximo por Loja', body, [
          { label: 'Cancelar', class: 'btn-secondary', action: 'App.closeModal()' },
          { label: 'Salvar Estoque Máximo', class: 'btn-primary', action: 'PedidosPage.salvarMetasLoja()' },
      ], 'modal-lg');
  },

  carregarInputsMeta(lojaStr) {
      if(!lojaStr) {
          document.getElementById('metasContainer').style.display='none';
          return;
      }
      
      // Busca DB
      const metasDB = DB.getMetas();
      const metaDaLoja = metasDB.find(m => m.loja === lojaStr);
      const confData = metaDaLoja ? metaDaLoja.itens : {};

      // Busca itens direto do catálogo dinâmico (mesmo que o formulário de pedidos)
      const catalogo = DB.getCatalogoPedido();
      let html = '';

      catalogo.forEach(cat => {
          // Título da categoria como separador visual
          html += `
            <div style="grid-column:1/-1; padding:6px 0 2px; margin-top:8px; border-bottom:1px solid var(--border)">
              <span style="font-size:.75rem; font-weight:700; color:var(--accent); letter-spacing:.06em; text-transform:uppercase">
                ${cat.icon} ${cat.nome}
              </span>
            </div>
          `;

          // Itens da categoria em ordem alfabética
          const itensOrdenados = [...cat.itens].sort((a, b) =>
            (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' })
          );

          itensOrdenados.forEach(item => {
              const nome = typeof item === 'object' ? item.nome : item;
              const val  = confData[nome] || 0;
              html += `
                <div style="background:var(--bg-secondary); padding:10px; border-radius:6px; border:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
                   <label style="margin:0; font-size:0.9rem">${nome}</label>
                   <input type="number" min="0" data-item="${nome}" class="input-meta" value="${val}" style="width:70px; text-align:center; padding:5px; border-radius:4px; border:1px solid var(--border); background:var(--bg-primary); color:var(--text-primary);" />
                </div>
              `;
          });
      });

      document.getElementById('metasGrid').innerHTML = html;
      document.getElementById('metasContainer').style.display = 'block';
  },

  salvarMetasLoja() {
      const lojaStr = document.getElementById('selLojaMeta').value;
      if(!lojaStr) return alert("Selecione a loja primeiro.");

      const inputs = document.querySelectorAll('.input-meta');
      const objParams = {};
      inputs.forEach(inp => {
          const item = inp.getAttribute('data-item');
          const val = parseInt(inp.value) || 0;
          objParams[item] = val;
      });

      DB.updateMeta(lojaStr, objParams);
      App.showToast(`✅ Estoque máximo atualizado para ${lojaStr}!`, 'success');
      App.closeModal();
      App.navigateTo('pedidos'); // atualiza calculos visuais
  },

  // ===== LÓGICA DE ROMANEIO (CÁLCULO E INIMPRESSÃO) =====
  calcularItensAEnviar(pedido) {
      // Modo direto: a loja já informou a quantidade que quer receber
      if (pedido.tipoPedido === 'direto') {
          return pedido.itens
              .filter(i => Number(i.quantidade || 0) > 0)
              .map(i => ({
                  nome:          i.nome,
                  estoqueNaLoja: null, // não se aplica no modo direto
                  quantidade:    Number(i.quantidade),
                  separado:      i.separado || 0
              }));
      }

      // Modo inventário: calcula pelo par-level (max - estoque atual)
      const metas = DB.getMetas();
      const metaDaLoja = metas.find(m => m.loja === pedido.loja);
      const limites = metaDaLoja ? metaDaLoja.itens : {};

      const itensRepor = [];
      pedido.itens.forEach(i => {
          const limite = Number(limites[i.nome] || 0);
          const estoqueAtual = Number(i.quantidade || 0);
          const aMandar = limite - estoqueAtual;
          if (aMandar > 0) {
              itensRepor.push({
                  nome: i.nome,
                  estoqueNaLoja: estoqueAtual,
                  quantidade: aMandar,
                  separado: i.separado || 0
              });
          }
      });
      return itensRepor;
  },

  // ===== VIEW DE SEPARAÇÃO (PICKING) =====
  iniciarSeparacao(pedidoId) {
    this.activeSeparacao = pedidoId;
    App.navigateTo('pedidos');
  },

  cancelarSeparacao() {
    this.activeSeparacao = null;
    App.navigateTo('pedidos');
  },

  renderSeparacaoView() {
    const pedidos = DB.getPedidos();
    const pedido = pedidos.find(p => p.id === this.activeSeparacao);
    
    if(!pedido) return '<div class="alert alert-danger">Pedido não encontrado.</div>';

    // 1. Calcula o que de fato tem que mandar via Par-Level
    const itensAEnviar = this.calcularItensAEnviar(pedido);

    if (itensAEnviar.length === 0) {
        return `
            <div class="card" style="max-width:800px; margin:0 auto; padding:40px; text-align:center">
                <h2>Não há itens para separar!</h2>
                <p style="color:var(--text-muted)">O estoque relatado pelo gerente da loja ${pedido.loja} já atingiu ou excedeu o estoque máximo configurado para essa loja. Zero repasses calculados.</p>
                <br/>
                <button class="btn btn-primary" onclick="PedidosPage.finalizarPedido(true)">Baixar Diretamente no Sistema como Finalizado</button>
                <button class="btn btn-secondary" onclick="PedidosPage.cancelarSeparacao()">Voltar</button>
            </div>
        `;
    }

    let itemsHtml = '';
    let prontos = 0;
    
    itensAEnviar.forEach((item, index) => {
      const isDone = item.separado >= item.quantidade;
      if (isDone) prontos++;
      
      const pct = Math.min(100, Math.floor(((item.separado || 0) / item.quantidade) * 100));

      // Buscar o produto no ERP para exibir o código e unidade
      const prodERP = DB.getProdutos().find(p =>
        p.nome.toLowerCase() === item.nome.toLowerCase() ||
        p.nome.toLowerCase().includes(item.nome.toLowerCase()) ||
        item.nome.toLowerCase().includes(p.nome.toLowerCase())
      );
      const codInterno  = prodERP ? (prodERP.codigoInterno || '—') : '—';
      const unidade     = prodERP ? (prodERP.unidade || 'un') : 'un';
      const isKg        = ['kg','g','L','ml'].includes(unidade);
      const sepDisplay  = isKg
        ? `${(item.separado || 0).toFixed(3)} ${unidade}`
        : `${item.separado || 0} ${unidade}`;
      const metaDisplay = isKg
        ? `${item.quantidade.toFixed(3)} ${unidade}`
        : `${item.quantidade} ${unidade}`;
      
      itemsHtml += `
        <div class="item-separacao" style="background: ${isDone ? 'var(--accent-dim)' : 'var(--bg-secondary)'}; padding:15px; border-radius:8px; margin-bottom:12px; border:1px solid var(--border)">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px">
            <div>
              <strong style="font-size:1.1rem; color:${isDone ? 'var(--accent)' : 'var(--text-primary)'}">${item.nome}</strong>
              <div style="font-size:0.78rem; color:var(--text-muted); margin-top:2px">
                Cód: <code style="background:var(--bg-card);padding:1px 5px;border-radius:3px">${codInterno}</code>
                &nbsp;|&nbsp; Estoque loja: ${item.estoqueNaLoja} &nbsp;|&nbsp; Est. Máx: ${item.estoqueNaLoja + item.quantidade}
              </div>
            </div>
            <div style="font-size:1.1rem; font-weight:bold; color:${isDone ? 'var(--accent)' : 'var(--warning)'}; text-align:right; min-width:120px">
              ${sepDisplay} / ${metaDisplay}
            </div>
          </div>
          <div style="height:8px; width:100%; background:var(--bg-card); border-radius:4px; overflow:hidden">
            <div style="height:100%; width:${pct}%; background:var(--accent); transition: width 0.3s"></div>
          </div>
        </div>
      `;
    });

    const isTotalDone = prontos === itensAEnviar.length;

    return `
      <div class="card" style="max-width:800px; margin: 0 auto;">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <h2>📦 Reposição: ${this._badgeLoja(pedido.loja)}</h2>
            <p>Pegue o leitor e bip os códigos de barras de cada produto listado até completar a quantidade.</p>
          </div>
          <button class="btn btn-secondary" onclick="PedidosPage.cancelarSeparacao()">Listagem</button>
        </div>
        <div class="card-body">
          <div class="alert alert-info" style="margin-bottom:20px; font-weight:bold">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:8px; vertical-align:middle"><path d="M4 7V4h16v3M9 20h6M12 14v6M4 20h2"/></svg>
            Leitor de Código de Barras ativo. Pode começar a bipar os produtos...
          </div>
          
          <div style="display:flex; margin-bottom:20px; gap:10px">
              <input type="text" id="manualSimScanner" class="input-form" placeholder="Digitar código manually e dar ENTER (teste)" onkeydown="if(event.key==='Enter') PedidosPage.onBarcodeScanned(this.value)" style="flex:1" />
          </div>

          <div id="separacaoLista">
            ${itemsHtml}
          </div>

          <div style="margin-top:30px; border-top:1px solid var(--border); padding-top:20px; display:flex; justify-content:flex-end">
            ${isTotalDone 
                ? `<button class="btn btn-primary" onclick="PedidosPage.finalizarPedido()" style="font-size:1.2rem; padding:12px 30px">✅ Finalizar e Dar Baixa de Estoque</button>`
                : `<button class="btn btn-danger" onclick="PedidosPage.finalizarParcial()" style="opacity: 0.8">Forçar Finalização Parcial</button>`
            }
          </div>
        </div>
      </div>
    `;
  },

  // ===== EAN-13 CUSTOMIZADO (BALANÇA) =====
  // Formato: 2 | CCCCC | PPPPPP | V
  //   Dígito 1    : fixo = "2"
  //   Dígitos 2-6 : código interno do produto (5 dígitos, ex: "00014")
  //   Dígitos 7-12: peso em gramas sem vírgula (6 dígitos, ex: "001154" → 1,154 kg)
  //   Dígito 13   : dígito verificador EAN-13 padrão
  parseEAN13Balanca(codigo) {
    if (!/^\d{13}$/.test(codigo) || codigo[0] !== '2') return null;
    const codProduto = codigo.substring(1, 6);   // 5 dígitos do código
    const pesoRaw    = codigo.substring(6, 12);  // 6 dígitos do peso
    const pesoKg     = parseInt(pesoRaw, 10) / 1000; // "001154" → 1.154 kg
    return { codProduto, pesoKg };
  },

  // Interceptor do Barcode (chamado pelo app.js global)
  onBarcodeScanned(codigo) {
    if (!this.activeSeparacao) return;

    codigo = (codigo || '').trim();
    if (!codigo) return;

    let produto  = null;
    let qtdBipada = 1;
    let modoBalanca = false;
    let pesoKg = 0;

    // ── Tentar parsear como EAN-13 de balança ──────────────────────────────
    const parsed = this.parseEAN13Balanca(codigo);
    if (parsed) {
      modoBalanca = true;
      pesoKg      = parsed.pesoKg;

      // Busca pelo codigoInterno — aceita com ou sem zeros à esquerda
      const codNum = parseInt(parsed.codProduto, 10).toString();
      const todos  = DB.getProdutos();
      produto = todos.find(p =>
        p.codigoInterno === parsed.codProduto ||
        p.codigoInterno === codNum ||
        (p.codigoInterno || '').replace(/^0+/, '') === codNum
      );

      if (!produto) {
        App.showToast(`❌ Código "${parsed.codProduto}" (EAN-balança) não encontrado no cadastro!`, 'error');
        this.playBeep(false);
        this._focarScanner();
        return;
      }
      qtdBipada = pesoKg;

    } else {
      // ── Fallback: código de barras padrão ─────────────────────────────────
      produto = DB.getProdutoPorCodigo(codigo);
      if (!produto) {
        App.showToast(`❌ Código "${codigo}" não encontrado no ERP!`, 'error');
        this.playBeep(false);
        this._focarScanner();
        return;
      }
    }

    // ── Buscar pedido e lista de separação ────────────────────────────────
    const pedidos = DB.getPedidos();
    const pedido  = pedidos.find(p => p.id === this.activeSeparacao);
    if (!pedido) return;

    const itensCalculados = this.calcularItensAEnviar(pedido);
    const itemAEnviar = itensCalculados.find(i =>
      i.nome.toLowerCase() === produto.nome.toLowerCase() ||
      produto.nome.toLowerCase().includes(i.nome.toLowerCase()) ||
      i.nome.toLowerCase().includes(produto.nome.toLowerCase())
    );

    if (!itemAEnviar) {
      App.showToast(`🚨 "${produto.nome}" não consta na lista de separação desta loja!`, 'error');
      this.playBeep(false);
      this._focarScanner();
      return;
    }

    // ── Atualizar quantidade separada ─────────────────────────────────────
    const itemNoBanco = pedido.itens.find(i => i.nome === itemAEnviar.nome);
    if (itemNoBanco) {
      const anterior = parseFloat(itemNoBanco.separado || 0);
      itemNoBanco.separado = Math.round((anterior + qtdBipada) * 1000) / 1000;

      const label = modoBalanca
        ? `${produto.nome} — ${pesoKg.toFixed(3)} kg bipado | Total: ${itemNoBanco.separado.toFixed(3)} / ${itemAEnviar.quantidade} kg`
        : `${produto.nome} (${itemNoBanco.separado} / ${itemAEnviar.quantidade})`;

      if (itemNoBanco.separado > itemAEnviar.quantidade) {
        App.showToast(`⚠️ Acima do necessário: ${label}`, 'warning');
        this.playBeep(false);
      } else {
        App.showToast(`✅ ${label}`, 'success');
        this.playBeep(true);
      }

      DB.updatePedido(pedido.id, { itens: pedido.itens });
    }

    App.navigateTo('pedidos');
    this._focarScanner();
  },

  _focarScanner() {
    setTimeout(() => {
      const inp = document.getElementById('manualSimScanner');
      if (inp) { inp.value = ''; inp.focus(); }
    }, 50);
  },

  // Finaliza gerando saidas
  finalizarPedido(overrideEmptiness = false) {
    this._efetuarBaixa(true, overrideEmptiness);
  },

  finalizarParcial() {
    if(confirm("ATENÇÃO: A reposição não foi totalmente completada. Deseja realizar a baixa APENAS do que foi bipado até agora e fechar este documento?")) {
      this._efetuarBaixa(false, false);
    }
  },

  _efetuarBaixa(completo, overrideEmptiness) {
    const pedidos = DB.getPedidos();
    const pedido = pedidos.find(p => p.id === this.activeSeparacao);
    if(!pedido) return;

    if (overrideEmptiness) {
        // Apenas mata o pedido
        DB.updatePedido(pedido.id, { status: 'conferido', finalizadoEm: new Date().toISOString() });
        App.showToast(`✅ Baixa documentada (0 itens movidos).`, 'success');
        this.activeSeparacao = null;
        App.navigateTo('pedidos');
        return;
    }

    let saidasRealizadas = 0;
    const itensCalculados = this.calcularItensAEnviar(pedido);

    // Gerar Movimentações apenas do que o separador BIppo
    pedido.itens.forEach(itemBipou => {
      const qtdBaixar = itemBipou.separado || 0;
      if (qtdBaixar <= 0) return;

      const pERP = DB.getProdutos().find(p => 
        p.nome.toLowerCase() === itemBipou.nome.toLowerCase() ||
        p.nome.toLowerCase().includes(itemBipou.nome.toLowerCase()) ||
        itemBipou.nome.toLowerCase().includes(p.nome.toLowerCase())
      );

      if (pERP) {
        DB.addMovimentacao({
          produtoId: pERP.id,
          tipo: 'saida',
          quantidade: qtdBaixar, 
          documento: `REPOSICAO-${pedido.loja}`,
          observacao: completo ? 'Saída via Conferência Total ParLevel' : 'Saída via Conferência Parcial ParLevel'
        });
        saidasRealizadas++;
      } else {
        console.warn('Produto não encontrado para baixa: ', itemBipou.nome);
        App.showToast(`Problema ao abaixar: ${itemBipou.nome}`, 'error');
      }
    });

    DB.updatePedido(pedido.id, { status: 'conferido', finalizadoEm: new Date().toISOString() });
    
    App.showToast(`✅ Baixa de ${saidasRealizadas} lotes finalizada!`, 'success');
    this.activeSeparacao = null;
    App.navigateTo('pedidos');
  },

  imprimirRomaneio(pedidoId) {
    const pedidos = DB.getPedidos();
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (!pedido) return;

    const itensRepor = this.calcularItensAEnviar(pedido);

    // Mapa nome → valor bruto digitado no formulário (TODOS os itens com qualquer entrada)
    const informadoMap = {};
    (pedido.itens || []).forEach(i => {
      if (Number(i.quantidade || 0) > 0) informadoMap[i.nome] = Number(i.quantidade);
    });

    // Itens que constam no formulário mas foram filtrados pelo cálculo de par-level
    // (sem máximo cadastrado, ou estoque já acima do máximo)
    const nomeRepor = new Set(itensRepor.map(i => i.nome));
    const itensExtras = Object.entries(informadoMap)
      .filter(([nome]) => !nomeRepor.has(nome))
      .map(([nome, qtdInformada]) => ({
        nome,
        estoqueNaLoja: qtdInformada,
        quantidade:    0,
        separado:      0,
        isExtra:       true
      }));

    const todosItens = [...itensRepor, ...itensExtras]
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));

    // Índice nome→fornecedor: catálogo (já enriquecido com dados ERP) + fallback direto nos produtos
    const catalogoFlat = {};
    DB.getCatalogoPedido().forEach(cat => {
      cat.itens.forEach(item => { if (item.fornecedor) catalogoFlat[item.nome] = item.fornecedor; });
    });
    const prodFornFlat = {};
    DB.getProdutos().forEach(p => { prodFornFlat[p.nome.toLowerCase()] = p.fornecedor || ''; });
    const _getForn = nome => {
      if (catalogoFlat[nome]) return catalogoFlat[nome];
      const k = nome.toLowerCase();
      if (prodFornFlat[k]) return prodFornFlat[k];
      const match = Object.keys(prodFornFlat).find(pk => pk.includes(k) || k.includes(pk));
      return match ? prodFornFlat[match] : '';
    };

    // Índice nome(lowercase)→precoVenda a partir dos produtos cadastrados
    const precoFlat = {};
    DB.getProdutos().forEach(p => {
      precoFlat[p.nome.toLowerCase()] = parseFloat(p.precoVenda || 0);
    });
    const _getPreco = nome => {
      const k = nome.toLowerCase();
      if (precoFlat[k] !== undefined) return precoFlat[k];
      const match = Object.keys(precoFlat).find(pk => pk.includes(k) || k.includes(pk));
      return match ? precoFlat[match] : 0;
    };

    const isDireto = pedido.tipoPedido === 'direto';
    let trs = '';
    let totalGeral = 0;

    todosItens.forEach(i => {
      const fornecedor = _getForn(i.nome);
      const separado   = i.separado || 0;
      const confOk     = separado >= i.quantidade && i.quantidade > 0;
      const confLabel  = separado > 0
        ? `<strong>${separado}</strong>${confOk ? ' ✓' : ' !'}`
        : '—';
      const confStyle  = confOk
        ? 'font-size:0.8rem;text-align:center;color:#166534'
        : separado > 0
          ? 'font-size:0.8rem;text-align:center;color:#92400e'
          : 'font-size:0.8rem;text-align:center;color:#999';

      const precoVenda = _getPreco(i.nome);
      const qtdValor   = separado > 0 ? separado : i.quantidade;
      const valorItem  = precoVenda * qtdValor;
      if (!i.isExtra) totalGeral += valorItem;

      const valorLabel = precoVenda > 0 && !i.isExtra ? 'R$ ' + valorItem.toFixed(2) : '—';
      const valorStyle = 'font-size:0.75rem;text-align:right;white-space:nowrap;' + (precoVenda > 0 && !i.isExtra ? 'font-weight:600' : 'color:#999');

      const informado   = informadoMap[i.nome] ?? '—';
      const enviarLabel = i.isExtra ? '<span style="color:#aaa">—</span>' : i.quantidade;
      const rowStyle    = i.isExtra ? 'opacity:0.55;background:#fafafa' : '';

      trs += `
        <tr style="${rowStyle}">
          <td><div style="width:14px;height:14px;border:1.5px solid ${i.isExtra ? '#ccc' : '#000'};border-radius:3px"></div></td>
          <td style="font-size:0.85rem;font-weight:bold;text-align:center;white-space:nowrap">${enviarLabel}</td>
          <td style="font-size:0.85rem;text-align:center;color:#1d4ed8;font-weight:700;white-space:nowrap">${informado}</td>
          <td style="font-size:0.82rem">${i.nome}</td>
          <td style="font-size:0.75rem;color:#555;font-weight:600">${fornecedor || '—'}</td>
          <td style="${confStyle};white-space:nowrap">${confLabel}</td>
          <td style="${valorStyle}">${valorLabel}</td>
        </tr>
      `;
    });

    const colSpanTotal = 7;
    if (todosItens.length === 0) {
      trs = `<tr><td colspan="${colSpanTotal}" style="text-align:center;padding:20px">Nenhum item solicitado.</td></tr>`;
    }

    const totalRow = totalGeral > 0 ? `
      <tr style="background:#f0f0f0;font-weight:bold;border-top:2px solid #000">
        <td colspan="6" style="text-align:right;padding:5px 8px;font-size:0.8rem;letter-spacing:.03em">VALOR TOTAL DO PEDIDO:</td>
        <td style="text-align:right;padding:5px 8px;font-size:0.9rem;color:#166534">R$ ${totalGeral.toFixed(2)}</td>
      </tr>
    ` : '';

    const corLoja = this._corLoja(pedido.loja);
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>Romaneio Reposição - ${pedido.loja}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 12px; color:#000; font-size:11px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
            .loja-banner { display:inline-block; padding:3px 14px; border-radius:20px; font-size:0.95rem; font-weight:800; letter-spacing:.05em; background:${corLoja.bg}; color:${corLoja.text}; margin:4px 0; }
            table { width: 100%; border-collapse: collapse; margin-top:8px; table-layout:auto; }
            th, td { padding: 3px 5px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background: #f0f0f0; border-bottom: 2px solid #000; font-size:0.72rem; }
            th:nth-child(1), td:nth-child(1),
            th:nth-child(2), td:nth-child(2),
            th:nth-child(3), td:nth-child(3),
            th:nth-child(6), td:nth-child(6),
            th:nth-child(7), td:nth-child(7) { white-space:nowrap; width:1%; }
            @media print {
              body { padding: 5mm; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin:0;font-size:1rem">ROMANEIO DE RESSUPRIMENTO</h1>
            <div><span class="loja-banner">${pedido.loja}</span></div>
            <p style="margin:2px 0 0;font-size:0.72rem">Leitura de Estoque em: ${new Date(pedido.data).toLocaleString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>OK</th>
                <th style="text-align:center">ENVIAR</th>
                <th style="text-align:center;color:#1d4ed8">INFORMADO</th>
                <th>DESCRIÇÃO DO ITEM</th>
                <th>FORNECEDOR</th>
                <th style="text-align:center">CONF.</th>
                <th style="text-align:right">VALOR (R$)</th>
              </tr>
            </thead>
            <tbody>${trs}${totalRow}</tbody>
          </table>
          <div style="margin-top:16px;text-align:center">
            <button onclick="window.print()" style="padding:8px 28px;font-size:0.9rem;cursor:pointer;background:#222;color:#fff;border:none;border-radius:6px">Imprimir Agora</button>
          </div>
        </body>
      </html>
    `);
    win.document.close();
  },

  migrarRecheiosParaERP() {
    const catRecheios = DB.getCatalogoPedido().find(c => c.id === 'insumos');
    if (!catRecheios || !catRecheios.itens.length) {
      App.showToast('Nenhum item para migrar.', 'warning');
      return;
    }
    if (!confirm('Criar produtos na categoria "Recheios" para cada item do catálogo atual?\nItens com o mesmo nome já existentes no ERP serao ignorados.')) return;

    const existentes = DB.getProdutos().map(p => p.nome.toLowerCase());
    let criados = 0;
    catRecheios.itens.forEach(item => {
      const nome = typeof item === 'object' ? item.nome : item;
      if (existentes.includes(nome.toLowerCase())) return;
      DB.addProduto({
        nome,
        categoria:        'Recheios',
        formularioMaximo: (typeof item === 'object' ? item.max : 0) || 0,
        fornecedor:       (typeof item === 'object' ? item.fornecedor : '') || '',
        codigoInterno: '', codigoBarras: '', unidade: 'kg', estoque: 0,
        estoqueMinimo: 0, estoqueMaximo: 0, custo: 0, precoVenda: 0,
        temperatura: 'Resfriado', formaEntrega: '', qtdPorUnidade: 0,
        local: 'Camara Fria', observacoes: ''
      });
      criados++;
    });
    const ignorados = catRecheios.itens.length - criados;
    App.showToast(criados + ' produto(s) criado(s)' + (ignorados > 0 ? ', ' + ignorados + ' ja existiam.' : '!'), 'success');
    App.closeModal();
    App.navigateTo('produtos');
  },

  playBeep(success) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if(success) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch(e) {}
  }
};
