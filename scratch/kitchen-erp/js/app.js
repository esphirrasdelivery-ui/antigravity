/**
 * app.js — Orchestrator principal do Controle Cozinha Central
 */

const App = {
  currentPage: 'dashboard',
  pages: {
    dashboard: { module: 'DashboardPage', title: '📊 Dashboard' },
    produtos: { module: 'ProdutosPage', title: '📦 Produtos' },
    fichas: { module: 'FichasPage', title: '📋 Fichas Técnicas' },
    entrada: { module: 'EntradaPage', title: '📥 Entrada de Produtos' },
    producao: { module: 'ProducaoPage', title: '🍳 Produção' },
    armazenamento: { module: 'ArmazenamentoPage', title: '🗄️ Armazenamento' },
    saida: { module: 'SaidaPage', title: '📤 Saída de Produtos' },
    pedidos: { module: 'PedidosPage', title: '🛒 Pedidos / Romaneio' },
    relatorios: { module: 'RelatoriosPage', title: '📊 Relatórios' },
  },

  init() {
    // Sidebar toggle
    document.getElementById('sidebarToggle').addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      const main = document.getElementById('mainContent');
      sidebar.classList.toggle('collapsed');
      main.classList.toggle('expanded');
    });

    // Mobile menu
    document.getElementById('mobileMenuBtn').addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      sidebar.classList.toggle('mobile-open');
    });

    // Nav items
    document.querySelectorAll('.nav-item[data-page]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const page = el.dataset.page;
        this.navigateTo(page);

        // Fechar sidebar mobile
        document.getElementById('sidebar').classList.remove('mobile-open');
      });
    });

    // Modal close
    document.getElementById('modalClose').addEventListener('click', () => this.closeModal());
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
      if (e.target === document.getElementById('modalOverlay')) this.closeModal();
    });

    // Data/hora
    this.updateDateTime();
    setInterval(() => this.updateDateTime(), 60000);

    // Alertas de notificação
    this.checkAlerts();

    // URL hash routing
    const hash = window.location.hash.replace('#', '');
    if (hash && this.pages[hash]) {
      this.navigateTo(hash);
    } else {
      this.navigateTo('dashboard');
    }

    // Leitor USB de código de barras (listener global)
    BarcodeScanner.initKeyboardListener((codigo) => {
      // Delegate to page handler if exists
      var module = window.moduleRegistry ? window.moduleRegistry[this.pages[this.currentPage].module] : null;
      if (module && typeof module.onBarcodeScanned === 'function') {
        module.onBarcodeScanned(codigo);
        return;
      }
      
      const p = DB.getProdutoPorCodigo(codigo);
      if (p) {
        this.showToast(`📷 Produto lido: ${p.nome}`, 'info');
      }
    });
  },

  navigateTo(page) {
    if (!this.pages[page]) return;

    if (!window.moduleRegistry) {
        window.moduleRegistry = {
          DashboardPage:     DashboardPage,
          ProdutosPage:      ProdutosPage,
          FichasPage:        FichasPage,
          EntradaPage:       EntradaPage,
          ProducaoPage:      ProducaoPage,
          ArmazenamentoPage: ArmazenamentoPage,
          SaidaPage:         SaidaPage,
          PedidosPage:       PedidosPage,
          RelatoriosPage:    RelatoriosPage
        };
    }

    this.currentPage = page;
    window.location.hash = page;

    // Atualiza nav
    document.querySelectorAll('.nav-item').forEach(function(el) { el.classList.remove('active'); });
    var navEl = document.querySelector('.nav-item[data-page="' + page + '"]');
    if (navEl) navEl.classList.add('active');

    // Atualiza título
    document.getElementById('pageTitle').textContent = this.pages[page].title;
    document.title = this.pages[page].title + " — Controle Cozinha Central";

    // Renderiza página
    var module = window.moduleRegistry[this.pages[page].module];
    if (!module) {
      document.getElementById('pageContainer').innerHTML = '<div style="padding:40px;color:#ef4444">Módulo não encontrado: ' + this.pages[page].module + '</div>';
      return;
    }

    var container = document.getElementById('pageContainer');
    try {
      container.innerHTML = module.render();
    } catch(err) {
      container.innerHTML = '<div style="padding:40px;color:#ef4444;font-family:sans-serif"><h3>Erro ao renderizar: ' + this.pages[page].title + '</h3><pre style="background:#1a1a2e;padding:16px;border-radius:8px;font-size:.78rem;overflow:auto;color:#f87171">' + (err.stack || err.message) + '</pre></div>';
      return;
    }

    // Post-render hook
    if (module.postRender) {
      requestAnimationFrame(function() { module.postRender(); });
    }

    container.scrollTop = 0;
  },

  openModal(title, body, buttons = [], extraClass = '') {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = body;

    const footer = document.getElementById('modalFooter');
    footer.innerHTML = buttons.map(btn =>
      `<button class="btn ${btn.class}" onclick="${btn.action}">${btn.label}</button>`
    ).join('');

    const modal = document.getElementById('modal');
    modal.className = `modal ${extraClass}`;

    document.getElementById('modalOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';

    // Focus primeiro input
    setTimeout(() => {
      const firstInput = modal.querySelector('input:not([type="submit"]), select');
      if (firstInput) firstInput.focus();
    }, 100);
  },

  closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
    document.body.style.overflow = '';
  },

  showToast(message, type = 'info') {
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const container = document.getElementById('toastContainer');

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
      <span class="toast-msg">${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  updateDateTime() {
    const now = new Date();
    const opts = { weekday: 'short', day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' };
    document.getElementById('dateDisplay').textContent = now.toLocaleDateString('pt-BR', opts);
  },

  checkAlerts() {
    const estoquesBaixos = DB.getEstoquesBaixos().length;
    const vencidos = DB.getLotesVencidos().length;
    const vencendo = DB.getLotesVencendo(7).length;

    const total = estoquesBaixos + vencidos + vencendo;
    const dot = document.getElementById('notifDot');
    if (dot) dot.classList.toggle('visible', total > 0);

    // Atualizar badge de entrada
    const badgeEntrada = document.getElementById('badge-entrada');
    if (badgeEntrada) {
      const hoje = new Date().toDateString();
      const entradasHoje = DB.getMovimentacoesPorTipo('entrada').filter(e => new Date(e.data).toDateString() === hoje).length;
      if (entradasHoje > 0) {
        badgeEntrada.textContent = entradasHoje;
        badgeEntrada.classList.add('visible');
      }
    }

    // Botão de notificação
    const notifBtn = document.getElementById('notifBtn');
    if (notifBtn && total > 0) {
      notifBtn.addEventListener('click', () => {
        let msg = '⚠️ Alertas do sistema:\n';
        if (estoquesBaixos > 0) msg += `• ${estoquesBaixos} produto(s) com estoque crítico\n`;
        if (vencidos > 0) msg += `• ${vencidos} lote(s) com validade vencida\n`;
        if (vencendo > 0) msg += `• ${vencendo} lote(s) vencem nos próximos 7 dias\n`;
        this.openModal('🔔 Notificações', `
          <div style="display:flex;flex-direction:column;gap:8px">
            ${estoquesBaixos > 0 ? `<div class="alert alert-warning">⚠️ ${estoquesBaixos} produto(s) com estoque crítico — <a href="#" onclick="App.closeModal();App.navigateTo('produtos')" style="color:inherit;text-decoration:underline">Ver produtos</a></div>` : ''}
            ${vencidos > 0 ? `<div class="alert alert-danger">❌ ${vencidos} lote(s) com VALIDADE VENCIDA — <a href="#" onclick="App.closeModal();App.navigateTo('armazenamento')" style="color:inherit;text-decoration:underline">Ver armazenamento</a></div>` : ''}
            ${vencendo > 0 ? `<div class="alert alert-warning">⏰ ${vencendo} lote(s) vencem nos próximos 7 dias — <a href="#" onclick="App.closeModal();App.navigateTo('armazenamento')" style="color:inherit;text-decoration:underline">Ver armazenamento</a></div>` : ''}
            ${total === 0 ? '<div class="alert alert-success">✅ Nenhum alerta no momento!</div>' : ''}
          </div>
        `, [{ label: 'Fechar', class: 'btn-secondary', action: 'App.closeModal()' }]);
      }, { once: true });
    } else if (notifBtn) {
      notifBtn.addEventListener('click', () => {
        this.showToast('✅ Nenhum alerta no momento!', 'success');
      });
    }
  }
};

// Inicializar — funciona tanto com script externo quanto inline no final do body
function _startApp() {
  try {
    App.init();
  } catch(err) {
    console.error('Erro ao iniciar ChefERP:', err);
    var c = document.getElementById('pageContainer');
    if (c) c.innerHTML = '<div style="padding:40px;color:#ef4444;font-family:sans-serif"><h2>Erro ao carregar</h2><pre style="background:#1a1a2e;padding:16px;border-radius:8px;font-size:.8rem;overflow:auto">' + err.stack + '</pre></div>';
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _startApp);
} else {
  // DOM já está pronto (script inline no final do body)
  _startApp();
}

// Atalhos de teclado
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    var overlay = document.getElementById('modalOverlay');
    if (overlay && overlay.classList.contains('active')) App.closeModal();
    var scanner = document.getElementById('scannerOverlay');
    if (scanner && scanner.classList.contains('active')) BarcodeScanner.close();
  }
});
