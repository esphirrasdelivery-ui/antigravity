/**
 * produtos.js (Versão ERP Loja Simplificado)
 */

window.ProdutosPage = {
  render() {
    const produtos = DB.getProdutos() || [];

    let tableRows = '';
    if (produtos.length === 0) {
      tableRows = '<tr><td colspan="4" class="text-center" style="padding:40px;color:var(--text-muted)">Nenhum insumo configurado. Adicione os itens que você precisa etiquetar na gaveta/geladeira.</td></tr>';
    } else {
      tableRows = produtos.map(p => {
        let tempIcon = '';
        if(p.temperatura === 'Congelado') tempIcon = '❄️';
        if(p.temperatura === 'Resfriado') tempIcon = '🧊';
        if(p.temperatura === 'Temperatura Ambiente') tempIcon = '🌡️';

        return `
          <tr>
            <td><strong>${p.nome}</strong></td>
            <td>${p.validadeDias} dias</td>
            <td><span class="badge" style="background:var(--bg-card);color:var(--text-primary)">${tempIcon} ${p.temperatura || '—'}</span></td>
            <td>
              <button class="btn btn-secondary btn-sm" onclick="ProdutosPage.openModal('${p.id}')">✏️ Editar</button>
              <button class="btn btn-danger btn-sm" onclick="ProdutosPage.deletar('${p.id}')">🗑️</button>
            </td>
          </tr>
        `;
      }).join('');
    }

    return `
      <div class="card">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <h2>📋 Itens que Requerem Etiqueta (Tabela Nutricional / Fracionamento)</h2>
            <p>Cadastre aqui as coisas que os funcionários manipulam na loja e precisam ter etiqueta de vencimento para Vigilância Sanitária.</p>
          </div>
          <button class="btn btn-primary" onclick="ProdutosPage.openModal()">+ Novo Insumo</button>
        </div>
        <div class="card-body">
          <table class="table">
            <thead>
              <tr>
                <th>Nome do Insumo</th>
                <th>Validade Padrão Após Aberto/Produzido</th>
                <th>Armazenamento Ideal</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>
      </div>
    `;
  },

  postRender() {},

  openModal(id = null) {
    let titulo = 'Cadastrar Novo Insumo';
    let p = null;
    
    if (id) {
      p = DB.getProdutos().find(x => x.id === id);
      titulo = `Editar: ${p ? p.nome : ''}`;
    }

    const val = k => (p && p[k]) !== undefined ? p[k] : '';
    const sel = (k, v) => val(k) === v ? 'selected' : '';

    const body = `
      <form id="formProduto" onsubmit="ProdutosPage.salvar(event, '${id || ''}')">
        <div class="form-group" style="margin-bottom:15px">
          <label>Nome do Produto (Ex: Carne Moída Temperada, Maionese Base, Kibe Aberto) *</label>
          <input type="text" id="pNome" required class="input-form" value="${val('nome')}" />
        </div>
        <div class="form-group" style="margin-bottom:15px">
          <label>Dias de Validade (Tempo de vida após aberto / produzido) *</label>
          <input type="number" id="pValidadeDias" min="1" step="1" required class="input-form" value="${val('validadeDias')}" placeholder="Ex: 3" />
        </div>
        <div class="form-group" style="margin-bottom:20px">
          <label>Onde é guardado? (Vigilância Sanitária) *</label>
          <select id="pTemperatura" required class="input-form">
            <option value="Congelado" ${sel('temperatura', 'Congelado')}>❄️ Congelado (Abaixo de -18°C)</option>
            <option value="Resfriado" ${sel('temperatura', 'Resfriado')}>🧊 Resfriado (Geladeira 0 a 10°C)</option>
            <option value="Temperatura Ambiente" ${sel('temperatura', 'Temperatura Ambiente')}>🌡️ Temp. Ambiente (Câmara Seca)</option>
          </select>
        </div>
        <input type="submit" style="display:none" />
      </form>
    `;

    App.openModal(titulo, body, [
      { label: 'Cancelar', class: 'btn-secondary', action: 'App.closeModal()' },
      { label: 'Salvar Insumo Base', class: 'btn-primary', action: "document.getElementById('formProduto').requestSubmit()" }
    ]);
  },

  salvar(e, id) {
    e.preventDefault();
    const nome = document.getElementById('pNome').value.trim();
    const validadeDias = parseInt(document.getElementById('pValidadeDias').value);
    const temperatura = document.getElementById('pTemperatura').value;

    const data = { nome, validadeDias, temperatura };

    if (id) {
       DB.updateProduto(id, data);
       App.showToast('✅ Insumo atualizado!', 'success');
    } else {
       DB.addProduto(data);
       App.showToast('✅ Insumo cadastrado com sucesso!', 'success');
    }

    App.closeModal();
    App.navigateTo('produtos');
  },

  deletar(id) {
    const p = DB.getProdutos().find(x => x.id === id);
    if (!p) return;
    if (confirm(`Excluir Insumo: ${p.nome}? Ele não poderá mais ser etiquetado.`)) {
      DB.deleteProduto(id);
      App.showToast('Insumo removido da lista!', 'info');
      App.navigateTo('produtos');
    }
  }
};
