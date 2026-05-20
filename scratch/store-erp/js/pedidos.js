/**
 * pedidos.js
 * Módulo de Pedidos e Compras (Gestão Interna da Loja)
 */

window.PedidosPage = {
  render() {
    const pedidos = DB.getPedidosCompra() || [];
    
    // Ordenar do mais recente
    pedidos.sort((a,b) => new Date(b.data).getTime() - new Date(a.data).getTime());

    let tableRows = '';
    
    if (pedidos.length === 0) {
      tableRows = '<tr><td colspan="4" class="text-center" style="padding:40px;color:var(--text-muted)">Nenhum pedido de compra gerado ainda.</td></tr>';
    } else {
      tableRows = pedidos.map(p => {
        const d = new Date(p.data);
        const dataStr = d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
        
        // Sum total quantities
        const totalItems = (p.itens || []).reduce((acc, curr) => acc + curr.quantidade, 0);

        return `
          <tr>
            <td><strong>#${p.id.substring(4, 10).toUpperCase()}</strong></td>
            <td>${dataStr}</td>
            <td>${totalItems} volumes totais</td>
            <td style="text-align:right">
              <button class="btn btn-secondary btn-sm" onclick="PedidosPage.imprimirPedido('${p.id}')">🖨️ Imprimir Lista</button>
            </td>
          </tr>
        `;
      }).join('');
    }

    return `
      <div class="card">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <h2>🛒 Histórico de Compras da Loja</h2>
            <p>Faça as listas de compras semanais para distribuidoras locais, atacadistas e feira.</p>
          </div>
          <button class="btn btn-primary" style="font-size:1.1rem; padding: 10px 20px" onclick="PedidosPage.novoPedido()">+ NOVO PEDIDO</button>
        </div>
        <div class="card-body">
          <table class="table">
            <thead>
              <tr>
                <th>Cód. Pedido</th>
                <th>Data</th>
                <th>Tamanho do Pedido</th>
                <th style="text-align:right">Ações</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>
      </div>
    `;
  },

  postRender() {},

  novoPedido() {
    // Busca banco
    const produtos = DB.getProdutosCompra() || [];
    
    if(produtos.length === 0) {
        App.showToast("Nenhum produto cadastrado no sistema ainda.", "warning");
        return;
    }

    // Agrupa itens por categoria
    const porCategoria = {};
    produtos.forEach(p => {
       const cat = p.categoria || 'Outros';
       if(!porCategoria[cat]) porCategoria[cat] = [];
       porCategoria[cat].push(p);
    });

    let formHTML = '<div style="max-height: 60vh; overflow-y: auto; padding-right:10px">';
    
    Object.keys(porCategoria).sort().forEach(catName => {
        formHTML += `<h3 style="margin-top:20px; font-weight:700; color:var(--text-main); border-bottom:1px solid var(--border); padding-bottom:5px">${catName}</h3>`;
        formHTML += `<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:15px; margin-top:10px">`;
        
        porCategoria[catName].forEach(item => {
            formHTML += `
               <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-secondary); padding:10px; border-radius:6px; border:1px solid var(--border)">
                  <label style="font-size:0.95rem; margin:0; flex:1">${item.nome}</label>
                  <input type="number" class="input-form input-compra" data-id="${item.id}" data-nome="${item.nome}" min="0" placeholder="0" style="width:70px; text-align:center; margin:0;" />
               </div>
            `;
        });
        
        formHTML += `</div>`;
    });
    
    formHTML += '</div>';

    App.openModal('Gerar Nova Lista de Compra', formHTML, [
       { label: 'Cancelar', class: 'btn-secondary', action: 'App.closeModal()' },
       { label: 'Salvar e Gerar Lista', class: 'btn-primary', action: 'PedidosPage.salvarNovoPedido()' },
    ], 'modal-lg');
  },

  salvarNovoPedido() {
      const inputs = document.querySelectorAll('.input-compra');
      const itensSelecionados = [];

      inputs.forEach(inp => {
          const qtd = parseInt(inp.value) || 0;
          if(qtd > 0) {
              itensSelecionados.push({
                  id: inp.getAttribute('data-id'),
                  nome: inp.getAttribute('data-nome'),
                  quantidade: qtd
              });
          }
      });

      if (itensSelecionados.length === 0) {
          return alert("Preencha ao menos 1 item para gerar o pedido.");
      }

      const pedido = DB.addPedidoCompra({ itens: itensSelecionados });
      App.closeModal();
      App.showToast("✅ Lista de Compras gerada!", "success");
      App.navigateTo('pedidos');
      
      // Abre a impressao direto
      setTimeout(() => this.imprimirPedido(pedido.id), 500);
  },

  imprimirPedido(id) {
      const pedidos = DB.getPedidosCompra();
      const p = pedidos.find(x => x.id === id);
      if(!p) return;

      const dStr = new Date(p.data).toLocaleDateString('pt-BR');
      
      let htmlRows = '';
      p.itens.forEach(i => {
          htmlRows += `
            <tr style="border-bottom:1px dashed #ccc">
               <td style="padding:10px 0;width:30px"><div style="width:15px;height:15px;border:2px solid #000;border-radius:3px"></div></td>
               <td style="padding:10px 0;font-weight:bold; font-size:1.1rem; width:50px">${i.quantidade}</td>
               <td style="padding:10px 0;font-size:1.1rem">${i.nome}</td>
               <td style="padding:10px 0;border-bottom:1px solid #999"></td>
            </tr>
          `;
      });

      const win = window.open('', '_blank');
      win.document.write(`
        <html>
           <head>
             <title>Lista Compra #${p.id.substring(4, 10).toUpperCase()}</title>
             <style>
               body { font-family: Arial, sans-serif; padding:40px; color:#000; }
               @media print { body { padding:0; } button { display:none; } }
             </style>
           </head>
           <body>
              <div style="text-align:center; border-bottom:2px solid #000; margin-bottom:20px; padding-bottom:10px">
                 <h1 style="margin:0 0 10px 0">🛒 LISTA DE COMPRAS</h1>
                 <strong>Data de Geração:</strong> ${dStr} &nbsp; | &nbsp; <strong>Código:</strong> #${p.id.substring(4, 10).toUpperCase()}
              </div>
              <table style="width:100%; border-collapse:collapse">
                 <thead>
                   <tr>
                     <th></th>
                     <th style="text-align:left; color:#555">QTD</th>
                     <th style="text-align:left; color:#555">DESCRIÇÃO DO ITEM</th>
                     <th style="text-align:left; color:#555">MARCA COLETADA / PREÇO (R$)</th>
                   </tr>
                 </thead>
                 <tbody>${htmlRows}</tbody>
              </table>

              <div style="margin-top:50px;text-align:center">
                 <button onclick="window.print()" style="padding:15px 30px;font-size:18px;background:#000;color:#fff;border:none;cursor:pointer">Imprimir Agora</button>
              </div>
           </body>
        </html>
      `);
      win.document.close();
  }
};
