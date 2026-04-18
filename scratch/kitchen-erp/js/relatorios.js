/**
 * relatorios.js — Módulo de Relatórios
 */

const RelatoriosPage = {
  charts: {},
  abaAtiva: 'movimentacao',
  dataInicio: '',
  dataFim: '',

  render() {
    const hoje = new Date();
    const inicio = new Date(hoje);
    inicio.setDate(hoje.getDate() - 30);
    if (!this.dataInicio) this.dataInicio = inicio.toISOString().split('T')[0];
    if (!this.dataFim) this.dataFim = hoje.toISOString().split('T')[0];

    return `
      <div class="page-header">
        <div>
          <h1>📊 Relatórios</h1>
          <p>Análise e exportação de dados do estoque</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary btn-sm" onclick="window.print()">🖨️ Imprimir</button>
        </div>
      </div>

      <!-- Filtro de Período -->
      <div class="card mb-16">
        <div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap">
          <div class="form-group" style="min-width:140px">
            <label>Data Início</label>
            <input type="date" id="relDataInicio" value="${this.dataInicio}" onchange="RelatoriosPage.setPeriodo(this.value, null)" />
          </div>
          <div class="form-group" style="min-width:140px">
            <label>Data Fim</label>
            <input type="date" id="relDataFim" value="${this.dataFim}" onchange="RelatoriosPage.setPeriodo(null, this.value)" />
          </div>
          <button class="btn btn-primary btn-sm" onclick="RelatoriosPage.aplicarFiltro()">Aplicar</button>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-left:8px">
            <button class="btn btn-secondary btn-sm" onclick="RelatoriosPage.preset(7)">7 dias</button>
            <button class="btn btn-secondary btn-sm" onclick="RelatoriosPage.preset(30)">30 dias</button>
            <button class="btn btn-secondary btn-sm" onclick="RelatoriosPage.preset(90)">90 dias</button>
          </div>
        </div>
      </div>

      <!-- Abas -->
      <div class="tabs">
        <button class="tab-btn ${this.abaAtiva==='movimentacao'?'active':''}" onclick="RelatoriosPage.setAba('movimentacao')">📦 Movimentação</button>
        <button class="tab-btn ${this.abaAtiva==='estoque'?'active':''}" onclick="RelatoriosPage.setAba('estoque')">📋 Posição de Estoque</button>
        <button class="tab-btn ${this.abaAtiva==='producao'?'active':''}" onclick="RelatoriosPage.setAba('producao')">🍳 Produção</button>
        <button class="tab-btn ${this.abaAtiva==='perdas'?'active':''}" onclick="RelatoriosPage.setAba('perdas')">⚠️ Perdas</button>
      </div>

      <div id="relatorioConteudo">
        ${this.renderAba()}
      </div>
    `;
  },

  setAba(aba) {
    this.abaAtiva = aba;
    const el = document.getElementById('relatorioConteudo');
    if (el) {
      el.innerHTML = this.renderAba();
      this.postRenderAba();
    }
  },

  setPeriodo(inicio, fim) {
    if (inicio !== null) this.dataInicio = inicio;
    if (fim !== null) this.dataFim = fim;
  },

  aplicarFiltro() {
    const el = document.getElementById('relatorioConteudo');
    if (el) {
      el.innerHTML = this.renderAba();
      this.postRenderAba();
    }
  },

  preset(dias) {
    const hoje = new Date();
    const inicio = new Date(hoje);
    inicio.setDate(hoje.getDate() - dias);
    this.dataInicio = inicio.toISOString().split('T')[0];
    this.dataFim = hoje.toISOString().split('T')[0];
    document.getElementById('relDataInicio').value = this.dataInicio;
    document.getElementById('relDataFim').value = this.dataFim;
    this.aplicarFiltro();
  },

  getMovsFiltradas() {
    const inicio = new Date(this.dataInicio + 'T00:00:00');
    const fim = new Date(this.dataFim + 'T23:59:59');
    return DB.getMovimentacoes().filter(m => {
      const d = new Date(m.data);
      return d >= inicio && d <= fim;
    });
  },

  renderAba() {
    switch (this.abaAtiva) {
      case 'movimentacao': return this.renderMovimentacao();
      case 'estoque': return this.renderEstoque();
      case 'producao': return this.renderProducao();
      case 'perdas': return this.renderPerdas();
      default: return '';
    }
  },

  renderMovimentacao() {
    const movs = this.getMovsFiltradas().sort((a,b) => new Date(b.data)-new Date(a.data));
    const entradas = movs.filter(m => m.tipo === 'entrada');
    const saidas = movs.filter(m => m.tipo === 'saida');
    const consumos = movs.filter(m => m.tipo === 'consumo');

    const totalEntradas = entradas.reduce((s,m) => s + (parseFloat(m.custo||0)*parseFloat(m.quantidade||0)), 0);
    const totalSaidas = saidas.length + consumos.length;

    return `
      <div class="stats-grid" style="margin-bottom:20px">
        <div class="stat-card" style="--stat-color:var(--accent);--stat-bg:var(--accent-dim)">
          <div class="stat-icon">📥</div>
          <div class="stat-info">
            <div class="stat-value">${entradas.length}</div>
            <div class="stat-label">Entradas</div>
            <div class="stat-sub">R$ ${totalEntradas.toFixed(2)}</div>
          </div>
        </div>
        <div class="stat-card" style="--stat-color:var(--danger);--stat-bg:var(--danger-dim)">
          <div class="stat-icon">📤</div>
          <div class="stat-info">
            <div class="stat-value">${totalSaidas}</div>
            <div class="stat-label">Saídas + Consumos</div>
          </div>
        </div>
        <div class="stat-card" style="--stat-color:var(--purple);--stat-bg:var(--purple-dim)">
          <div class="stat-icon">📋</div>
          <div class="stat-info">
            <div class="stat-value">${movs.length}</div>
            <div class="stat-label">Total Movimentações</div>
          </div>
        </div>
      </div>

      <div class="charts-grid" style="margin-bottom:20px">
        <div class="chart-card">
          <h3>Entradas vs Saídas por Dia</h3>
          <div class="chart-wrap"><canvas id="chartRelMov"></canvas></div>
        </div>
        <div class="chart-card">
          <h3>Movimentação por Tipo</h3>
          <div class="chart-wrap"><canvas id="chartRelTipo"></canvas></div>
        </div>
      </div>

      <div class="table-container">
        <div class="table-toolbar">
          <div style="font-weight:600">Detalhamento</div>
          <button class="btn btn-secondary btn-sm" onclick="RelatoriosPage.exportMovs()">⬇️ CSV</button>
        </div>
        ${movs.length === 0 ? '<div class="empty-state"><p class="text-muted">Nenhuma movimentação no período</p></div>' : `
          <div style="max-height:400px;overflow-y:auto">
            <table>
              <thead><tr><th>Data</th><th>Tipo</th><th>Produto</th><th>Quantidade</th><th>Motivo/Obs</th></tr></thead>
              <tbody>
                ${movs.slice(0,100).map(m => {
                  const p = DB.getProdutoPorId(m.produtoId);
                  const tipoInfo = m.tipo==='entrada' ? {label:'📥 Entrada',cls:'badge-success'} :
                    m.tipo==='saida' ? {label:'📤 Saída',cls:'badge-danger'} : {label:'🍳 Consumo',cls:'badge-purple'};
                  return `<tr>
                    <td style="font-size:.78rem">${new Date(m.data).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'})}</td>
                    <td><span class="badge ${tipoInfo.cls}">${tipoInfo.label}</span></td>
                    <td>${p?.nome || m.produtoNome || '—'}</td>
                    <td class="${m.tipo==='entrada'?'text-accent':'text-danger'}">${m.tipo==='entrada'?'+':'-'}${m.quantidade} ${p?.unidade||''}</td>
                    <td style="font-size:.78rem;color:var(--text-muted)">${m.motivo||m.observacao||'—'}</td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;
  },

  renderEstoque() {
    const produtos = DB.getProdutos().sort((a,b) => a.nome.localeCompare(b.nome));
    const valorTotal = produtos.reduce((s,p) => s + parseFloat(p.custo||0)*parseFloat(p.estoque||0), 0);

    return `
      <div class="stats-grid" style="margin-bottom:20px">
        <div class="stat-card" style="--stat-color:var(--accent);--stat-bg:var(--accent-dim)">
          <div class="stat-icon">📦</div>
          <div class="stat-info">
            <div class="stat-value">${produtos.length}</div>
            <div class="stat-label">Total de Produtos</div>
          </div>
        </div>
        <div class="stat-card" style="--stat-color:var(--warning);--stat-bg:var(--warning-dim)">
          <div class="stat-icon">💰</div>
          <div class="stat-info">
            <div class="stat-value">R$ ${valorTotal.toFixed(0)}</div>
            <div class="stat-label">Valor em Estoque</div>
          </div>
        </div>
        <div class="stat-card" style="--stat-color:var(--danger);--stat-bg:var(--danger-dim)">
          <div class="stat-icon">⚠️</div>
          <div class="stat-info">
            <div class="stat-value">${DB.getEstoquesBaixos().length}</div>
            <div class="stat-label">Estoques Críticos</div>
          </div>
        </div>
      </div>

      <div class="table-container">
        <div class="table-toolbar">
          <div style="font-weight:600">Posição Atual do Estoque</div>
          <button class="btn btn-secondary btn-sm" onclick="ProdutosPage.exportCSV()">⬇️ CSV</button>
        </div>
        <div style="max-height:500px;overflow-y:auto">
          <table>
            <thead><tr><th>Produto</th><th>Categoria</th><th>Estoque</th><th>Mínimo</th><th>Máximo</th><th>Custo Unit.</th><th>Valor Total</th><th>Local</th><th>Status</th></tr></thead>
            <tbody>
              ${produtos.map(p => {
                const est = parseFloat(p.estoque||0);
                const min = parseFloat(p.estoqueMinimo||0);
                const max = parseFloat(p.estoqueMaximo||0);
                const val = est * parseFloat(p.custo||0);
                let status, cls;
                if (est === 0) { status='Zerado'; cls='badge-danger'; }
                else if (min > 0 && est <= min) { status='Crítico'; cls='badge-warning'; }
                else { status='Normal'; cls='badge-success'; }
                return `<tr>
                  <td><strong>${p.nome}</strong></td>
                  <td><span class="badge badge-gray">${p.categoria||'—'}</span></td>
                  <td class="${est<=min&&min>0?'text-warning':''}" style="font-weight:600">${est.toFixed(2)} ${p.unidade||''}</td>
                  <td style="font-size:.83rem">${min} ${p.unidade||''}</td>
                  <td style="font-size:.83rem">${max||'—'} ${p.unidade||''}</td>
                  <td>R$ ${parseFloat(p.custo||0).toFixed(2)}</td>
                  <td style="font-weight:600">R$ ${val.toFixed(2)}</td>
                  <td style="font-size:.8rem">${p.local||'—'}</td>
                  <td><span class="badge ${cls}">${status}</span></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderProducao() {
    const producoes = DB.getProducoes()
      .filter(p => {
        const d = new Date(p.data);
        return d >= new Date(this.dataInicio) && d <= new Date(this.dataFim+'T23:59:59');
      })
      .sort((a,b) => new Date(b.data)-new Date(a.data));

    return `
      <div class="stats-grid" style="margin-bottom:20px">
        <div class="stat-card" style="--stat-color:var(--accent);--stat-bg:var(--accent-dim)">
          <div class="stat-icon">🍳</div>
          <div class="stat-info">
            <div class="stat-value">${producoes.length}</div>
            <div class="stat-label">Produções no Período</div>
          </div>
        </div>
        <div class="stat-card" style="--stat-color:var(--info);--stat-bg:var(--info-dim)">
          <div class="stat-icon">📋</div>
          <div class="stat-info">
            <div class="stat-value">${[...new Set(producoes.map(p=>p.fichaId||p.produtoId))].length}</div>
            <div class="stat-label">Receitas Diferentes</div>
          </div>
        </div>
      </div>

      <div class="table-container">
        <div class="table-toolbar">
          <div style="font-weight:600">Histórico de Produções</div>
          <button class="btn btn-secondary btn-sm" onclick="RelatoriosPage.exportProducoes()">⬇️ CSV</button>
        </div>
        ${producoes.length === 0 ? '<div class="empty-state"><p class="text-muted">Nenhuma produção no período</p></div>' : `
          <table>
            <thead><tr><th>Data</th><th>Produto</th><th>Ficha</th><th>Lote</th><th>Quantidade</th><th>Validade</th><th>Local</th></tr></thead>
            <tbody>
              ${producoes.map(p => `<tr>
                <td style="font-size:.8rem">${new Date(p.data).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'})}</td>
                <td><strong>${p.nomeProduto||'—'}</strong></td>
                <td style="font-size:.8rem">${p.fichaName||'Avulsa'}</td>
                <td><code style="font-size:.72rem;color:var(--text-secondary)">${p.lote}</code></td>
                <td class="text-accent fw-bold">${p.quantidade} ${p.unidade||''}</td>
                <td style="font-size:.8rem">${p.validade||'—'}</td>
                <td style="font-size:.8rem">${p.local||'—'}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        `}
      </div>
    `;
  },

  renderPerdas() {
    const movs = this.getMovsFiltradas();
    const descartes = movs.filter(m => m.tipo==='saida' && m.motivo?.toLowerCase().includes('descarte'));
    const vencidos = DB.getLotesVencidos();

    const totalDescarte = descartes.reduce((s,m) => {
      const p = DB.getProdutoPorId(m.produtoId);
      return s + (parseFloat(p?.custo||0) * parseFloat(m.quantidade||0));
    }, 0);

    return `
      <div class="stats-grid" style="margin-bottom:20px">
        <div class="stat-card" style="--stat-color:var(--danger);--stat-bg:var(--danger-dim)">
          <div class="stat-icon">🗑️</div>
          <div class="stat-info">
            <div class="stat-value">${descartes.length}</div>
            <div class="stat-label">Descartes no Período</div>
          </div>
        </div>
        <div class="stat-card" style="--stat-color:var(--danger);--stat-bg:var(--danger-dim)">
          <div class="stat-icon">💸</div>
          <div class="stat-info">
            <div class="stat-value">R$ ${totalDescarte.toFixed(2)}</div>
            <div class="stat-label">Custo das Perdas</div>
          </div>
        </div>
        <div class="stat-card" style="--stat-color:var(--warning);--stat-bg:var(--warning-dim)">
          <div class="stat-icon">❌</div>
          <div class="stat-info">
            <div class="stat-value">${vencidos.length}</div>
            <div class="stat-label">Lotes Vencidos Agora</div>
          </div>
        </div>
      </div>

      ${vencidos.length > 0 ? `
        <div class="alert alert-danger">❌ Existem lotes vencidos que precisam ser descartados!</div>
        <div class="table-container mb-16">
          <div class="table-toolbar"><div style="font-weight:600">Lotes Vencidos — Descarte Imediato</div></div>
          <table>
            <thead><tr><th>Produto</th><th>Lote</th><th>Validade</th><th>Qtd</th><th>Local</th><th>Ação</th></tr></thead>
            <tbody>
              ${vencidos.map(l=>`<tr style="background:var(--danger-dim)">
                <td><strong>${l.produtoNome}</strong></td>
                <td><code style="font-size:.75rem">${l.lote}</code></td>
                <td class="expiry-expired">${l.validade}</td>
                <td>${l.quantidadeAtual}</td>
                <td>${l.local}</td>
                <td><button class="btn btn-danger btn-sm" onclick="ArmazenamentoPage.descartar('${l.id}')">Descartar</button></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      ` : '<div class="alert alert-success">✅ Nenhum lote vencido no estoque!</div>'}

      ${descartes.length > 0 ? `
        <div class="table-container">
          <div class="table-toolbar"><div style="font-weight:600">Histórico de Descartes no Período</div></div>
          <table>
            <thead><tr><th>Data</th><th>Produto</th><th>Quantidade</th><th>Custo</th><th>Observação</th></tr></thead>
            <tbody>
              ${descartes.map(d=>{
                const p = DB.getProdutoPorId(d.produtoId);
                const custo = parseFloat(p?.custo||0)*parseFloat(d.quantidade||0);
                return `<tr>
                  <td style="font-size:.8rem">${new Date(d.data).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit'})}</td>
                  <td><strong>${p?.nome||d.produtoNome||'—'}</strong></td>
                  <td>${d.quantidade} ${p?.unidade||''}</td>
                  <td class="text-danger">R$ ${custo.toFixed(2)}</td>
                  <td style="font-size:.78rem">${d.observacao||'—'}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}
    `;
  },

  postRender() {
    this.postRenderAba();
  },

  postRenderAba() {
    if (this.abaAtiva === 'movimentacao') {
      this.renderChartMovPeriodo();
      this.renderChartTipo();
    }
  },

  renderChartMovPeriodo() {
    const ctx = document.getElementById('chartRelMov');
    if (!ctx) return;

    const movs = this.getMovsFiltradas();
    const inicio = new Date(this.dataInicio);
    const fim = new Date(this.dataFim);
    const days = Math.min(60, Math.ceil((fim - inicio) / (1000*60*60*24)) + 1);

    const labels = [], entradas = [], saidas = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(inicio);
      d.setDate(d.getDate() + i);
      const dayStr = d.toDateString();
      labels.push(d.toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit'}));
      const dayMovs = movs.filter(m => new Date(m.data).toDateString() === dayStr);
      entradas.push(dayMovs.filter(m=>m.tipo==='entrada').length);
      saidas.push(dayMovs.filter(m=>m.tipo==='saida'||m.tipo==='consumo').length);
    }

    if (this.charts.mov) this.charts.mov.destroy();
    this.charts.mov = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Entradas', data: entradas, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', tension: 0.4, fill: true, borderWidth: 2, pointRadius: 3 },
          { label: 'Saídas', data: saidas, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', tension: 0.4, fill: true, borderWidth: 2, pointRadius: 3 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#8b949e', font: { size: 11 } } } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8b949e', maxTicksLimit: 10 } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8b949e' } }
        }
      }
    });
  },

  renderChartTipo() {
    const ctx = document.getElementById('chartRelTipo');
    if (!ctx) return;
    const movs = this.getMovsFiltradas();
    const ent = movs.filter(m=>m.tipo==='entrada').length;
    const sai = movs.filter(m=>m.tipo==='saida').length;
    const cons = movs.filter(m=>m.tipo==='consumo').length;

    if (this.charts.tipo) this.charts.tipo.destroy();
    this.charts.tipo = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Entradas','Saídas','Consumos de Produção'],
        datasets: [{ data: [ent,sai,cons], backgroundColor: ['#10b981','#ef4444','#8b5cf6'], borderColor: 'transparent', borderWidth: 0 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { color: '#8b949e', font: { size: 11 }, padding: 12 } } }
      }
    });
  },

  exportMovs() {
    const movs = this.getMovsFiltradas();
    const header = 'Data,Tipo,Produto,Quantidade,Unidade,Custo,Motivo,Observação';
    const rows = movs.map(m => {
      const p = DB.getProdutoPorId(m.produtoId);
      return [new Date(m.data).toLocaleString('pt-BR'), m.tipo, p?.nome||m.produtoNome||'', m.quantidade, p?.unidade||'', m.custo||0, m.motivo||'', m.observacao||'']
        .map(v=>`"${v}"`).join(',');
    });
    const csv = [header,...rows].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'}));
    a.download = `movimentacoes_${this.dataInicio}_${this.dataFim}.csv`;
    a.click();
  },

  exportProducoes() {
    const prods = DB.getProducoes();
    const header = 'Data,Produto,Ficha,Lote,Quantidade,Unidade,Validade,Local';
    const rows = prods.map(p=>[new Date(p.data).toLocaleString('pt-BR'),p.nomeProduto,p.fichaName||'',p.lote,p.quantidade,p.unidade,p.validade,p.local].map(v=>`"${v||''}"`).join(','));
    const csv = [header,...rows].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
    a.download = `producoes_${this.dataInicio}_${this.dataFim}.csv`;
    a.click();
  }
};
