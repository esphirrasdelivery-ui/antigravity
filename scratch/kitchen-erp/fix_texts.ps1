$files = @(
    "C:\Users\luxan\.gemini\antigravity\scratch\kitchen-erp\pedido.html",
    "C:\Users\luxan\.gemini\antigravity\scratch\kitchen-erp\js\pedidos.js",
    "C:\Users\luxan\.gemini\antigravity\scratch\kitchen-erp\js\db.js",
    "C:\Users\luxan\.gemini\antigravity\scratch\kitchen-erp\meta-loja.html"
)

$replacements = @{
    "ǭ" = "á";
    "ǟ" = "ã";
    "Ǹ" = "é";
    "Ǧ" = "ê";
    "ǜ" = "õ";
    "" = "ç";
    "" = "í";
    "" = "ó";
    "" = "ú";
    "ǟ" = "ã";
    "?" = "Á";
    "?" = "É";
    "?" = "Í";
    "?" = "Ó";
    "?" = "Ú";
    "ǜ" = "ção";
    "ǜ" = "ção";
    "ǜ" = "ção";
    "" = "í";
    "" = "í";
    "ǟ" = "ã";
    "ǭ" = "á";
    "Ǹ" = "é";
    "Ǧ" = "ê";
    "ǜ" = "õ";
    "" = "ç";
}

# Melhores substituições baseadas no padrão visto no terminal
function Fix-Content($path) {
    if (!(Test-Path $path)) { return }
    $content = [IO.File]::ReadAllText($path, [Text.Encoding]::UTF8)
    
    # Lista de correções manuais de padrões comuns corrompidos
    $content = $content -replace "Inventǭrio", "Inventário"
    $content = $content -replace "vocǦ", "você"
    $content = $content -replace "Qual Ǹ", "Qual é"
    $content = $content -replace "separaǜo", "separação"
    $content = $content -replace "Aes", "Ações"
    $content = $content -replace "Inclusǜo", "Inclusão"
    $content = $content -replace "Reposiǜo", "Reposição"
    $content = $content -replace "Mǭximo", "Máximo"
    $content = $content -replace "Mǭx", "Máx"
    $content = $content -replace "necessǭrio", "necessário"
    $content = $content -replace "Catǭlogo", "Catálogo"
    $content = $content -replace "especfica", "específica"
    $content = $content -replace "indisponvel", "indisponível"
    $content = $content -replace "nǜo", "não"
    $content = $content -replace "PrǸ", "Pré"
    $content = $content -replace "ndice", "índice"
    $content = $content -replace "alfabǸtica", "alfabética"
    $content = $content -replace "adiǜo", "adição"
    $content = $content -replace "ediǜo", "edição"
    $content = $content -replace "edies", "edições"
    $content = $content -replace "excludo", "excluído"
    $content = $content -replace "L\"GICA", "LÓGICA"
    $content = $content -replace "C?LCULO", "CÁLCULO"
    $content = $content -replace "INIMPRESSǟO", "IMPRESSÃO"
    $content = $content -replace "hǭ", "há"
    $content = $content -replace "jǭ", "já"
    $content = $content -replace "atǸ", "até"
    $content = $content -replace "comear", "começar"
    $content = $content -replace "cdigo", "código"
    $content = $content -replace "balana", "balança"
    $content = $content -replace " esquerda", "à esquerda"
    $content = $content -replace "Sada", "Saída"
    $content = $content -replace "ConferǦncia", "Conferência"
    $content = $content -replace "mediǜo", "medição"
    $content = $content -replace "DESCRIǟO", "DESCRIÇÃO"
    $content = $content -replace "INFORMAǟO", "INFORMAÇÃO"
    $content = $content -replace "?", " "
    $content = $content -replace "?", "Á"
    $content = $content -replace "?", "í"
    $content = $content -replace "ITAPOǟ", "ITAPOÃ"
    $content = $content -replace "Aucar", "Açúcar"
    $content = $content -replace "CafǸ", "Café"
    $content = $content -replace "moda", "moída"
    $content = $content -replace "FilǸ", "Filé"
    $content = $content -replace ""leo", "Óleo"
    $content = $content -replace "Paoca", "Paçoca"
    $content = $content -replace "Pea", "Peça"
    $content = $content -replace "Requeijǜo", "Requeijão"
    $content = $content -replace "ParmǦsǜo", "Parmeseão" # wait, Parmesão
    $content = $content -replace "Parmeseão", "Parmesão"
    $content = $content -replace "Galǜo", "Galão"
    $content = $content -replace "Sabǜo", "Sabão"
    $content = $content -replace "Configuraǜo", "Configuração"
    $content = $content -replace "dinǽmico", "dinâmico"
    $content = $content -replace "Ttulo", "Título"
    $content = $content -replace "alfabǸticamente", "alfabeticamente"
    $content = $content -replace "FORAR", "FORÇAR"
    $content = $content -replace "Finalizaǜo", "Finalização"
    $content = $content -replace "Dgito", "Dígito"
    $content = $content -replace "Padrǜo", "Padrão"
    $content = $content -replace "Lanamento", "Lançamento"

    [IO.File]::WriteAllText($path, $content, [Text.Encoding]::UTF8)
    Write-Host "Arquivo reparado: $path"
}

foreach ($f in $files) {
    Fix-Content $f
}
