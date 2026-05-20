/**
 * db.js — Camada de dados: Firebase Realtime Database + LocalStorage (cache offline)
 * Controle Cozinha Central — Esphirra's Delivery
 *
 * ── CONFIGURAÇÃO ──────────────────────────────────────────────────────────────
 * Substitua os valores abaixo com as informações do seu projeto Firebase.
 * Obtenha em: console.firebase.google.com → Configurações do projeto → Seus apps
 * ─────────────────────────────────────────────────────────────────────────────
 */
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyAogRVNoW95XtsY6sU7HQq0w8rSKIWqGP0",
  databaseURL:       "https://controle-cozinha-central-default-rtdb.firebaseio.com",
  projectId:         "controle-cozinha-central",
};

// ── ESTADO INTERNO ─────────────────────────────────────────────────────────────
var _fbReady   = false;   // Firebase está conectado e pronto
var _fbError   = false;   // Firebase falhou — usa só localStorage
var _syncQueue = [];      // Fila de escritas pendentes (modo offline)
var _listeners = {};      // Listeners ativos do Firebase

// ── CHAVES DO FIREBASE (coleções) ─────────────────────────────────────────────
var FB = {
  baseUrl: function() {
    return FIREBASE_CONFIG.databaseURL.replace(/\/$/, '');
  },
  url: function(colecao, id) {
    var base = FB.baseUrl() + '/' + colecao;
    return id ? base + '/' + id + '.json' : base + '.json';
  },
  headers: function() {
    return { 'Content-Type': 'application/json' };
  },

  // GET — busca todos os registros de uma coleção
  get: function(colecao) {
    return fetch(FB.url(colecao)).then(function(r) { return r.json(); })
      .then(function(data) {
        if (!data) return [];
        // Firebase retorna objeto { id: {...}, id: {...} } — converte para array
        return Object.keys(data).map(function(k) {
          return Object.assign({}, data[k], { _fbKey: k });
        });
      });
  },

  // PUT — salva item (usa id como chave Firebase)
  put: function(colecao, id, dados) {
    return fetch(FB.url(colecao, id), {
      method:  'PUT',
      headers: FB.headers(),
      body:    JSON.stringify(dados)
    }).then(function(r) { return r.json(); });
  },

  // DELETE — remove item
  del: function(colecao, id) {
    return fetch(FB.url(colecao, id), { method: 'DELETE' }).then(function(r) { return r.json(); });
  },

  // PATCH — atualiza campos específicos
  patch: function(colecao, id, updates) {
    return fetch(FB.url(colecao, id), {
      method:  'PATCH',
      headers: FB.headers(),
      body:    JSON.stringify(updates)
    }).then(function(r) { return r.json(); });
  }
};

// ── INICIALIZAÇÃO E SYNC ───────────────────────────────────────────────────────
function _inicializarFirebase() {
  if (!FIREBASE_CONFIG.databaseURL || FIREBASE_CONFIG.databaseURL === 'FIREBASE_DATABASE_URL') {
    console.warn('[DB] Firebase não configurado. Usando apenas localStorage.');
    _fbError = true;
    return;
  }

  // Testa conexão
  fetch(FIREBASE_CONFIG.databaseURL.replace(/\/$/, '') + '/.json')
    .then(function(r) {
      if (r.ok) {
        _fbReady = true;
        _sincronizarDoFirebase();
        _mostrarStatusConexao(true);
        // Mantém todos os computadores sincronizados automaticamente
        setInterval(_sincronizarDoFirebase, 30000);
      } else {
        throw new Error('HTTP ' + r.status);
      }
    })
    .catch(function(e) {
      console.warn('[DB] Firebase offline. Modo local ativo.', e.message);
      _fbError = true;
      _mostrarStatusConexao(false);
    });
}

