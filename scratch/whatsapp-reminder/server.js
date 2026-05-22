/**
 * server.js — WhatsApp Reminder Server
 * Esphirra's Delivery
 *
 * Servidor local (localhost:3001) que:
 *  1. Gerencia a conexão WhatsApp via QR code
 *  2. Expõe API REST para a página whatsapp.html no ERP
 *  3. Executa lembretes automáticos toda quarta-feira 16h–23h
 */

const express = require('express');
const cors    = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode  = require('qrcode');
const cron    = require('node-cron');

const app  = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// ── ESTADO ────────────────────────────────────────────────────────────────────
// 'loading' | 'qr' | 'connected' | 'disconnected'
let waStatus = 'loading';
let waQRData = null;   // base64 data URL do QR code

// ── FIREBASE ──────────────────────────────────────────────────────────────────
const FIREBASE_BASE = 'https://controle-cozinha-central-default-rtdb.firebaseio.com';
const FORM_URL      = 'https://esphirras-erp.pages.dev/pedido.html';
const SETOR_NOME    = { insumos: 'Recheios', cozinha: 'Cozinha', frenteloja: 'Frente de Loja' };

// ── WHATSAPP CLIENT ───────────────────────────────────────────────────────────
const client = new Client({
  authStrategy: new LocalAuth({ dataPath: '.wwebjs_auth' }),
  puppeteer: {
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

client.on('qr', async qr => {
  waStatus = 'qr';
  waQRData = await QRCode.toDataURL(qr, { width: 300, margin: 2 });
  console.log('[WhatsApp] QR code pronto — acesse o ERP para escanear');
});

client.on('authenticated', () => {
  console.log('[WhatsApp] Autenticado com sucesso.');
});

client.on('ready', () => {
  waStatus = 'connected';
  waQRData = null;
  console.log('[WhatsApp] Conectado e pronto para enviar mensagens!');
});

client.on('auth_failure', () => {
  waStatus = 'disconnected';
  waQRData = null;
  console.error('[WhatsApp] Falha na autenticação.');
});

client.on('disconnected', reason => {
  waStatus = 'disconnected';
  waQRData = null;
  console.log('[WhatsApp] Desconectado:', reason);
  setTimeout(() => {
    console.log('[WhatsApp] Reconectando...');
    client.initialize();
  }, 5000);
});

// ── API ───────────────────────────────────────────────────────────────────────
app.get('/api/status', (req, res) => {
  res.json({ status: waStatus, qr: waQRData });
});

app.post('/api/disconnect', async (req, res) => {
  try {
    await client.logout();
    waStatus = 'disconnected';
    waQRData = null;
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/test', async (req, res) => {
  if (waStatus !== 'connected') {
    return res.status(400).json({ error: 'WhatsApp não conectado. Escaneie o QR code primeiro.' });
  }
  verificarTodasAsLojas();
  res.json({ ok: true });
});

// Verifica se os números configurados têm WhatsApp
app.get('/api/check-phones', async (req, res) => {
  if (waStatus !== 'connected') {
    return res.status(400).json({ error: 'WhatsApp não conectado.' });
  }
  const responsaveis = await getResponsaveis();
  const resultado = {};

  for (const [loja, lojaData] of Object.entries(responsaveis)) {
    resultado[loja] = {};
    const setores = lojaData.setores || {};
    // Coleta telefones únicos da loja
    const fones = [...new Set(Object.values(setores).map(s => s.telefone).filter(Boolean))];
    for (const tel of fones) {
      try {
        const id = await client.getNumberId(tel);
        resultado[loja][tel] = id ? { ok: true, id: id._serialized } : { ok: false };
      } catch(e) {
        resultado[loja][tel] = { ok: false, erro: e.message };
      }
    }
  }
  res.json(resultado);
});

// ── FIREBASE: VERIFICAÇÃO DE PEDIDOS ─────────────────────────────────────────
async function pedidoEnviadoHoje(loja) {
  const hoje = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
  try {
    const res  = await fetch(`${FIREBASE_BASE}/chef_pedidos.json`, { signal: AbortSignal.timeout(10000) });
    const data = await res.json();
    if (!data || data.error) return false;
    return Object.values(data).some(p =>
      p.loja === loja && p.data && p.data.slice(0, 10) === hoje
    );
  } catch (e) {
    console.error('[Firebase] Erro ao consultar pedidos:', e.message);
    return false;
  }
}

async function getResponsaveis() {
  try {
    const res  = await fetch(`${FIREBASE_BASE}/chef_responsaveis_lojas.json`, { signal: AbortSignal.timeout(8000) });
    const data = await res.json();
    if (data && !data.error) return data;
  } catch (e) {
    console.error('[Firebase] Erro ao buscar responsáveis:', e.message);
  }
  return {};
}

// ── ENVIO DE LEMBRETES ────────────────────────────────────────────────────────
async function verificarTodasAsLojas() {
  if (waStatus !== 'connected') {
    console.log('[Cron] WhatsApp não conectado — lembretes ignorados.');
    return;
  }

  const ts = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  console.log(`\n[${ts}] Verificando formulários...`);

  const responsaveis = await getResponsaveis();
  if (!Object.keys(responsaveis).length) {
    console.log('[Cron] Nenhum responsável configurado em meta-loja.html.');
    return;
  }

  for (const [loja, lojaData] of Object.entries(responsaveis)) {
    const setores = lojaData.setores || {};
    if (!Object.keys(setores).length) continue;

    const enviado = await pedidoEnviadoHoje(loja);

    // Agrupa por telefone para não duplicar mensagens
    const porTelefone = {};
    for (const [setorId, cfg] of Object.entries(setores)) {
      if (!cfg.telefone) continue;
      if (!porTelefone[cfg.telefone]) porTelefone[cfg.telefone] = { nome: cfg.nome, setores: [] };
      porTelefone[cfg.telefone].setores.push(SETOR_NOME[setorId] || setorId);
    }

    for (const [telefone, info] of Object.entries(porTelefone)) {
      const hora     = new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
      const setNomes = info.setores.join(', ');

      if (enviado) {
        console.log(`[${hora}] [${loja}/${setNomes}] ✅ Formulário já enviado.`);
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
        console.log(`[${hora}] [${loja}/${setNomes}] 📨 Enviado para ${telefone}`);
      } catch (e) {
        console.error(`[${hora}] [${loja}/${setNomes}] ❌ Erro: ${e.message}`);
      }
    }
  }
}

// ── CRON: toda quarta-feira (dia 3), 16h–23h ──────────────────────────────────
cron.schedule('0 16-23 * * 3', verificarTodasAsLojas, {
  timezone: 'America/Sao_Paulo',
  scheduled: true,
});

// ── INICIALIZAÇÃO ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n🚀 Esphirra\'s — WhatsApp Reminder Server');
  console.log(`   API:  http://localhost:${PORT}/api/status`);
  console.log(`   ERP:  https://esphirras-erp.pages.dev/whatsapp.html`);
  console.log('   Cron: toda quarta-feira, 16h–23h\n');
  client.initialize();
});
