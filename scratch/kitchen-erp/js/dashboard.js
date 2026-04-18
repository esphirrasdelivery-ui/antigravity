/**
 * dashboard.js — Módulo Dashboard
 */

const DashboardPage = {
  charts: {},

  render() {
    const resumo = DB.getResumo();
    const estoquesB = DB.getEstoquesBaixos();
    const vencendo = DB.getLotesVencendo(7);
    const vencidos = DB.getLotesVencidos();
    const movRecentes = DB.getMovimentacoesRecentes(7);

    return `
      <div class="page-header">
        <div>
          <h1>📊 Dashboard</h1>
          <p>Visão geral da sua cozinha industrial</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary btn-sm" onclick="DashboardPage.refresh()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
            Atualizar
          </button>
        </div>
      </div>

      ${(estoquesB.length > 0 || vencidos.length > 0) ? `
      <div class="alerts-row" style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px">
        ${estoquesB.length > 0 ? `<div class="alert alert-warning" style="flex:1;min-width:280px">⚠️ <strong>${estoquesB.length} produto(s)</strong> com estoque abaixo do mínimo</div>` : ''}
        ${vencidos.length > 0 ? `<div class="alert alert-danger" style="flex:1;min-width:280px">🚨 <strong>${vencidos.length} lote(s)</strong> com validade vencida!</div>` : ''}
        ${vencendo.length > 0 && vencidos.length === 0 ? `<div class="alert alert-warning" style="flex:1;min-width:280px">⏰ <strong>${vencendo.length} lote(s)</strong> vencendo nos próximos 7 dias</div>` : ''}
      </div>` : ''}

      <div class="stats-grid">
        <div class="stat-card" style="--stat-color: var(--accent); --stat-bg: var(--accent-dim)">
          <div class="stat-icon">📦</div>
          <div class="stat-info">
            <div class="stat-value">${resumo.totalProdutos}</div>
            <div class="stat-label">Produtos Cadastrados</div>
            <div class="stat-sub">${DB.getProdutos().filter(p => parseFloat(p.estoque||0) > 0).length} em estoque</div>
          </div>
        </div>
        <div class="stat-card" style="--stat-color: var(--danger); --stat-bg: var(--danger-dim)">
          <div class="stat-icon">⚠️</div>
          <div class="stat-info">
            <div class="stat-value">${resumo.estoquesBaixos}</div>
            <div class="stat-label">Estoques Críticos</div>
            <div class="stat-sub">Abaixo do mínimo</div>
          </div>
        </div>
        <div class="stat-card" style="--stat-color: var(--info); --stat-bg: var(--info-dim)">
          <div class="stat-icon">📥</div>
          <div class="stat-info">
            <div class="stat-value">${resumo.entradasHoje}</div>
            <div class="stat-label">Entradas Hoje</div>
            <div class="stat-sub">Recebimentos do dia</div>
          </div>
        </div>
        <div class="stat-card" style="--stat-color: var(--purple); --stat-bg: var(--purple-dim)">
          <div class="stat-icon">📤</div>
          <div class="stat-info">
            <div class="stat-value">${resumo.saidasHoje}</div>
            <div class="stat-label">Saídas Hoje</div>
            <div class="stat-sub">Consumo/Vendas</div>
          </div>
        </div>
        <div class="stat-card" style="--stat-color: var(--warning); --stat-bg: var(--warning-dim)">
          <div class="stat-icon">⏰</div>
          <div class="stat-info">
            <div class="stat-value">${resumo.lotesVencendo}</div>
            <div class="stat-label">Vencendo em 7 dias</div>
            <div class="stat-sub">Requer atenção</div>
          </div>
        </div>
        <div class="stat-card" style="--stat-color: var(--accent); --stat-bg: var(--accent-dim)">
          <div class="stat-icon">📋</div>
          <div class="stat-info">
            <div class="stat-value">${DB.getFichas().length}</div>
            <div class="stat-label">Fichas Técnicas</div>
            <div class="stat-sub">Receitas cadastradas</div>
          </div>
        </div>
      </div>

      <div class="charts-grid">
        <div class="chart-card">
          <h3>Movimentação dos últimos 7 dias</h3>
          <div class="chart-wrap">
            <canvas id="chartMovimentacao"></canvas>
          </div>
        </div>
        <div class="chart-card">
          <h3>Estoque por Categoria</h3>
          <div class="chart-wrap">
            <canvas id="chartCategorias"></canvas>
          </div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <h3 style="font-size:.9rem;font-weight:600;color:var(--text-secondary);margin-bottom:16px">⚠️ Estoques Críticos</h3>
          ${estoquesB.length === 0 ? '<p class="text-muted" style="font-size:.85rem;text-align:center;padding:20px">✅ Todos os estoques estão em dia</p>' : `
            <div style="display:flex;flex-direction:column;gap:12px">
              ${estoquesB.slice(0,6).map(p => {
                const pct = parseFloat(p.estoque) / parseFloat(p.estoqueMinimo) * 100;
                const cor = pct <= 30 ? 'danger' : 'warning';
                return `
                  <div>
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                      <span style="font-size:.85rem;font-weight:500">${p.nome}</span>
                      <span class="text-${cor}" style="font-size:.8rem">${parseFloat(p.estoque||0).toFixed(1)} ${p.unidade||''}</span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-fill ${cor}" style="width:${Math.min(100, pct)}%"></div>
                    </div>
                    <div style="font-size:.7rem;color:var(--text-muted);margin-top:2px">Mínimo: ${p.estoqueMinimo} ${p.unidade||''}</div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>

        <div class="card">
          <h3 style="font-size:.9rem;font-weight:600;color:var(--text-secondary);margin-bottom:16px">🕒 Últimas Movimentações</h3>
          ${movRecentes.length === 0 ? '<p class="text-muted" style="font-size:.85rem;text-align:center;padding:20px">Nenhuma movimentação recente</p>' : `
            <div style="display:flex;flex-direction:column;gap:10px">
              ${movRecentes.slice(0,8).map(m => {
                const tipo = m.tipo === 'entrada' ? { icon:'📥', color:'accent', label:'Entrada' } :
                             m.tipo === 'saida' ? { icon:'📤', color:'danger', label:'Saída' } :
                             { icon:'🍳', color:'purple', label:'Produção' };
                const produto = DB.getProdutoPorId(m.produtoId);
                const dataFmt = new Date(m.data).toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
                return `
                  <div style="display:flex;align-items:center;gap:10px">
                    <div style="font-size:1.2rem">${tipo.icon}</div>
                    <div style="flex:1;min-width:0">
                      <div style="font-size:.83rem;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${produto ? produto.nome : m.produtoNome || 'Produto'}</div>
                      <div style="font-size:.72rem;color:var(--text-muted)">${dataFmt}</div>
                    </div>
                    <span class="badge badge-${tipo.color === 'purple' ? 'purple' : tipo.color === 'accent' ? 'success' : 'danger'}">${m.quantidade} ${produto ? produto.unidade||'' : ''}</span>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>
      </div>

      ${(vencendo.length > 0 || vencidos.length > 0) ? `
      <div class="card mt-16">
        <h3 style="font-size:.9rem;font-weight:600;color:var(--text-secondary);margin-bottom:16px">📅 Validades — Atenção Necessária</h3>
        <div class="table-container" style="border:none">
          <table>
            <thead><tr>
              <th>Produto</th><th>Lote</th><th>Local</th><th>Quantidade</th><th>Validade</th><th>Status</th>
            </tr></thead>
            <tbody>
              ${[...vencidos, ...vencendo].map(l => {
                const hoje = new Date();
                const val = new Date(l.validade);
                const vencido = val < hoje;
                const dias = Math.ceil((val - hoje) / (1000*60*60*24));
                return `<tr>
                  <td><strong>${l.produtoNome}</strong></td>
                  <td><code style="font-size:.75rem;color:var(--text-secondary)">${l.lote}</code></td>
                  <td>${l.local}</td>
                  <td>${l.quantidadeAtual}</td>
                  <td class="${vencido ? 'expiry-expired' : 'expiry-near'}">${l.validade}</td>
                  <td><span class="badge ${vencido ? 'badge-danger' : 'badge-warning'}">${vencido ? '❌ Vencido' : `⏰ ${dias}d`}</span></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>` : ''}
    `;
  },

  postRender() {
    this.renderChartMovimentacao();
    this.renderChartCategorias();
  },

  refresh() {
    App.navigateTo('dashboard');
  },

  renderChartMovimentacao() {
    const ctx = document.getElementById('chartMovimentacao');
    if (!ctx) return;

    const labels = [];
    const entradas = [];
    const saidas = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toDateString();
      labels.push(d.toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit'}));
      const movs = DB.getMovimentacoes().filter(m => new Date(m.data).toDateString() === dayStr);
      entradas.push(movs.filter(m => m.tipo === 'entrada').reduce((s, m) => s + parseFloat(m.quantidade||0), 0));
      saidas.push(movs.filter(m => m.tipo === 'saida').reduce((s, m) => s + parseFloat(m.quantidade||0), 0));
    }

    if (this.charts.mov) this.charts.mov.destroy();
    this.charts.mov = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Entradas', data: entradas, backgroundColor: 'rgba(16,185,129,0.7)', borderColor: '#10b981', borderWidth: 1, borderRadius: 4 },
          { label: 'Saídas', data: saidas, backgroundColor: 'rgba(239,68,68,0.5)', borderColor: '#ef4444', borderWidth: 1, borderRadius: 4 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#8b949e', font: { size: 11 } } } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8b949e' } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8b949e' } }
        }
      }
    });
  },

  renderChartCategorias() {
    const ctx = document.getElementById('chartCategorias');
    if (!ctx) return;

    const produtos = DB.getProdutos();
    const por = {};
    produtos.forEach(p => {
      const cat = p.categoria || 'Outros';
      if (!por[cat]) por[cat] = 0;
      por[cat] += parseFloat(p.estoque || 0);
    });

    const labels = Object.keys(por);
    const data = Object.values(por);
    const colors = ['#10b981','#3b82f6','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#ec4899'];

    if (this.charts.cat) this.charts.cat.destroy();
    this.charts.cat = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors.slice(0, labels.length),
          borderColor: 'rgba(0,0,0,0)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { color: '#8b949e', font: { size: 11 }, padding: 12 } }
        }
      }
    });
  }
};