function _sincronizarDoFirebase() {
  var colecoes = ['chef_produtos', 'chef_movimentacoes', 'chef_lotes', 'chef_producoes', 'chef_fichas', 'chef_pedidos', 'chef_lojas_metas', 'chef_lixeira', 'chef_funcionarios', 'chef_convites'];
  var mudou = false;

  Promise.all(colecoes.map(function(col) {
    return FB.get(col).then(function(dados) {
      if (dados && dados.length > 0) {
        var novo = JSON.stringify(dados);
        if (novo !== localStorage.getItem(col)) {
          mudou = true;
          localStorage.setItem(col, novo);
        }
      }
    });
  }))
  .then(function() {
    // Catálogo é salvo como array direto (não como objetos com ID),
    // então precisa de tratamento especial fora do loop acima.
    return fetch(FB.baseUrl() + '/chef_pedido_catalogo.json')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        var arr = null;
        if (Array.isArray(data)) {
          arr = data;
        } else if (data && typeof data === 'object') {
          // Firebase pode retornar objeto com chaves numéricas ao invés de array
          arr = Object.values(data).filter(function(v) { return v !== null; });
        }
        if (arr && arr.length > 0) {
          var novo = JSON.stringify(arr);
          if (novo !== localStorage.getItem('chef_pedido_catalogo')) {
            mudou = true;
            localStorage.setItem('chef_pedido_catalogo', novo);
          }
        }
      });
  })
  .then(function() {
    if (mudou) {
      console.log('[DB] Dados novos recebidos do Firebase — atualizando tela.');
      if (window.App && App.currentPage) {
        App.navigateTo(App.currentPage);
      }
    }
  })
  .catch(function(e) {
    console.warn('[DB] Erro ao sincronizar:', e);
  });
}

function _mostrarStatusConexao(online) {
  var el = document.getElementById('fbStatus');
  if (!el) {
    el = document.createElement('div');
    el.id = 'fbStatus';
    el.style.cssText = 'position:fixed;bottom:8px;left:8px;font-size:.68rem;padding:3px 8px;border-radius:12px;z-index:9999;opacity:.85;font-weight:600';
    document.body.appendChild(el);
  }
  el.textContent   = online ? '☁️ Nuvem ativa' : '💾 Modo offline';
  el.style.background = online ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)';
  el.style.color      = online ? '#10b981' : '#f59e0b';
  el.style.border     = '1px solid ' + (online ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.4)');
}

// ── HELPERS INTERNOS ───────────────────────────────────────────────────────────
function _getLocal(chave) {
  return JSON.parse(localStorage.getItem(chave) || '[]');
}
function _saveLocal(chave, data) {
  localStorage.setItem(chave, JSON.stringify(data));
}
function _saveFirebase(colecao, id, dados) {
  if (!_fbReady) return;
  FB.put(colecao, id, dados).catch(function(e) {
    console.warn('[DB] Erro ao salvar no Firebase:', e);
  });
}
function _deleteFirebase(colecao, id) {
  if (!_fbReady) return;
  FB.del(colecao, id).catch(function(e) {
    console.warn('[DB] Erro ao deletar no Firebase:', e);
  });
}
function _patchFirebase(colecao, id, updates) {
  if (!_fbReady) return;
  FB.patch(colecao, id, updates).catch(function(e) {
    console.warn('[DB] Erro ao atualizar no Firebase:', e);
  });
}

