/**
 * dp.js — Módulo Departamento Pessoal
 * Controle Cozinha Central — Esphirra's Delivery
 */

// ── CONFIGURAÇÃO EMAILJS ───────────────────────────────────────────────────────
// 1. Crie conta em https://www.emailjs.com (plano gratuito = 200 emails/mês)
// 2. Adicione um serviço de email (Gmail, Outlook, etc.)
// 3. Crie um template com as variáveis:
//    {{to_name}}, {{to_email}}, {{cargo}}, {{codigo}}, {{link_cadastro}}
// 4. Preencha os três valores abaixo com os dados do seu projeto EmailJS
const DP_EMAILJS = {
  publicKey:  'mddRJdbjWQKHMN8aL',
  serviceId:  'service_e6y8dog',
  templateId: 'template_av3hh7a',
};

const CARGOS_DP = [
  'Atendente', 'Auxiliar de Cozinha', 'Auxiliar de Limpeza', 'Auxiliar Administrativo',
  'Caixa', 'Confeiteiro', 'Cozinheiro', 'Entregador', 'Gerente', 'Pizzaiollo',
  'Salgadeiro', 'Supervisor', 'Outro'
];

const DpPage = {

  render() {
    const funcs    = DB.getFuncionarios();
    const convites = DB.getConvites();
    const ativos   = funcs.filter(f => f.status === 'ativo').length;
    const pendentes = convites.filter(c => c.status === 'pendente').length;
    const ejsOk    = DP_EMAILJS.publicKey !== 'SEU_PUBLIC_KEY';

    return `
      <div style="display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap">
        <div class="stat-card" style="flex:1;min-width:140px">
          <div class="stat-value">${ativos}</div>
          <div class="stat-label">Ativos</div>
        </div>
        <div class="stat-card" style="flex:1;min-width:140px">
          <div class="stat-value">${funcs.length - ativos}</div>
          <div class="stat-label">Inativos</div>
        </div>
        <div class="stat-card" style="flex:1;min-width:140px">
          <div class="stat-value">${pendentes}</div>
          <div class="stat-label">Convites Pendentes</div>
        </div>
        <div class="stat-card" style="flex:1;min-width:140px">
          <div class="stat-value">${funcs.length}</div>
          <div class="stat-label">Total Cadastrados</div>
        </div>
      </div>

      ${!ejsOk ? `
        <div class="alert alert-warning" style="margin-bottom:16px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <span>⚠️ <strong>EmailJS não configurado.</strong> Edite <code>js/dp.js</code> e preencha <code>DP_EMAILJS</code> para enviar convites por email.</span>
          <a href="https://www.emailjs.com" target="_blank" style="color:inherit;font-weight:700;white-space:nowrap">Criar conta →</a>
        </div>
      ` : ''}

      <div class="card" style="margin-bottom:24px">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px">
          <h3 style="margin:0">Funcionários (${funcs.length})</h3>
          <button class="btn btn-primary" onclick="DpPage.abrirConvite()">+ Convidar Funcionário</button>
        </div>
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nome</th>
                <th>Cargo</th>
                <th>CPF</th>
                <th>Telefone</th>
                <th>Status</th>
                <th>Salário</th>
                <th>Admissão</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${funcs.length === 0 ? `
                <tr><td colspan="9" style="text-align:center;color:var(--text-secondary);padding:48px 20px">
                  Nenhum funcionário cadastrado. Clique em <strong>Convidar Funcionário</strong> para começar.
                </td></tr>
              ` : funcs.slice().sort((a,b) => (a.nome||'').localeCompare(b.nome||'', 'pt-BR')).map(f => `
                <tr>
                  <td><code style="font-size:.8rem">${f.codigo || f.id}</code></td>
                  <td>
                    ${f.foto ? `<img src="${f.foto}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;margin-right:8px;vertical-align:middle">` : ''}
                    <strong>${f.nome || '—'}</strong>
                  </td>
                  <td>${f.cargo || '—'}</td>
                  <td>${f.cpf ? _dpMascaraCpf(f.cpf) : '—'}</td>
                  <td>${f.telefone || '—'}</td>
                  <td>
                    <span style="padding:3px 10px;border-radius:12px;font-size:.75rem;font-weight:600;background:${f.status==='ativo'?'rgba(16,185,129,.15)':'rgba(107,114,128,.15)'};color:${f.status==='ativo'?'#10b981':'#6b7280'}">
                      ${f.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>${f.salario ? 'R$ ' + parseFloat(f.salario).toFixed(2).replace('.',',') : '<span style="color:#f87171;font-size:.75rem">⚠ não definido</span>'}</td>
                  <td>${f.admitidoEm ? new Date(f.admitidoEm + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</td>
                  <td style="white-space:nowrap">
                    <button class="btn btn-sm btn-secondary" onclick="DpPage.verFuncionario('${f.id}')">Ver</button>
                    ${f.status === 'ativo'
                      ? `<button class="btn btn-sm" style="margin-left:4px;background:rgba(239,68,68,.15);color:#ef4444;border:1px solid rgba(239,68,68,.3)" onclick="DpPage.inativar('${f.id}')">Inativar</button>`
                      : `<button class="btn btn-sm btn-success" style="margin-left:4px" onclick="DpPage.reativar('${f.id}')">Reativar</button>`}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      ${convites.length > 0 ? `
        <div class="card">
          <div class="card-header" style="padding:16px 20px">
            <h3 style="margin:0">Convites (${convites.length})</h3>
          </div>
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr><th>Nome</th><th>Email</th><th>Cargo</th><th>Status</th><th>Enviado em</th><th></th></tr>
              </thead>
              <tbody>
                ${convites.slice().sort((a,b) => new Date(b.criadoEm) - new Date(a.criadoEm)).map(c => `
                  <tr>
                    <td>${c.nome || '—'}</td>
                    <td>${c.email || '—'}</td>
                    <td>${c.cargo || '—'}</td>
                    <td>
                      <span style="padding:3px 10px;border-radius:12px;font-size:.75rem;font-weight:600;background:${c.status==='pendente'?'rgba(234,179,8,.15)':c.status==='usado'?'rgba(16,185,129,.15)':'rgba(107,114,128,.15)'};color:${c.status==='pendente'?'#eab308':c.status==='usado'?'#10b981':'#6b7280'}">
                        ${c.status === 'pendente' ? 'Pendente' : c.status === 'usado' ? 'Cadastrado' : 'Cancelado'}
                      </span>
                    </td>
                    <td>${c.criadoEm ? new Date(c.criadoEm).toLocaleDateString('pt-BR') : '—'}</td>
                    <td style="white-space:nowrap">
                      ${c.status === 'pendente' ? `
                        <button class="btn btn-sm btn-secondary" onclick="DpPage.copiarLink('${c.token}')">Copiar Link</button>
                        <button class="btn btn-sm" style="margin-left:4px;background:rgba(239,68,68,.15);color:#ef4444;border:1px solid rgba(239,68,68,.3)" onclick="DpPage.cancelarConvite('${c.token}')">Cancelar</button>
                      ` : ''}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}
    `;
  },

  postRender() {
    setTimeout(function() {
      if (!window.emailjs) {
        App.showToast('⚠️ EmailJS não carregou. Convites serão salvos sem envio de email.', 'warning');
      }
    }, 1500);
  },

  abrirConvite() {
    App.openModal('Convidar Funcionário', `
      <div class="form-group">
        <label>Nome completo *</label>
        <input type="text" id="cNome" class="form-control" placeholder="Nome do funcionário" />
      </div>
      <div class="form-group">
        <label>Email *</label>
        <input type="email" id="cEmail" class="form-control" placeholder="email@exemplo.com" />
      </div>
      <div class="form-group">
        <label>Cargo *</label>
        <select id="cCargo" class="form-control">
          <option value="">Selecione...</option>
          ${CARGOS_DP.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Data de admissão</label>
        <input type="date" id="cAdmissao" class="form-control" value="${new Date().toISOString().split('T')[0]}" />
      </div>
    `, [
      { label: 'Cancelar', class: 'btn-secondary', action: 'App.closeModal()' },
      { label: 'Enviar Convite', class: 'btn-primary', action: 'DpPage.enviarConvite()' }
    ]);
  },

  enviarConvite() {
    const nome     = (document.getElementById('cNome').value || '').trim();
    const email    = (document.getElementById('cEmail').value || '').trim();
    const cargo    = document.getElementById('cCargo').value;
    const admissao = document.getElementById('cAdmissao').value;

    if (!nome || !email || !cargo) {
      App.showToast('Preencha nome, email e cargo', 'error');
      return;
    }

    const token  = _dpGerarToken();
    const codigo = _dpGerarCodigo();
    const link   = window.location.origin + '/funcionario.html?t=' + token;

    DB.addConvite({ token, email, nome, cargo, codigo, admitidoEm: admissao, status: 'pendente', criadoEm: new Date().toISOString() });

    const ejsCarregado = !!window.emailjs;
    const ejsConfigurado = DP_EMAILJS.publicKey !== 'SEU_PUBLIC_KEY';
    console.log('[DP] emailjs carregado:', ejsCarregado, '| configurado:', ejsConfigurado);

    if (ejsConfigurado && ejsCarregado) {
      emailjs.send(DP_EMAILJS.serviceId, DP_EMAILJS.templateId, {
        to_name: nome, to_email: email, cargo, codigo, link_cadastro: link
      }, { publicKey: DP_EMAILJS.publicKey })
      .then(function(resp) {
        console.log('[DP] EmailJS sucesso:', resp);
        App.closeModal();
        App.showToast('Convite enviado para ' + email, 'success');
        App.navigateTo('dp');
      })
      .catch(function(err) {
        console.error('[EmailJS] erro:', err);
        const detalhe = err && (err.text || err.message || JSON.stringify(err));
        App.openModal('Erro ao enviar email', `
          <p style="margin-bottom:12px">O convite foi salvo, mas o email não foi enviado. Use <strong>"Copiar Link"</strong> para enviar manualmente.</p>
          <p style="font-size:.8rem;color:var(--text-secondary);margin-bottom:6px">Detalhe do erro:</p>
          <pre style="background:#0d1117;padding:12px;border-radius:8px;font-size:.78rem;color:#f87171;white-space:pre-wrap;word-break:break-all">${detalhe}</pre>
        `, [{ label: 'Fechar', class: 'btn-secondary', action: 'App.closeModal();App.navigateTo("dp")' }]);
      });
    } else {
      const motivo = !ejsCarregado ? 'EmailJS não carregou (verifique sua conexão)' : 'EmailJS não configurado';
      App.openModal('Convite salvo — email não enviado', `
        <p style="margin-bottom:16px">Motivo: <strong>${motivo}</strong></p>
        <p style="margin-bottom:8px;color:var(--text-secondary)">Envie o link abaixo diretamente ao funcionário:</p>
        <input type="text" class="form-control" value="${link}" onclick="this.select()" readonly style="font-size:.78rem;font-family:monospace" />
      `, [
        { label: 'Copiar link', class: 'btn-primary', action: `navigator.clipboard.writeText('${link}').then(()=>App.showToast('Link copiado!','success'))` },
        { label: 'Fechar', class: 'btn-secondary', action: 'App.closeModal();App.navigateTo("dp")' }
      ]);
    }
  },

  copiarLink(token) {
    const link = window.location.origin + '/funcionario.html?t=' + token;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(() => App.showToast('Link copiado!', 'success'));
    } else {
      App.openModal('Link do Cadastro', `
        <p style="margin-bottom:8px;color:var(--text-secondary)">Copie o link abaixo e envie ao funcionário:</p>
        <input type="text" class="form-control" value="${link}" onclick="this.select()" readonly style="font-size:.78rem;font-family:monospace" />
      `, [{ label: 'Fechar', class: 'btn-secondary', action: 'App.closeModal()' }]);
    }
  },

  cancelarConvite(token) {
    if (!confirm('Cancelar este convite?')) return;
    DB.updateConvite(token, { status: 'cancelado' });
    App.showToast('Convite cancelado', 'warning');
    App.navigateTo('dp');
  },

  verFuncionario(id) {
    const f = DB.getFuncionarios().find(x => x.id === id);
    if (!f) return;
    const endereco = [f.logradouro, f.numero, f.complemento, f.bairro].filter(Boolean).join(', ');
    App.openModal('Funcionário: ' + f.nome, `
      <div style="display:flex;gap:20px;flex-wrap:wrap;margin-bottom:16px">
        ${f.foto ? `<div style="flex:0 0 auto"><img src="${f.foto}" style="width:100px;height:100px;border-radius:10px;object-fit:cover;border:2px solid var(--border)"></div>` : ''}
        <div style="flex:1;display:grid;gap:10px;grid-template-columns:1fr 1fr;align-content:start">
          ${_dpCampo('Código', f.codigo || f.id)}
          ${_dpCampo('Cargo', f.cargo)}
          ${_dpCampo('Status', `<span style="color:${f.status==='ativo'?'#10b981':'#6b7280'}">${f.status === 'ativo' ? 'Ativo' : 'Inativo'}</span>`)}
          ${_dpCampo('Email', f.email)}
        </div>
      </div>
      <hr style="margin:0 0 16px;border:none;border-top:1px solid var(--border)">
      <div style="display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">
        ${_dpCampo('CPF', f.cpf ? _dpMascaraCpf(f.cpf) : null)}
        ${_dpCampo('RG', f.rg)}
        ${_dpCampo('Nascimento', f.dataNascimento ? new Date(f.dataNascimento + 'T12:00:00').toLocaleDateString('pt-BR') : null)}
        ${_dpCampo('Telefone', f.telefone)}
        ${_dpCampo('Estado Civil', f.estadoCivil)}
        ${_dpCampo('Admissão', f.admitidoEm ? new Date(f.admitidoEm + 'T12:00:00').toLocaleDateString('pt-BR') : null)}
        ${_dpCampo('Endereço', endereco || null)}
        ${_dpCampo('Cidade / UF', f.cidade && f.estado ? f.cidade + ' / ' + f.estado : null)}
        ${_dpCampo('CEP', f.cep)}
        ${_dpCampo('Banco', f.banco)}
        ${_dpCampo('Chave PIX', f.pix)}
      </div>
      <hr style="margin:16px 0;border:none;border-top:1px solid var(--border)">
      <div style="display:flex;align-items:flex-end;gap:10px;flex-wrap:wrap;margin-bottom:16px">
        <div style="flex:1;min-width:180px;max-width:240px">
          <div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.04em;color:var(--text-secondary);margin-bottom:6px">Salário (R$) <span style="color:#f0a30a">*</span></div>
          <input type="number" id="inputSalario_${f.id}" value="${f.salario || ''}" min="0" step="0.01" placeholder="0,00" class="form-control" />
        </div>
        <button class="btn btn-primary btn-sm" onclick="DpPage.salvarSalario('${f.id}')">Salvar salário</button>
      </div>
      <hr style="margin:0 0 16px;border:none;border-top:1px solid var(--border)">
      <div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.04em;color:var(--text-secondary);margin-bottom:12px">Documentos</div>
      <div style="display:flex;flex-wrap:wrap;gap:10px">
        ${_dpDocBtn(f.foto,           '📷 Selfie')}
        ${_dpDocBtn(f.docResidencia,  '🏠 Comp. Residência')}
        ${_dpDocBtn(f.docAdmissional, '🏥 Exame Admissional')}
        ${_dpDocBtn(f.docCarteira,    '📒 Carteira de Trabalho')}
        ${f.filhosMenores14 ? _dpDocBtn(f.docCertidao, '📋 Certidão de Nascimento') : ''}
      </div>
    `, [
      { label: 'Fechar', class: 'btn-secondary', action: 'App.closeModal()' },
      { label: '📄 Gerar PDF', class: 'btn-primary', action: `DpPage.gerarPdf('${f.id}')` }
    ], 'modal-lg');
  },

  inativar(id) {
    if (!confirm('Inativar este funcionário?')) return;
    DB.updateFuncionario(id, { status: 'inativo' });
    App.showToast('Funcionário inativado', 'warning');
    App.navigateTo('dp');
  },

  reativar(id) {
    DB.updateFuncionario(id, { status: 'ativo' });
    App.showToast('Funcionário reativado', 'success');
    App.navigateTo('dp');
  },

  salvarSalario(id) {
    const val = parseFloat(document.getElementById('inputSalario_' + id).value);
    if (!val || val <= 0) { App.showToast('Informe um salário válido', 'error'); return; }
    DB.updateFuncionario(id, { salario: val });
    App.showToast('Salário salvo com sucesso', 'success');
    App.navigateTo('dp');
    App.closeModal();
  },

  gerarPdf(id) {
    const f = DB.getFuncionarios().find(x => x.id === id);
    if (!f) return;
    if (!f.salario) { App.showToast('Defina o salário antes de gerar o PDF', 'error'); return; }

    const fmt      = v => v || '—';
    const fmtData  = d => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—';
    const fmtReal  = v => v ? 'R$ ' + parseFloat(v).toFixed(2).replace('.', ',') : '—';
    const fmtCpf   = c => c ? c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : '—';
    const endereco = [f.logradouro, f.numero, f.complemento].filter(Boolean).join(', ');

    const docBloco = (label, base64) => {
      if (!base64) return `
        <div class="doc-box" style="opacity:.45">
          <div class="doc-titulo">${label}</div>
          <div style="padding:18px;text-align:center;font-size:8pt;color:#999">Não enviado</div>
        </div>`;
      if (base64.startsWith('data:application/pdf')) return `
        <div class="doc-box">
          <div class="doc-titulo">${label}</div>
          <div style="padding:18px;text-align:center;font-size:8.5pt;color:#b45309;background:#fef9c3">
            📄 Arquivo em PDF<br><span style="font-size:7.5pt;color:#888">Visualize separadamente no sistema</span>
          </div>
        </div>`;
      return `
        <div class="doc-box">
          <div class="doc-titulo">${label}</div>
          <img src="${base64}" style="width:100%;max-height:200px;object-fit:contain;display:block" />
        </div>`;
    };

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>Ficha — ${f.nome}</title>
<style>
  @page { size:A4; margin:18mm 15mm; }
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,sans-serif;font-size:10pt;color:#1a1a1a}
  .topo{display:flex;align-items:center;gap:16px;border-bottom:3px solid #f0a30a;padding-bottom:14px;margin-bottom:20px}
  .topo img{width:80px;height:80px;border-radius:8px;object-fit:cover;border:2px solid #e0e0e0;flex-shrink:0}
  .topo h1{font-size:15pt}
  .topo .sub{color:#555;font-size:9pt;margin-top:3px}
  .badge{display:inline-block;padding:2px 10px;border-radius:20px;font-size:8pt;font-weight:bold;color:#fff}
  .sec{margin-bottom:16px}
  .sec-titulo{font-size:8pt;font-weight:bold;text-transform:uppercase;letter-spacing:.05em;color:#888;border-bottom:1px solid #e0e0e0;padding-bottom:4px;margin-bottom:10px}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:7px 20px}
  .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px 20px}
  .campo label{display:block;font-size:7.5pt;color:#888;margin-bottom:1px}
  .campo span{font-size:10pt;font-weight:500}
  .destaque{background:#fffbeb;border:1px solid #f0a30a;border-radius:6px;padding:8px 14px;display:inline-block;margin-bottom:14px}
  .destaque label{font-size:7.5pt;color:#92400e;font-weight:bold;display:block}
  .destaque span{font-size:13pt;font-weight:700;color:#92400e}
  .docs-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .doc-box{border:1px solid #e0e0e0;border-radius:6px;overflow:hidden}
  .doc-titulo{font-size:8pt;font-weight:bold;padding:5px 8px;background:#f5f5f5;border-bottom:1px solid #e0e0e0}
  .rodape{margin-top:28px;border-top:1px solid #e0e0e0;padding-top:8px;text-align:center;color:#aaa;font-size:8pt}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style>
</head>
<body>

<div class="topo">
  ${f.foto ? `<img src="${f.foto}" />` : ''}
  <div style="flex:1">
    <h1>${f.nome}</h1>
    <div class="sub">${fmt(f.cargo)} &nbsp;•&nbsp; Código: <strong>${f.codigo || f.id}</strong></div>
    <div style="margin-top:6px">
      <span class="badge" style="background:${f.status==='ativo'?'#16a34a':'#6b7280'}">${f.status==='ativo'?'Ativo':'Inativo'}</span>
    </div>
  </div>
  <div style="text-align:right;font-size:8.5pt">
    <div style="color:#888">Gerado em</div>
    <div style="font-weight:bold">${new Date().toLocaleDateString('pt-BR')}</div>
    <div style="color:#888;margin-top:6px">Esphirra's Delivery</div>
  </div>
</div>

<div class="destaque">
  <label>Salário</label>
  <span>${fmtReal(f.salario)}</span>
</div>

<div class="sec">
  <div class="sec-titulo">Dados Pessoais</div>
  <div class="grid3">
    <div class="campo"><label>CPF</label><span>${fmtCpf(f.cpf)}</span></div>
    <div class="campo"><label>RG</label><span>${fmt(f.rg)}</span></div>
    <div class="campo"><label>Nascimento</label><span>${fmtData(f.dataNascimento)}</span></div>
    <div class="campo"><label>Telefone</label><span>${fmt(f.telefone)}</span></div>
    <div class="campo"><label>Email</label><span>${fmt(f.email)}</span></div>
    <div class="campo"><label>Estado Civil</label><span>${fmt(f.estadoCivil)}</span></div>
  </div>
</div>

<div class="sec">
  <div class="sec-titulo">Endereço</div>
  <div class="grid2">
    <div class="campo"><label>Logradouro</label><span>${fmt(endereco)}</span></div>
    <div class="campo"><label>Bairro</label><span>${fmt(f.bairro)}</span></div>
    <div class="campo"><label>Cidade / UF</label><span>${f.cidade && f.estado ? f.cidade+' / '+f.estado : '—'}</span></div>
    <div class="campo"><label>CEP</label><span>${fmt(f.cep)}</span></div>
  </div>
</div>

<div class="sec">
  <div class="sec-titulo">Dados Profissionais e Bancários</div>
  <div class="grid3">
    <div class="campo"><label>Cargo</label><span>${fmt(f.cargo)}</span></div>
    <div class="campo"><label>Admissão</label><span>${fmtData(f.admitidoEm)}</span></div>
    <div class="campo"><label>Filhos &lt; 14 anos</label><span>${f.filhosMenores14 ? 'Sim' : 'Não'}</span></div>
    <div class="campo"><label>Banco</label><span>${fmt(f.banco)}</span></div>
    <div class="campo"><label>Chave PIX</label><span>${fmt(f.pix)}</span></div>
  </div>
</div>

<div class="sec">
  <div class="sec-titulo">Documentos</div>
  <div class="docs-grid">
    ${docBloco('Comprovante de Residência', f.docResidencia)}
    ${docBloco('Exame Admissional', f.docAdmissional)}
    ${docBloco('Carteira de Trabalho', f.docCarteira)}
    ${f.filhosMenores14 ? docBloco('Certidão de Nascimento', f.docCertidao) : ''}
  </div>
</div>

<div class="rodape">Esphirra's Delivery — Cozinha Central &nbsp;•&nbsp; Departamento Pessoal &nbsp;•&nbsp; ${f.codigo || f.id}</div>

<script>window.onload=function(){window.print()}<\/script>
</body></html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
  },

  verDocumento(label, btn) {
    const base64 = btn.dataset.src;
    const isPdf  = base64.startsWith('data:application/pdf');
    if (isPdf) {
      const win = window.open('', '_blank');
      win.document.write(`<html><head><title>${label}</title></head><body style="margin:0">
        <embed src="${base64}" type="application/pdf" width="100%" height="100%" style="position:fixed;inset:0" />
      </body></html>`);
    } else {
      App.openModal(label, `
        <div style="text-align:center">
          <img src="${base64}" style="max-width:100%;max-height:70vh;border-radius:8px;object-fit:contain" />
        </div>
      `, [{ label: 'Fechar', class: 'btn-secondary', action: 'App.closeModal()' }], 'modal-lg');
    }
  }
};

// ── HELPERS ────────────────────────────────────────────────────────────────────

function _dpGerarToken() {
  return 'tk' + Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
}

function _dpGerarCodigo() {
  const funcs = DB.getFuncionarios();
  const convites = DB.getConvites().filter(c => c.status !== 'cancelado');
  const numeros = [...funcs, ...convites].map(x => parseInt((x.codigo || 'FUN000').replace('FUN', '')) || 0);
  const proximo = (numeros.length > 0 ? Math.max(...numeros) + 1 : 1).toString().padStart(3, '0');
  return 'FUN' + proximo;
}

function _dpMascaraCpf(cpf) {
  const c = cpf.replace(/\D/g, '');
  return c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function _dpDocBtn(base64, label) {
  if (!base64) {
    return `<div style="display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:8px;border:1px dashed var(--border);color:var(--text-secondary);font-size:.82rem;opacity:.5">${label} <span style="font-size:.72rem">(não enviado)</span></div>`;
  }
  const isPdf = base64.startsWith('data:application/pdf');
  return `<button class="btn btn-secondary btn-sm" style="gap:6px" onclick="DpPage.verDocumento('${label}', event.currentTarget)"
    data-src="${base64}">
    ${isPdf ? '📄' : '🖼️'} ${label}
  </button>`;
}

function _dpCampo(label, value) {
  return `<div>
    <div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.04em;color:var(--text-secondary);margin-bottom:3px">${label}</div>
    <div style="font-weight:500;font-size:.9rem">${value || '<span style="color:var(--text-secondary)">—</span>'}</div>
  </div>`;
}
