/**
 * reminder.js — Lembretes de inventário via WhatsApp
 * Esphirra's Delivery
 *
 * Toda quarta-feira, das 16h às 23h (horário de Brasília), verifica a cada hora
 * se as lojas configuradas já enviaram o formulário de inventário.
 * Se não enviaram, dispara mensagem no WhatsApp do responsável.
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cron   = require('node-cron');

const FIREBASE_BASE = 'https://controle-cozinha-central-default-rtdb.firebaseio.com';
const FIREBASE_URL  = FIREBASE_BASE + '/chef_pedidos.json';
const FORM_URL      = 'https://esphirras-erp.pages.dev/pedido.html';

// ── BUSCA RESPONSÁVEIS DO FIREBASE (configurados via meta-loja.html) ──────────
// Retorna: { GUARAPARI: { setores: { insumos: {nome,telefone}, cozinha: {...} } }, ... }
async function getResponsaveis() {
  try {
    const res  = await fetch(`${FIREBASE_BASE}/chef_responsaveis_lojas.json`, { signal: AbortSignal.timeout(8000) });
    const data = await res.json();
    if (data && !data.error) return data;
  } catch(e) {
    console.error('[Firebase] Erro ao buscar responsáveis:', e.message);
  }
  return {};
}

// Nomes legíveis por ID de setor
const SETOR_NOME = { insumos: 'Recheios', cozinha: 'Cozinha', frenteloja: 'Frente de Loja' };

// ── WHATSAPP CLIENT ───────────────────────────────────────────────────────────
const client = new Client({
  authStrategy: new LocalAuth({ dataPath: '.wwebjs_auth' }),
  puppeteer: {
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

client.on('qr', qr => {
  console.log('\n📱 Escaneie o QR Code abaixo com o WhatsApp do celular:');
  qrcode.generate(qr, { small: true });
  console.log('(Menu WhatsApp → Dispositivos conectados → Conectar dispositivo)\n');
});

client.on('authenticated', () => console.log('✅ WhatsApp autenticado.'));
client.on('auth_failure', msg => console.error('❌ Falha de autenticação:', msg));

client.on('ready', () => {
  console.log('✅ WhatsApp pronto!');
  console.log('⏰ Aguardando cronograma: toda quarta-feira das 16h às 23h...\n');
});

client.on('disconnected', reason => {
  console.error('❌ WhatsApp desconectado:', reason);
  client.initialize();
});

// ── VERIFICAÇÃO NO FIREBASE ───────────────────────────────────────────────────
async function pedidoEnviadoHoje(loja) {
  const hoje = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }); // YYYY-MM-DD
  try {
    const res  = await fetch(FIREBASE_URL, { signal: AbortSignal.timeout(10000) });
    const data = await res.json();
    if (!data || data.error) return false;
    return Object.values(data).some(p =>
      p.loja === loja &&
      p.data &&
      p.data.slice(0, 10) === hoje
    );
  } catch (e) {
    console.error(`[Firebase] Erro ao consultar: ${e.message}`);
    return false;
  }
}

// ── DISPARO MANUAL (para teste imediato) ─────────────────────────────────────
async function verificarTodasAsLojas() {
  console.log(`\n[${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}] Verificando formulários...`);
  const responsaveis = await getResponsaveis();

  if (!Object.keys(responsaveis).length) {
    console.log('⚠️  Nenhum responsável configurado. Acesse meta-loja.html para cadastrar.');
    return;
  }

  for (const [loja, lojaData] of Object.entries(responsaveis)) {
    const setores = lojaData.setores || {};
    if (!Object.keys(setores).length) continue;

    const enviado = await pedidoEnviadoHoje(loja);

    // Agrupa setores por telefone para não spammar quem é responsável por vários setores
    const porTelefone = {};
    for (const [setorId, cfg] of Object.entries(setores)) {
      if (!cfg.telefone) continue;
      if (!porTelefone[cfg.telefone]) porTelefone[cfg.telefone] = { nome: cfg.nome, setores: [] };
      porTelefone[cfg.telefone].setores.push(SETOR_NOME[setorId] || setorId);
    }

    for (const [telefone, info] of Object.entries(porTelefone)) {
      const hora   = new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
      const setNomes = info.setores.join(', ');

      if (enviado) {
        console.log(`[${hora}] [${loja}/${setNomes}] ✅ Formulário já enviado. Nenhum lembrete.`);
        continue;
      }

      const chatId = `${telefone}@c.us`;
      const msg =
        `🍕 *Esphirra's Delivery — Lembrete de Inventário*\n\n` +
        `Loja: *${loja}*  |  Setor: *${setNomes}*\n\n` +
        `⚠️ O formulário de inventário desta quarta-feira ainda *não foi enviado*.\n\n` +
        `Acesse agora:\n${FORM_URL}?loja=${loja}\n\n` +
        `_Este aviso é enviado a cada hora até o envio do formulário._`;

      try {
        await client.sendMessage(chatId, msg);
        console.log(`[${hora}] [${loja}/${setNomes}] 📨 Lembrete enviado para ${telefone}`);
      } catch(e) {
        console.error(`[${hora}] [${loja}/${setNomes}] ❌ Erro: ${e.message}`);
      }
    }
  }
}

// ── CRON ──────────────────────────────────────────────────────────────────────
// Toda quarta-feira (dia 3), das 16:00 às 23:00, exatamente no minuto 0
cron.schedule('0 16-23 * * 3', verificarTodasAsLojas, {
  timezone: 'America/Sao_Paulo',
  scheduled: true,
});

// ── INICIALIZAÇÃO ─────────────────────────────────────────────────────────────
console.log('🚀 Esphirra\'s — Sistema de Lembretes de Inventário');
console.log('   Responsáveis: configurados via meta-loja.html (Firebase)');
console.log('   Cronograma: toda quarta-feira, 16h–23h\n');

// Para testar manualmente: node reminder.js --test
if (process.argv.includes('--test')) {
  client.on('ready', async () => {
    console.log('\n🧪 Modo de teste — disparando verificação agora...\n');
    await verificarTodasAsLojas();
    console.log('\nTeste concluído. Encerrando em 5s...');
    setTimeout(() => process.exit(0), 5000);
  });
}

client.initialize();
