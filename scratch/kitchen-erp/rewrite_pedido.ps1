$f = 'C:\Users\luxan\.gemini\antigravity\scratch\kitchen-erp\pedido.html'
$content = [IO.File]::ReadAllText($f, [Text.Encoding]::UTF8)

$oldScript = '<script>' + "`r`n" + '// ----- FIREBASE -----'

$newScript = @'
<script>
// ----- FIREBASE -----
const FIREBASE_BASE        = "https://controle-cozinha-central-default-rtdb.firebaseio.com";
const FIREBASE_PEDIDOS_URL = FIREBASE_BASE + "/chef_pedidos.json";
const FIREBASE_CATALOGO_URL= FIREBASE_BASE + "/chef_pedido_catalogo.json";
const FIREBASE_METAS_URL   = FIREBASE_BASE + "/chef_lojas_metas.json";

// ----- LOJAS -----
const LOJAS = ["VALPARAISO","VITORIA","ITAPARICA","GUARAPARI","LINHARES","ITAPOA","Outro"];

// ----- CATÁLOGO PADRÃO (fallback offline) -----
const CATEGORIAS_PADRAO = [
  {
    id: "insumos", nome: "Recheios", icon: "🥩",
    itens: [
      { nome: "Pepperoni", max: 0 }, { nome: "Carne Hamburguer", max: 0 }, { nome: "Bacon em cubos", max: 0 },
      { nome: "Calabresa triturada", max: 0 }, { nome: "Carne moída", max: 0 }, { nome: "Carne de Panela", max: 0 },
      { nome: "Cebola caramelizada", max: 0 }, { nome: "Filé em Cubos", max: 0 }, { nome: "Frango Desfiado", max: 0 },
      { nome: "Frango defumado", max: 0 }, { nome: "Lombo Assado", max: 0 }, { nome: "Mexicana", max: 0 },
      { nome: "Mini kibe", max: 0 }, { nome: "Mistura Liquida", max: 0 }, { nome: "Mistura para maionese", max: 0 },
      { nome: "Mistura Seca 5 kg", max: 0 }, { nome: "Mistura Seca 15 kg", max: 0 }, { nome: "Molho Gorgonzola", max: 0 },
      { nome: "Presunto triturado", max: 0 }, { nome: "Chocolate Branco", max: 0 }
    ]
  },
  {
    id: "cozinha", nome: "Cozinha", icon: "🧑‍🍳",
    itens: [
      { nome: "Açucar 5 kg", max: 2 }, { nome: "Alho frito KG", max: 2 }, { nome: "Brigadeiro Caixas", max: 3 },
      { nome: "Café 500 G", max: 3 }, { nome: "Canela KG", max: 2 }, { nome: "Creme de Leite L", max: 4 },
      { nome: "Fuba KG", max: 40 }, { nome: "Goiabada Bisnaga", max: 3 }, { nome: "Granulado KG", max: 3 },
      { nome: "Kinder ovo", max: 4 }, { nome: "Kinder Bueno CX", max: 2 }, { nome: "Leite Condensado CX", max: 30 },
      { nome: "M&Ms KG", max: 6 }, { nome: "Milho Latinha Fardo", max: 30 }, { nome: "Nachos Pacote", max: 8 },
      { nome: "Nuttela Balde", max: 6 }, { nome: "Óleo Caixa", max: 4 }, { nome: "Paçoca Caixa", max: 2 },
      { nome: "Rolo de sacola", max: 2 }, { nome: "Batata Palha Caixa", max: 2 }, { nome: "Palmito Caixa", max: 2 },
      { nome: "Molho de Tomate", max: 20 }, { nome: "Mostarda", max: 4 }, { nome: "Leite Ninho", max: 2 },
      { nome: "MUSSARELA PÇ", max: 27 }, { nome: "Requeijão 1,8 kg", max: 18 }, { nome: "Cheddar 1,2 kg", max: 6 },
      { nome: "Parmêsão Ralado Kg", max: 2 }, { nome: "GORGONZOLA Peça", max: 1 }, { nome: "OREGANO Pacote", max: 2 },
      { nome: "Cream Cheese 1 kg", max: 6 }, { nome: "Lombo Canadense", max: 6 }, { nome: "Sacolina de chupchup", max: 4 },
      { nome: "Bombom Ouro Branco", max: 4 }, { nome: "Chocolate branco", max: 2 }, { nome: "Papel Lanche UN", max: 2 },
      { nome: "Doce de Leite Caixa", max: 3 }, { nome: "Alho Poro", max: 10 }, { nome: "Trigo kg", max: 300 },
      { nome: "Detergente Un", max: 20 }, { nome: "Cloro Galão", max: 4 }, { nome: "Bombril Pacote", max: 2 },
      { nome: "Esponja fina pacote", max: 2 }, { nome: "Esponja grossa pct", max: 2 }, { nome: "Limpador Forno", max: 2 },
      { nome: "Luva Preta Caixa", max: 4 }, { nome: "Touca Pacote", max: 4 }, { nome: "Ovo de Galinha", max: 3 }
    ]
  },
  {
    id: "frenteloja", nome: "Frente de Loja", icon: "🏪",
    itens: [
      { nome: "Caixa 1", max: 0 }, { nome: "Caixa 2", max: 0 }, { nome: "Caixa 4", max: 0 },
      { nome: "Caixa 6", max: 0 }, { nome: "Caixa 8", max: 0 }, { nome: "Caixa 12", max: 0 },
      { nome: "Tira P", max: 0 }, { nome: "Tira G", max: 0 }, { nome: "Bandeja P", max: 0 },
      { nome: "Bandeja G", max: 0 }, { nome: "Papel Bandeja", max: 0 }, { nome: "Garra 300ml", max: 0 },
      { nome: "Garra 1 litro", max: 0 }, { nome: "Barbecue 3,5 L", max: 4 },
      { nome: "Copinho Maionese CX", max: 2 }, { nome: "Papel Higienico", max: 2 },
      { nome: "Coca 1,5 L", max: 16 }, { nome: "Coca 1,5 l Zero", max: 16 },
      { nome: "Coca Lata", max: 6 }, { nome: "Coca Lata Zero", max: 6 }, { nome: "Alcool Liquido", max: 10 },
      { nome: "Colherzinha Caixa", max: 2 }, { nome: "Sacola Camiseta 38x48", max: 2 }, { nome: "Canudo", max: 2 },
      { nome: "Ketchup sache", max: 2 }, { nome: "Barbecue sache", max: 2 }, { nome: "Guardanapo", max: 3 },
      { nome: "Prato Descartavel", max: 2 }, { nome: "KETCHUP 3,5 L", max: 4 },
      { nome: "Saco Lixo 100L Fardo", max: 2 }, { nome: "Saco Lixo 200 l Fardo", max: 2 },
      { nome: "Papel para maos", max: 3 }, { nome: "Guarana 1,5 L", max: 6 },
      { nome: "Agua sem gas", max: 15 }, { nome: "Agua com gas", max: 15 },
      { nome: "H2O Limao", max: 2 }, { nome: "H2O Limoneto", max: 2 }, { nome: "Suco de Uva Dellvale", max: 6 }
    ]
  }
];

