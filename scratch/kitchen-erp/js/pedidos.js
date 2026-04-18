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
    "Garra 300ml", "Garra 1 litro"
  ],

  LOJAS_FIXAS: ["VALPARAISO", "VITORIA", "ITAPARICA", "GUARAPARI", "LINHARES", "ITAPOÃ", "Outro"],

  render() {
    if (this.activeSeparacao) {
      return this.renderSeparacaoView();
    }
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
          `;
        } else {
          acoes = `
            <button class="btn btn-secondary btn-sm" onclick="PedidosPage.imprimirRomaneio('${p.id}')">📄 Ver Romaneio</button>
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

        // Se for 0 envios, alertamos visualmente
        let volStr = `${enviosNecessarios} envios (calculado)`;
        if(enviosNecessarios === 0 && p.status === 'pendente') volStr = '<span style="color:var(--danger)">Estoque cheio / Sem metas</span>';

        rows += `
          <tr>
            <td>#${p.id.substring(3, 9)}</td>
            <td><strong>${p.loja}</strong></td>
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
          <button class="btn btn-outline" onclick="PedidosPage.abrirModalMetas()">⚙️ Cfg Estoque Máximo Lojas</button>
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

  // ===== CONFIGURAÇÃO DE METAS (PAR-LEVEL) =====
  abrirModalMetas() {
      const lojasOpts = this.LOJAS_FIXAS.map(l => `<option value="${l}">${l}</option>`).join('');
      
      const body = `
        <div class="form-group" style="margin-bottom:20px;">
          <label>Selecione a Loja para Configurar a Meta Máxima (Teto de Reposição)</label>
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

      App.openModal('⚙️ Configuração de Reposição por Nível Par (Par-Level)', body, [
          { label: 'Cancelar', class: 'btn-secondary', action: 'App.closeModal()' },
          { label: 'Salvar Metas', class: 'btn-primary', action: 'PedidosPage.salvarMetasLoja()' },
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

      let html = '';
      this.ITENS_FIXOS.forEach(item => {
          const val = confData[item] || 0;
          html += `
            <div style="background:var(--bg-secondary); padding:10px; border-radius:6px; border:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
               <label style="margin:0; font-size:0.9rem">${item}</label>
               <input type="number" min="0" data-item="${item}" class="input-meta" value="${val}" style="width:70px; text-align:center; padding:5px; border-radius:4px; border:1px solid var(--border); background:var(--bg-primary); color:var(--text-primary);" />
            </div>
          `;
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
      App.showToast(`✅ Metas atualizadas para ${lojaStr}!`, 'success');
      App.closeModal();
      App.navigateTo('pedidos'); // atualiza calculos visuais
  },

  // ===== LÓGICA DE ROMANEIO (CÁLCULO E INIMPRESSÃO) =====
  calcularItensAEnviar(pedido) {
      const metas = DB.getMetas();
      const metaDaLoja = metas.find(m => m.loja === pedido.loja);
      const limites = metaDaLoja ? metaDaLoja.itens : {};

      const itensRepor = [];

      pedido.itens.forEach(i => {
          const limite = Number(limites[i.nome] || 0);
          const estoqueAtual = Number(i.quantidade || 0); // i.quantidade é o ESTOQUE que o gerente digitou!
          
          let aMandar = limite - estoqueAtual;
          
          if(aMandar > 0) {
              // Copiamos os dados com aMandar como a NOVA aQuantidade verdadeira pro ERP trabalhar
              itensRepor.push({
                  nome: i.nome,
                  estoqueNaLoja: estoqueAtual,
                  quantidade: aMandar, // Overrides pra facilitação nas baixas
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
                <p style="color:var(--text-muted)">O estoque relatado pelo gerente da loja ${pedido.loja} já atingiu ou excedeu as *Metas Máximas* configuradas para essa loja. Zero repasses calculados.</p>
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
      
      itemsHtml += `
        <div class="item-separacao" style="background: ${isDone ? 'var(--accent-dim)' : 'var(--bg-secondary)'}; padding:15px; border-radius:8px; margin-bottom:12px; border:1px solid var(--border)">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px">
            <div>
              <strong style="font-size:1.1rem; color:${isDone ? 'var(--accent)' : 'var(--text-primary)'}">${item.nome}</strong>
              <div style="font-size:0.8rem; color:var(--text-muted)">Estoque Loja: ${item.estoqueNaLoja} | Meta: ${item.estoqueNaLoja + item.quantidade}</div>
            </div>
            <div style="font-size:1.2rem; font-weight:bold; color:${isDone ? 'var(--accent)' : 'var(--warning)'}">
              ${item.separado || 0} / ${item.quantidade} (repôr)
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
            <h2 style="color:var(--accent)">📦 Reposição: ${pedido.loja}</h2>
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

  // Interceptor do Barcode (chamado pelo app.js global)
  onBarcodeScanned(codigo) {
    if (!this.activeSeparacao) return; // Se não estiver na tela, ignora.

    // 1. Procurar o produto no ERP
    const produto = DB.getProdutoPorCodigo(codigo);
    if (!produto) {
      App.showToast(`Produto com código ${codigo} não encontrado no ERP!`, 'error');
      this.playBeep(false);
      return;
    }

    // 2. Procurar na lista do pedido
    const pedidos = DB.getPedidos();
    const pedido = pedidos.find(p => p.id === this.activeSeparacao);
    if(!pedido) return;

    // Calcular O QUE FOI FILTRADO (As reposições)
    const itensCalculados = this.calcularItensAEnviar(pedido);

    // Tentativa de match por NOME. 
    const itemAEnviar = itensCalculados.find(i => 
      i.nome.toLowerCase() === produto.nome.toLowerCase() ||
      produto.nome.toLowerCase().includes(i.nome.toLowerCase()) ||
      i.nome.toLowerCase().includes(produto.nome.toLowerCase())
    );

    if (!itemAEnviar) {
      App.showToast(`🚨 O produto lido (${produto.nome}) NÃO é necessário enviar para esta loja ou não bateu o nome!`, 'error');
      this.playBeep(false);
      return;
    }

    // 3. Atualizar quantidade no DOM REAL do banco (pq o calcularItensAEnviar criou uma cópia virtual)
    const itemNoBanco = pedido.itens.find(i => i.nome === itemAEnviar.nome);
    if(itemNoBanco) {
        itemNoBanco.separado = (itemNoBanco.separado || 0) + 1;
        
        if (itemNoBanco.separado > itemAEnviar.quantidade) { // limite da variavel Mapeada
          App.showToast(`🚨 Você bipou ${produto.nome} a mais! O sistema vai prever envio de apenas ${itemAEnviar.quantidade}`, 'warning');
          this.playBeep(false); 
        } else {
          App.showToast(`✅ ${produto.nome} conferido! (${itemNoBanco.separado}/${itemAEnviar.quantidade})`, 'success');
          this.playBeep(true);
        }

        // 4. Salvar estado no banco local
        DB.updatePedido(pedido.id, { itens: pedido.itens });
    }
    
    // 5. Re-render para atualizar barra de progresso
    App.navigateTo('pedidos');
    
    // foco pro tester manual
    setTimeout(()=> {
        const inp = document.getElementById('manualSimScanner');
        if(inp) { inp.value = ''; inp.focus(); }
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

    let trs = '';
    itensRepor.forEach(i => {
      trs += `
        <tr>
          <td><div style="width:20px;height:20px;border:2px solid #000;border-radius:4px"></div></td>
          <td style="font-size:1.2rem;font-weight:bold">${i.quantidade}</td>
          <td style="font-size:1.1rem">${i.nome}</td>
          <td style="font-size:0.9rem; color:#666">L:${i.estoqueNaLoja}</td>
          <td style="border-bottom:1px solid #ccc"></td>
        </tr>
      `;
    });

    if(itensRepor.length === 0) {
        trs = `<tr><td colspan="5" style="text-align:center; padding: 20px;">Não é necessário repôr nenhum item nesta medição de estoque.</td></tr>`;
    }

    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>Romaneio Reposição - ${pedido.loja}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color:#000; }
            .header { text-align: center; border-bottom: 3px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top:20px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background: #f0f0f0; border-bottom: 2px solid #000; }
            td:nth-child(2) { width: 80px; text-align:center; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin:0">ROMANEIO DE RESSUPRIMENTO</h1>
            <h2 style="margin:10px 0 0">Destino: ${pedido.loja}</h2>
            <p>Leitura de Estoque em: ${new Date(pedido.data).toLocaleString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width:40px">OK</th>
                <th>ENVIAR</th>
                <th>DESCRIÇÃO DO ITEM</th>
                <th>A TÍTULO DE INFORMAÇÃO</th>
                <th>CHEGAGEM INTERNA</th>
              </tr>
            </thead>
            <tbody>${trs}</tbody>
          </table>
          <div style="margin-top:50px; text-align:center">
            <button onclick="window.print()" style="padding:15px 40px; font-size:1.2rem; cursor:pointer; background:#222; color:#fff; border:none; border-radius:8px">Imprimir Agora</button>
          </div>
        </body>
      </html>
    `);
    win.document.close();
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
