window.DashboardPage = {
  render() {
    return `
      <div class="card" style="margin-bottom:20px; border-left:4px solid var(--accent)">
        <div class="card-body">
          <h2 style="margin:0 0 10px 0; color:var(--text-primary)">Bem-vindo(a) ao ERP de Lojas!</h2>
          <p style="color:var(--text-secondary); line-height:1.5;">Aqui você deve cadastrar no menu lateral os itens que costumam ser fracionados pela sua equipe. Depois, utilize o "Gerador de Etiquetas" para imprimir as validades exigidas pela Vigilância Sanitária na impressora Zebra.</p>
        </div>
      </div>
      <div style="display:flex; gap:20px;">
          <div class="card" style="flex:1; cursor:pointer;" onclick="App.navigateTo('produtos')">
             <div class="card-body" style="text-align:center; padding: 40px 20px;">
                <div style="font-size:3rem; margin-bottom:10px;">📋</div>
                <h3>Cadastrar / Alterar Validades</h3>
             </div>
          </div>
          <div class="card" style="flex:1; cursor:pointer;" onclick="App.navigateTo('etiquetas')">
             <div class="card-body" style="text-align:center; padding: 40px 20px;">
                <div style="font-size:3rem; margin-bottom:10px;">🏷️</div>
                <h3 style="color:var(--accent)">Imprimir Etiquetas Zebra</h3>
             </div>
          </div>
      </div>
    `;
  },
  postRender() {}
};