// ── OBJETO PÚBLICO DB ──────────────────────────────────────────────────────────
const DB = {

  // ===== PRODUTOS =====
  getProdutos() {
    return _getLocal('chef_produtos');
  },
  saveProdutos(data) {
    _saveLocal('chef_produtos', data);
  },
  addProduto(produto) {
    const produtos = this.getProdutos();
    produto.id = 'p' + Date.now().toString();
    produto.criadoEm = new Date().toISOString();
    produtos.push(produto);
    this.saveProdutos(produtos);
    _saveFirebase('chef_produtos', produto.id, produto);
    return produto;
  },
  updateProduto(id, updates) {
    const produtos = this.getProdutos();
    const idx = produtos.findIndex(p => p.id === id);
    if (idx >= 0) {
      produtos[idx] = { ...produtos[idx], ...updates, atualizadoEm: new Date().toISOString() };
      this.saveProdutos(produtos);
      _saveFirebase('chef_produtos', id, produtos[idx]);
      return produtos[idx];
    }
    return null;
  },
  deleteProduto(id) {
    const produtos = this.getProdutos().filter(p => p.id !== id);
    this.saveProdutos(produtos);
    _deleteFirebase('chef_produtos', id);
  },
  getProdutoPorCodigo(codigo) {
    return this.getProdutos().find(p => p.codigoBarras === codigo || p.codigoInterno === codigo);
  },
  getProdutoPorId(id) {
    return this.getProdutos().find(p => p.id === id);
  },

  // ===== FICHAS TÉCNICAS =====
  getFichas() {
    return _getLocal('chef_fichas');
  },
  saveFichas(data) {
    _saveLocal('chef_fichas', data);
  },
  addFicha(ficha) {
    const fichas = this.getFichas();
    ficha.id = 'f' + Date.now().toString();
    ficha.criadoEm = new Date().toISOString();
    fichas.push(ficha);
    this.saveFichas(fichas);
    _saveFirebase('chef_fichas', ficha.id, ficha);
    return ficha;
  },
  updateFicha(id, updates) {
    const fichas = this.getFichas();
    const idx = fichas.findIndex(f => f.id === id);
    if (idx >= 0) {
      fichas[idx] = { ...fichas[idx], ...updates };
      this.saveFichas(fichas);
      _saveFirebase('chef_fichas', id, fichas[idx]);
      return fichas[idx];
    }
    return null;
  },
  deleteFicha(id) {
    const fichas = this.getFichas().filter(f => f.id !== id);
    this.saveFichas(fichas);
    _deleteFirebase('chef_fichas', id);
  },

  // ===== MOVIMENTAÇÕES DE ESTOQUE =====
  getMovimentacoes() {
    return _getLocal('chef_movimentacoes');
  },
  saveMovimentacoes(data) {
    _saveLocal('chef_movimentacoes', data);
  },
  addMovimentacao(mov) {
    const movs = this.getMovimentacoes();
    mov.id = 'm' + Date.now().toString() + Math.random().toString(36).substr(2, 4);
    mov.data = new Date().toISOString();
    movs.push(mov);
    this.saveMovimentacoes(movs);
    _saveFirebase('chef_movimentacoes', mov.id, mov);
    this._atualizarEstoque(mov);
    return mov;
  },
  _atualizarEstoque(mov) {
    const produto = this.getProdutoPorId(mov.produtoId);
    if (!produto) return;
    let qtd = parseFloat(produto.estoque || 0);
    if (mov.tipo === 'entrada') qtd += parseFloat(mov.quantidade);
    else if (mov.tipo === 'saida' || mov.tipo === 'consumo') qtd -= parseFloat(mov.quantidade);
    this.updateProduto(mov.produtoId, { estoque: Math.max(0, qtd) });
  },
  getMovimentacoesPorProduto(produtoId) {
    return this.getMovimentacoes().filter(m => m.produtoId === produtoId);
  },
  getMovimentacoesPorTipo(tipo) {
    return this.getMovimentacoes().filter(m => m.tipo === tipo);
  },
  getMovimentacoesRecentes(dias = 30) {
    const limite = new Date();
    limite.setDate(limite.getDate() - dias);
    return this.getMovimentacoes()
      .filter(m => new Date(m.data) >= limite)
      .sort((a, b) => new Date(b.data) - new Date(a.data));
  },

  // ===== PRODUÇÕES =====
  getProducoes() {
    return _getLocal('chef_producoes');
  },

  // ===== PEDIDOS DE LOJA =====
  getPedidos() {
    // Sempre exclui IDs que estão na lixeira — mesmo que o Firebase sync
    // tenha restaurado o pedido em chef_pedidos antes do DELETE concluir.
    const lixeiraIds = new Set((_getLocal('chef_lixeira') || []).map(i => i.id));
    return (_getLocal('chef_pedidos') || []).filter(p => !lixeiraIds.has(p.id));
  },
  savePedidos(data) {
    _saveLocal('chef_pedidos', data);
  },
  updatePedido(id, updates) {
    const pedidos = this.getPedidos();
    const idx = pedidos.findIndex(p => p.id === id);
    if (idx >= 0) {
      pedidos[idx] = { ...pedidos[idx], ...updates, atualizadoEm: new Date().toISOString() };
      this.savePedidos(pedidos);
      _saveFirebase('chef_pedidos', id, pedidos[idx]);
      return pedidos[idx];
    }
    return null;
  },
  deletePedido(id) {
    const pedido = this.getPedidos().find(p => p.id === id);
    if (!pedido) return;

    // 1. Remove do array local e do Firebase
    const pedidos = this.getPedidos().filter(p => p.id !== id);
    this.savePedidos(pedidos);

    // 2. Deleta do nó /chef_pedidos/<id> no Firebase de forma garantida
    fetch(FB.baseUrl() + '/chef_pedidos/' + id + '.json', { method: 'DELETE' })
      .catch(e => console.warn('[DB] Erro ao deletar pedido no Firebase:', e.message));

    // 3. Move para a lixeira (local + Firebase)
    this.moverParaLixeira(pedido);
  },

  // ===== LIXEIRA =====
  MESES_RETENCAO: 60, // 60 meses = 5 anos

  getLixeira() {
    return _getLocal('chef_lixeira') || [];
  },
  saveLixeira(data) {
    _saveLocal('chef_lixeira', data);
  },

  moverParaLixeira(pedido) {
    const lixeira = this.getLixeira();
    const item = {
      ...pedido,
      _deletadoEm: new Date().toISOString(),
      _expiraEm:   new Date(Date.now() + this.MESES_RETENCAO * 30 * 24 * 60 * 60 * 1000).toISOString()
    };
    lixeira.push(item);
    this.saveLixeira(lixeira);
    _saveFirebase('chef_lixeira', item.id, item);
  },

  restaurarDaLixeira(id) {
    const lixeira = this.getLixeira();
    const item = lixeira.find(i => i.id === id);
    if (!item) return;
    // Remove campos de lixeira e restaura como pedido pendente
    const { _deletadoEm, _expiraEm, ...pedido } = item;
    const pedidos = this.getPedidos();
    pedidos.push({ ...pedido, status: 'pendente' });
    this.savePedidos(pedidos);
    _saveFirebase('chef_pedidos', pedido.id, { ...pedido, status: 'pendente' });
    // Remove da lixeira
    this.saveLixeira(lixeira.filter(i => i.id !== id));
    fetch(FB.baseUrl() + '/chef_lixeira/' + id + '.json', { method: 'DELETE' })
      .catch(e => console.warn('[DB] Erro ao remover da lixeira Firebase:', e.message));
  },

  excluirDaLixeiraPermanentemente(id) {
    this.saveLixeira(this.getLixeira().filter(i => i.id !== id));
    fetch(FB.baseUrl() + '/chef_lixeira/' + id + '.json', { method: 'DELETE' })
      .catch(e => console.warn('[DB] Erro ao excluir lixeira Firebase:', e.message));
  },

  limparLixeiraExpirada() {
    const agora = new Date();
    const lixeira = this.getLixeira();
    const validos = lixeira.filter(i => {
      if (!i._expiraEm) return true; // sem data = mantém
      return new Date(i._expiraEm) > agora;
    });
    const expirados = lixeira.filter(i => i._expiraEm && new Date(i._expiraEm) <= agora);
    if (expirados.length > 0) {
      this.saveLixeira(validos);
      expirados.forEach(i => {
        fetch(FB.baseUrl() + '/chef_lixeira/' + i.id + '.json', { method: 'DELETE' })
          .catch(() => {});
      });
      console.log('[DB] Lixeira: ' + expirados.length + ' pedido(s) expirado(s) removido(s) permanentemente.');
    }
    return expirados.length;
  },

  // ===== METAS DE LOJAS (PAR-LEVEL) =====
  getMetas() {
    return _getLocal('chef_lojas_metas') || [];
  },
  saveMetas(data) {
    _saveLocal('chef_lojas_metas', data);
  },
  updateMeta(loja, configObj) {
    const metas = this.getMetas();
    const idx = metas.findIndex(m => m.loja === loja);
    
    let metaRec;
    if (idx >= 0) {
      metas[idx] = { ...metas[idx], itens: { ...metas[idx].itens, ...configObj }, atualizadoEm: new Date().toISOString() };
      metaRec = metas[idx];
    } else {
      metaRec = { id: 'meta_' + Date.now(), loja: loja, itens: configObj, atualizadoEm: new Date().toISOString() };
      metas.push(metaRec);
    }
    this.saveMetas(metas);
    _saveFirebase('chef_lojas_metas', metaRec.id, metaRec);
  },

  // ===== CATÁLOGO DO FORMULÁRIO DE PEDIDOS =====
  getCatalogoPedido() {
    const produtos = this.getProdutos();

    // Mapa nome(lower) → produto — permite enriquecer itens do catálogo com dados do ERP
    const prodMap = {};
    produtos.forEach(p => { prodMap[p.nome.toLowerCase()] = p; });
    const _prodPorNome = nome => {
      const k = nome.toLowerCase();
      if (prodMap[k]) return prodMap[k];
      const match = Object.keys(prodMap).find(pk => pk.includes(k) || k.includes(pk));
      return match ? prodMap[match] : null;
    };
    // Garante que cada item do catálogo tenha fornecedor e max vindos do produto cadastrado
    // quando esses campos não estiverem definidos no catálogo
    const _enrich = item => {
      const p = _prodPorNome(item.nome);
      return {
        ...item,
        fornecedor: item.fornecedor || (p ? p.fornecedor || '' : ''),
        max: (item.max !== undefined && item.max !== null) ? item.max : (p ? parseFloat(p.formularioMaximo || 0) : 0)
      };
    };

    // Recheios são derivados dos produtos cadastrados com categoria "Recheios"
    const recheios = produtos
      .filter(p => p.categoria === 'Recheios')
      .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' }))
      .map(p => ({ nome: p.nome, max: parseFloat(p.formularioMaximo || 0), fornecedor: p.fornecedor || '' }));

    const local = _getLocal('chef_pedido_catalogo');
    const base  = (local && Array.isArray(local) && local.length > 0) ? local : this._catalogoPadrao();

    // Enriquece TODAS as categorias com dados do ERP (fornecedor, max)
    const outras = base.filter(c => c.id !== 'insumos').map(cat => ({
      ...cat,
      itens: cat.itens.map(_enrich)
    }));
    const recheiosBase = (base.find(c => c.id === 'insumos') || { itens: [] }).itens.map(_enrich);

    return [
      { id: 'insumos', nome: 'Recheios', icon: '🥩', itens: recheios.length > 0 ? recheios : recheiosBase },
      ...outras
    ];
  },
  saveCatalogoPedido(categorias) {
    _saveLocal('chef_pedido_catalogo', categorias);
    // Salva no Firebase como nó único (PUT substitui o nó inteiro)
    fetch(FB.baseUrl() + '/chef_pedido_catalogo.json', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categorias)
    }).catch(e => console.warn('[Catálogo] Firebase error:', e.message));
  },
  _catalogoPadrao() {
    return [
      { id: 'insumos', nome: 'Recheios', icon: '🥩', itens: [
          {nome:'Pepperoni',max:0},{nome:'Carne Hamburguer',max:0},{nome:'Bacon em cubos',max:0},
          {nome:'Calabresa triturada',max:0},{nome:'Carne moída',max:0},{nome:'Carne de Panela',max:0},
          {nome:'Cebola caramelizada',max:0},{nome:'Filé em Cubos',max:0},{nome:'Frango Desfiado',max:0},
          {nome:'Frango defumado',max:0},{nome:'Lombo Assado',max:0},{nome:'Mexicana',max:0},
          {nome:'Mini kibe',max:0},{nome:'Mistura Liquida',max:0},{nome:'Mistura para maionese',max:0},
          {nome:'Mistura Seca 5 kg',max:0},{nome:'Mistura Seca 15 kg',max:0},{nome:'Molho Gorgonzola',max:0},
          {nome:'Presunto triturado',max:0},{nome:'Chocolate Branco',max:0}
        ]
      },
      { id: 'cozinha', nome: 'Cozinha', icon: '🧑‍🍳', itens: [
          {nome:'Açucar 5 kg',max:2},{nome:'Alho frito KG',max:2},{nome:'Brigadeiro Caixas',max:3},
          {nome:'Café 500 G',max:3},{nome:'Canela KG',max:2},{nome:'Creme de Leite L',max:4},
          {nome:'Fuba KG',max:40},{nome:'Goiabada Bisnaga',max:3},{nome:'Granulado KG',max:3},
          {nome:'Kinder ovo',max:4},{nome:'Kinder Bueno CX',max:2},{nome:'Leite Condensado CX',max:30},
          {nome:'M&Ms KG',max:6},{nome:'Milho Latinha Fardo',max:30},{nome:'Nachos Pacote',max:8},
          {nome:'Nuttela Balde',max:6},{nome:'Óleo Caixa',max:4},{nome:'Paçoca Caixa',max:2},
          {nome:'Rolo de sacola',max:2},{nome:'Batata Palha Caixa',max:2},{nome:'Palmito Caixa',max:2},
          {nome:'Molho de Tomate',max:20},{nome:'Mostarda',max:4},{nome:'Leite Ninho',max:2},
          {nome:'MUSSARELA PÇ',max:27},{nome:'Requeijão 1,8 kg',max:18},{nome:'Cheddar 1,2 kg',max:6},
          {nome:'Parmêsão Ralado Kg',max:2},{nome:'GORGONZOLA Peça',max:1},{nome:'OREGANO Pacote',max:2},
          {nome:'Cream Cheese 1 kg',max:6},{nome:'Lombo Canadense',max:6},{nome:'Sacolina de chupchup',max:4},
          {nome:'Bombom Ouro Branco',max:4},{nome:'Chocolate branco',max:2},{nome:'Papel Lanche UN',max:2},
          {nome:'Doce de Leite Caixa',max:3},{nome:'Alho Poro',max:10},{nome:'Trigo kg',max:300},
          {nome:'Detergente Un',max:20},{nome:'Cloro Galão',max:4},{nome:'Bombril Pacote',max:2},
          {nome:'Esponja fina pacote',max:2},{nome:'Esponja grossa pct',max:2},{nome:'Limpador Forno',max:2},
          {nome:'Luva Preta Caixa',max:4},{nome:'Touca Pacote',max:4},{nome:'Ovo de Galinha',max:3}
        ]
      },
      { id: 'frenteloja', nome: 'Frente de Loja', icon: '🏪', itens: [
          {nome:'Caixa 1',max:0},{nome:'Caixa 2',max:0},{nome:'Caixa 4',max:0},{nome:'Caixa 6',max:0},
          {nome:'Caixa 8',max:0},{nome:'Caixa 12',max:0},{nome:'Tira P',max:0},{nome:'Tira G',max:0},
          {nome:'Bandeja P',max:0},{nome:'Bandeja G',max:0},{nome:'Papel Bandeja',max:0},
          {nome:'Garra 300ml',max:0},{nome:'Garra 1 litro',max:0},
          {nome:'Barbecue 3,5 L',max:4},{nome:'Copinho Maionese CX',max:2},{nome:'Papel Higienico',max:2},
          {nome:'Coca 1,5 L',max:16},{nome:'Coca 1,5 l Zero',max:16},{nome:'Coca Lata',max:6},
          {nome:'Coca Lata Zero',max:6},{nome:'Alcool Liquido',max:10},{nome:'Colherzinha Caixa',max:2},
          {nome:'Sacola Camiseta 38x48',max:2},{nome:'Canudo',max:2},{nome:'Ketchup sache',max:2},
          {nome:'Barbecue sache',max:2},{nome:'Guardanapo',max:3},{nome:'Prato Descartavel',max:2},
          {nome:'KETCHUP 3,5 L',max:4},{nome:'Saco Lixo 100L Fardo',max:2},{nome:'Saco Lixo 200 l Fardo',max:2},
          {nome:'Papel para maos',max:3},{nome:'Guarana 1,5 L',max:6},{nome:'Agua sem gas',max:15},
          {nome:'Agua com gas',max:15},{nome:'H2O Limao',max:2},{nome:'H2O Limoneto',max:2},
          {nome:'Suco de Uva Dellvale',max:6}
        ]
      }
    ];
  },

  // ===== LOTES DE ARMAZENAMENTO =====
  getLotes() {
    return _getLocal('chef_lotes');
  },
  saveProducoes(data) {
    _saveLocal('chef_producoes', data);
  },
  addProducao(producao) {
    const producoes = this.getProducoes();
    producao.id = 'pr' + Date.now().toString();
    producao.data = new Date().toISOString();
    producao.lote = this._gerarLote();
    producoes.push(producao);
    this.saveProducoes(producoes);
    _saveFirebase('chef_producoes', producao.id, producao);
    return producao;
  },
  _gerarLote() {
    const d = new Date();
    return `L${d.getFullYear().toString().substr(2)}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${Math.floor(Math.random()*9000)+1000}`;
  },

  // ===== LOTES DE ARMAZENAMENTO =====
  getLotes() {
    return _getLocal('chef_lotes');
  },
  saveLotes(data) {
    _saveLocal('chef_lotes', data);
  },
  addLote(lote) {
    const lotes = this.getLotes();
    lote.id = 'l' + Date.now().toString();
    lote.criadoEm = new Date().toISOString();
    lotes.push(lote);
    this.saveLotes(lotes);
    _saveFirebase('chef_lotes', lote.id, lote);
    return lote;
  },
  updateLote(id, updates) {
    const lotes = this.getLotes();
    const idx = lotes.findIndex(l => l.id === id);
    if (idx >= 0) {
      lotes[idx] = { ...lotes[idx], ...updates };
      this.saveLotes(lotes);
      _saveFirebase('chef_lotes', id, lotes[idx]);
      return lotes[idx];
    }
    return null;
  },
  getLotesAtivos() {
    return this.getLotes().filter(l => parseFloat(l.quantidadeAtual || 0) > 0);
  },
  getLotesPorProduto(produtoId) {
    return this.getLotes().filter(l => l.produtoId === produtoId);
  },
  getLotesVencendo(dias = 7) {
    const limite = new Date();
    limite.setDate(limite.getDate() + dias);
    return this.getLotesAtivos().filter(l => {
      if (!l.validade) return false;
      return new Date(l.validade) <= limite;
    });
  },
  getLotesVencidos() {
    const hoje = new Date();
    return this.getLotesAtivos().filter(l => {
      if (!l.validade) return false;
      return new Date(l.validade) < hoje;
    });
  },

  // ===== UTILIDADES =====
  getEstoquesBaixos() {
    return this.getProdutos().filter(p => {
      const estoque = parseFloat(p.estoque || 0);
      const minimo  = parseFloat(p.estoqueMinimo || 0);
      return estoque <= minimo && minimo > 0;
    });
  },
  getResumo() {
    const produtos = this.getProdutos();
    const movs = this.getMovimentacoes();
    const hoje = new Date().toDateString();
    return {
      totalProdutos:  produtos.length,
      estoquesBaixos: this.getEstoquesBaixos().length,
      lotesVencendo:  this.getLotesVencendo(7).length,
      lotesVencidos:  this.getLotesVencidos().length,
      entradasHoje:   movs.filter(m => m.tipo === 'entrada' && new Date(m.data).toDateString() === hoje).length,
      saidasHoje:     movs.filter(m => m.tipo === 'saida'   && new Date(m.data).toDateString() === hoje).length,
    };
  },

  // ===== FUNCIONÁRIOS =====
  getFuncionarios() {
    return _getLocal('chef_funcionarios') || [];
  },
  saveFuncionarios(data) {
    _saveLocal('chef_funcionarios', data);
  },
  addFuncionario(func) {
    const funcs = this.getFuncionarios();
    func.cadastradoEm = new Date().toISOString();
    funcs.push(func);
    this.saveFuncionarios(funcs);
    _saveFirebase('chef_funcionarios', func.id, func);
    return func;
  },
  updateFuncionario(id, updates) {
    const funcs = this.getFuncionarios();
    const idx = funcs.findIndex(f => f.id === id);
    if (idx >= 0) {
      funcs[idx] = { ...funcs[idx], ...updates, atualizadoEm: new Date().toISOString() };
      this.saveFuncionarios(funcs);
      _saveFirebase('chef_funcionarios', id, funcs[idx]);
      return funcs[idx];
    }
    return null;
  },

  // ===== CONVITES =====
  getConvites() {
    return _getLocal('chef_convites') || [];
  },
  saveConvites(data) {
    _saveLocal('chef_convites', data);
  },
  addConvite(convite) {
    const convites = this.getConvites();
    convites.push(convite);
    this.saveConvites(convites);
    _saveFirebase('chef_convites', convite.token, convite);
    return convite;
  },
  updateConvite(token, updates) {
    const convites = this.getConvites();
    const idx = convites.findIndex(c => c.token === token);
    if (idx >= 0) {
      convites[idx] = { ...convites[idx], ...updates };
      this.saveConvites(convites);
      _patchFirebase('chef_convites', convites[idx].token, updates);
      return convites[idx];
    }
    return null;
  },
  getConvitePorToken(token) {
    return this.getConvites().find(c => c.token === token) || null;
  },

  // ===== MIGRAÇÃO (localStorage antigo → Firebase) =====
  migrarDadosLocaisParaFirebase() {
    if (!_fbReady) { alert('Firebase não conectado. Verifique a configuração.'); return; }
    var colecoes = ['chef_produtos', 'chef_movimentacoes', 'chef_lotes', 'chef_producoes', 'chef_fichas'];
    var total = 0;
    colecoes.forEach(function(col) {
      var dados = _getLocal(col);
      dados.forEach(function(item) {
        if (item.id) {
          _saveFirebase(col, item.id, item);
          total++;
        }
      });
    });
    App.showToast('✅ ' + total + ' registros enviados para a nuvem!', 'success');
  },

  // ===== INICIALIZAÇÃO DE DADOS DE EXEMPLO (somente se banco vazio) =====
  inicializarDadosExemplo() {
    if (this.getProdutos().length > 0) return;

    const produtosBase = [
      { nome: 'Sassami de Frango',    categoria: 'Carnes',          unidade: 'kg', codigoInterno: 'SAS001', estoqueMinimo: 20, estoqueMaximo: 100, custo: 14.00, estoque: 0,  local: 'Câmara Fria',  temperatura: 'Congelado', formaEntrega: 'Caixa', qtdPorUnidade: 20 },
      { nome: 'Carne Moída',          categoria: 'Carnes',          unidade: 'kg', codigoInterno: 'CAR002', estoqueMinimo: 10, estoqueMaximo: 50,  custo: 28.00, estoque: 0,  local: 'Câmara Fria',  temperatura: 'Resfriado', formaEntrega: 'Bandeja', qtdPorUnidade: 5 },
      { nome: 'Acém em Cubos',        categoria: 'Carnes',          unidade: 'kg', codigoInterno: 'ACE003', estoqueMinimo: 15, estoqueMaximo: 60,  custo: 32.00, estoque: 0,  local: 'Câmara Fria',  temperatura: 'Resfriado', formaEntrega: 'Caixa', qtdPorUnidade: 20 },
      { nome: 'Filé Mignon',          categoria: 'Carnes',          unidade: 'kg', codigoInterno: 'FIL004', estoqueMinimo: 5,  estoqueMaximo: 30,  custo: 85.00, estoque: 0,  local: 'Câmara Fria',  temperatura: 'Resfriado', formaEntrega: 'Bandeja', qtdPorUnidade: 3 },
    ];

    produtosBase.forEach(p => this.addProduto({ ...p, fornecedor: '', observacoes: '' }));
  }
};

// ── INICIALIZA FIREBASE AO CARREGAR ────────────────────────────────────────────
_inicializarFirebase();

// Inicializa dados de exemplo se banco vazio
setTimeout(function() { DB.inicializarDadosExemplo(); }, 500);