// ----- ESTADO -----
let CATEGORIAS  = CATEGORIAS_PADRAO;
let METAS_LOJA  = {};  // { "NomeItem": maxQtd } para a loja selecionada
let LOJA_ATUAL  = '';

const params    = new URLSearchParams(window.location.search);
const tipoAtual = params.get('tipo');
const lojaParam = params.get('loja') || '';

// ----- INICIALIZAÇÃO -----
async function init() {
  // Carrega catálogo atualizado
  try {
    const res  = await fetch(FIREBASE_CATALOGO_URL);
    const data = await res.json();
    if (data && Array.isArray(data) && data.length > 0) CATEGORIAS = data;
  } catch (e) {
    console.warn('[pedido.html] Catálogo: usando fallback local.');
  }

  // Se a loja já está na URL, carrega as metas dela
  if (lojaParam) {
    LOJA_ATUAL = lojaParam;
    await carregarMetasLoja(lojaParam);
  }

  render();
}

// Busca as metas de uma loja específica do Firebase
async function carregarMetasLoja(loja) {
  try {
    const res  = await fetch(FIREBASE_METAS_URL);
    const data = await res.json();
    if (data) {
      const entrada = Object.values(data).find(m => m.loja === loja);
      METAS_LOJA = entrada ? (entrada.itens || {}) : {};
    }
  } catch (e) {
    METAS_LOJA = {};
    console.warn('[pedido.html] Metas: Firebase indisponível.');
  }
}

