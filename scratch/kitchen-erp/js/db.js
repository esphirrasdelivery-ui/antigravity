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
  var colecoes = ['chef_produtos', 'chef_movimentacoes', 'chef_lotes', 'chef_producoes', 'chef_fichas', 'chef_pedidos', 'chef_lojas_metas'];
  Promise.all(colecoes.map(function(col) {
    return FB.get(col).then(function(dados) {
      if (dados && dados.length > 0) {
        localStorage.setItem(col, JSON.stringify(dados));
      }
    });
  })).then(function() {
    console.log('[DB] Sincronizado com Firebase.');
    // Re-renderiza a página atual para mostrar dados atualizados
    if (window.App && App.currentPage) {
      App.navigateTo(App.currentPage);
    }
  }).catch(function(e) {
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
    return _getLocal('chef_pedidos');
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
