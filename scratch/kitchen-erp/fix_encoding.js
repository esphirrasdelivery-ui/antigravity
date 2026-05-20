const fs = require('fs');
const path = require('path');

const files = [
    'C:/Users/luxan/.gemini/antigravity/scratch/kitchen-erp/js/pedidos.js',
    'C:/Users/luxan/.gemini/antigravity/scratch/kitchen-erp/js/db.js',
    'C:/Users/luxan/.gemini/antigravity/scratch/kitchen-erp/cheferp.html'
];

const hardFixes = [
    [/Inventǭrio/g, 'Inventário'],
    [/vocǦ/g, 'você'],
    [/Qual Ǹ/g, 'Qual é'],
    [/separaǜo/g, 'separação'],
    [/Inclusǜo/g, 'Inclusão'],
    [/Reposiǜo/g, 'Reposição'],
    [/Mǭximo/g, 'Máximo'],
    [/Mǭx/g, 'Máx'],
    [/necessǭrio/g, 'necessário'],
    [/Catǭlogo/g, 'Catálogo'],
    [/indisponvel/g, 'indisponível'],
    [/nǜo/g, 'não'],
    [/ndice/g, 'índice'],
    [/alfabǸtica/g, 'alfabética'],
    [/ediǜo/g, 'edição'],
    [/adiǜo/g, 'adição'],
    [/excludo/g, 'excluído'],
    [/Cdigo/g, 'Código'],
    [/Aes/g, 'Ações'],
    [/Finalizaǜo/g, 'Finalização'],
    [/cdigo/g, 'código'],
    [/balana/g, 'balança'],
    [/comear/g, 'começar'],
    [/\?gua/g, 'Água'],
    [/gǭs/g, 'gás'],
    [/Limǜo/g, 'Limão'],
    [/Sabǜo/g, 'Sabão'],
    [/Galǜo/g, 'Galão'],
    [/mǜos/g, 'mãos'],
    [/ITAPOǟ/g, 'ITAPOÃ'],
    [/Aucar/g, 'Açúcar'],
    [/CafǸ/g, 'Café'],
    [/moda/g, 'moída'],
    [/FilǸ/g, 'Filé'],
    [/Pea/g, 'Peça'],
    [/Requeijǜo/g, 'Requeijão'],
    [/ParmǦsǜo/g, 'Parmesão'],
    [/dinǽmico/g, 'dinâmico'],
    [/Ttulo/g, 'Título'],
    [/Ǹ/g, 'é'],
    [/hǭ/g, 'há'],
    [/jǭ/g, 'já'],
    [/Aes/g, 'Ações'],
    [/Reposiǜo/g, 'Reposição'],
    [/separaǜo/g, 'separação']
];

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    
    hardFixes.forEach(([regex, replacement]) => {
        content = content.replace(regex, replacement);
    });

    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed: ${file}`);
});