// ----- RENDER -----
function render() {
  if (!tipoAtual) {
    // ── TELA DE LANDING ──────────────────────────────────────────────────
    document.getElementById('pedidoForm').style.display = 'none';
    const container = document.getElementById('formContent');

    const lojasOpts = LOJAS.map(l =>
      `<option value="${l}"${l === lojaParam ? ' selected' : ''}>${l}</option>`
    ).join('');

    const botoes = CATEGORIAS.map(cat => `
      <a href="?loja=${encodeURIComponent(lojaParam)}&tipo=${cat.id}" style="text-decoration:none" id="btn_${cat.id}"
         onclick="if(!document.getElementById('selLojaLanding').value){event.preventDefault();alert('Selecione a loja primeiro!');}else{this.href='?loja='+encodeURIComponent(document.getElementById('selLojaLanding').value)+'&tipo=${cat.id}';}">
        <div style="background:var(--bg-card); border: 2px solid var(--border); padding:24px; border-radius:12px; text-align:center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); cursor:pointer; transition:border-color .2s"
             onmouseover="this.style.borderColor='#FFDD00'" onmouseout="this.style.borderColor=''">
           <div style="font-size:2.5rem; margin-bottom:8px;">${cat.icon}</div>
           <h3 style="color:var(--text-main); font-size:1.3rem">${cat.nome}</h3>
           <p style="color:var(--text-muted); margin-top:4px; font-size:.85rem">${cat.itens.length} itens</p>
        </div>
      </a>
    `).join('');

    container.innerHTML = `
      <div style="margin-bottom:28px;">
        <label for="selLojaLanding" style="display:block;font-weight:700;margin-bottom:8px;font-size:1rem">
          1. Qual é a sua loja?
        </label>
        <select id="selLojaLanding" style="width:100%;padding:12px;font-size:1rem;border-radius:8px;border:2px solid var(--border);font-family:inherit"
          onchange="atualizarLinksCategoria(this.value)">
          <option value="">— Selecione a unidade —</option>
          ${lojasOpts}
        </select>
      </div>
      <div id="avisoLoja" style="display:${lojaParam?'none':'block'};background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:.88rem;color:#854d0e">
        ⚠️ Selecione a loja para ver os limites máximos de cada item.
      </div>
      <label style="display:block;font-weight:700;margin-bottom:12px;font-size:1rem">
        2. O que você deseja inventariar agora?
      </label>
      <div style="display:flex; flex-direction:column; gap:16px;">${botoes}</div>
    `;

  } else {
    // ── TELA DE FORMULÁRIO ────────────────────────────────────────────────
    const container = document.getElementById('itemsContainer');
    const cat = CATEGORIAS.find(c => c.id === tipoAtual);

    if (!cat) {
      container.innerHTML = `<div style="padding:30px;text-align:center;color:#ef4444">Categoria não encontrada. <a href="pedido.html">Voltar</a></div>`;
      return;
    }

    // Pré-seleciona a loja no select se veio pela URL
    if (lojaParam) {
      const sel = document.getElementById('loja');
      if (sel) sel.value = lojaParam;
    }

    document.querySelector('.header p').innerHTML =
      `<strong>Inventário de ${cat.nome}</strong> — ${lojaParam ? '<span style="background:#000;color:#FFDD00;padding:2px 8px;border-radius:4px">'+lojaParam+'</span>' : ''}<br><small>Preencha as quantidades ATUAIS na loja</small>`;

    const sec  = document.createElement('div');
    sec.innerHTML = `<h3 class="section-title">${cat.icon} ${cat.nome}</h3>`;
    const grid = document.createElement('div');
    grid.className = 'item-grid';

    const itensOrdenados = [...cat.itens].sort((a, b) => {
      const nA = (typeof a === 'object' ? a.nome : a) || '';
      const nB = (typeof b === 'object' ? b.nome : b) || '';
      return nA.localeCompare(nB, 'pt-BR', { sensitivity: 'base' });
    });

    itensOrdenados.forEach(item => {
      const nome = typeof item === 'object' ? item.nome : item;
      // Prioridade: 1) meta configurada por loja, 2) max do catálogo
      const maxLoja    = METAS_LOJA[nome];
      const maxCatalog = typeof item === 'object' ? item.max : 0;
      const maxExibir  = (maxLoja !== undefined) ? maxLoja : maxCatalog;

      const maxLabel = maxExibir > 0
        ? `<span style="font-size:0.72rem;color:#0ea5e9;font-weight:600;display:block;margin-top:2px;">Máx: ${maxExibir}</span>`
        : `<span style="font-size:0.72rem;color:#94a3b8;display:block;margin-top:2px;">Sem limite configurado</span>`;

      const card = document.createElement('div');
      card.className = 'item-card';
      card.innerHTML = `
        <label>${nome}${maxLabel}</label>
        <input type="number" min="0" step="1" name="item_${nome}" placeholder="0" max="${maxExibir || ''}" />
      `;
      grid.appendChild(card);
    });

    sec.appendChild(grid);
    container.appendChild(sec);
  }
}

