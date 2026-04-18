const App = {
  currentPage: 'dashboard',
  pages: {
    dashboard: { module: 'DashboardPage', title: 'Painel Principal' },
    produtos:  { module: 'ProdutosPage', title: 'Itens & Validades' },
    etiquetas: { module: 'EtiquetasPage', title: 'Gerador de Etiquetas (Zebra)' }
  },

  init() {
    document.getElementById('mobileMenuBtn').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('mobile-open');
    });

    document.querySelectorAll('.nav-item[data-page]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigateTo(el.dataset.page);
        document.getElementById('sidebar').classList.remove('mobile-open');
      });
    });

    document.getElementById('modalClose').addEventListener('click', () => this.closeModal());
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
      if (e.target === document.getElementById('modalOverlay')) this.closeModal();
    });

    this.updateDateTime();
    setInterval(() => this.updateDateTime(), 60000);

    const hash = window.location.hash.replace('#', '');
    if (hash && this.pages[hash]) {
      this.navigateTo(hash);
    } else {
      this.navigateTo('dashboard');
    }
  },

  navigateTo(page) {
    if (!this.pages[page]) return;

    if (!window.moduleRegistry) {
        window.moduleRegistry = {
          DashboardPage: DashboardPage,
          ProdutosPage:  ProdutosPage,
          EtiquetasPage: EtiquetasPage
        };
    }

    this.currentPage = page;
    window.location.hash = page;

    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    var navEl = document.querySelector('.nav-item[data-page="' + page + '"]');
    if (navEl) navEl.classList.add('active');

    document.getElementById('pageTitle').textContent = this.pages[page].title;
    document.title = this.pages[page].title + " — ERP Lojas";

    var module = window.moduleRegistry[this.pages[page].module];
    if (!module) return;

    var container = document.getElementById('pageContainer');
    try {
      container.innerHTML = module.render();
    } catch(err) {
      container.innerHTML = '<div style="padding:40px;color:#ef4444">Erro: ' + err.message + '</div>';
      return;
    }

    if (module.postRender) {
      requestAnimationFrame(() => module.postRender());
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
  },

  closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
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
    document.getElementById('dateDisplay').textContent = now.toLocaleDateString('pt-BR', {
      weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  }
};

function _startApp() {
  App.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _startApp);
} else {
  _startApp();
}