// Atualiza os links de categoria quando a loja é selecionada na landing
function atualizarLinksCategoria(loja) {
  document.getElementById('avisoLoja').style.display = loja ? 'none' : 'block';
  CATEGORIAS.forEach(cat => {
    const a = document.getElementById('btn_' + cat.id);
    if (a) a.href = loja ? `?loja=${encodeURIComponent(loja)}&tipo=${cat.id}` : '#';
  });
}

// Inicializa
init();

// ----- ENVIO DO FORMULÁRIO -----
document.getElementById('pedidoForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btnSubmit');

  const loja = document.getElementById('loja').value;
  if (!loja) return alert("Selecione a Loja!");

  const inputs = document.querySelectorAll('.item-card input');
  const itensPedidos = [];

  inputs.forEach(inp => {
    const qty = parseInt(inp.value);
    if (qty > 0) {
      const nome = inp.name.replace('item_', '');
      itensPedidos.push({ nome, quantidade: qty, separado: 0 });
    }
  });

  if (itensPedidos.length === 0) {
    return alert("Você precisa informar pelo menos 1 item para enviar.");
  }

  const pedidoData = {
    id:          'ped' + Date.now().toString(),
    loja,
    data:        new Date().toISOString(),
    status:      'pendente',
    itens:       itensPedidos,
    solicitante: 'Gerente da Loja'
  };

  try {
    btn.disabled = true;
    btn.textContent = 'Enviando...';

    const res = await fetch(FIREBASE_PEDIDOS_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(pedidoData)
    });

    if (!res.ok) throw new Error("Falha na rede ao salvar no Firebase.");

    document.getElementById('formContent').style.display = 'none';
    document.getElementById('successBox').style.display  = 'block';

  } catch (err) {
    console.error(err);
    alert("Erro ao enviar pedido! Verifique a internet e tente novamente.");
    btn.disabled = false;
    btn.textContent = 'Enviar Inventário para Cozinha Central';
  }
});
</script>
</body>
</html>
'@

# Localiza o inicio do bloco script
$scriptStart = $content.IndexOf('<script>')
if ($scriptStart -lt 0) {
  Write-Host "ERRO: tag <script> nao encontrada!"
  exit 1
}

$newContent = $content.Substring(0, $scriptStart) + $newScript
[IO.File]::WriteAllText($f, $newContent, [Text.Encoding]::UTF8)
Write-Host "OK: pedido.html reescrito com selecao de loja na landing e limites por loja."
