# Resumo: Novo ERP Front de Loja 

Como solicitado, criei o novo projeto **totalmente isolado** da Cozinha Central, projetado do zero para facilitar a vida das filiais.

## O Que Foi Desenvolvido

### 1. Novo Link e Plataforma (Arquitetura Independente)
Um novo ambiente de implantação foi criado e integrado na mesma tecnologia do "Pai". As filiais agora têm a casinha delas: 

🌐 **LINK OFICIAL:** [http://esphirras-lojas-erp.netlify.app](http://esphirras-lojas-erp.netlify.app)

### 2. Painel Principal Exclusivo e Visual "Azul"
Para que os gerentes nem se confundam visualmente com a "Cozinha Central", ajustei o layout para ser azulado, e criei as ferramentas centrais que eles vão passar a usar:
- Na aba **Itens e Validades**: Eles podem cadastrar uma lista base (ex: Carne (3 dias), Tomate Picaod (1 dia)). E eles guardam isso para sempre!
- O banco de dados *não* substitui o da Cozinha, ele salva na mesma conta Firebase mas numa gaveta chamada `loja_produtos`. 

### 3. A Maquininha de Imprimir (Etiquetas Zebra)
Fui na aba Etiquetas (a principal). E a mágica acontece lá:
1. Você seleciona *"Carne"*.
2. A data atual é colocada no preenchimento "FAB".
3. **O sistema joga a Validade pra frente automaticamente baseado em quantos dias está no cadastro.** Ele já faz a matemática pra você!
4. Dá pra preencher a "Quantidade" de adesivos.
5. Ao confirmar, ele pisca os olhos pro Navegador avisando `"Sou uma Página de Tamanho 60x30 mm, corta as minhas margens!"`. A tela manda o HTML e CSS rigorosamente desenhado pra que caia perfeito na Zebra (você só precisará garantir que lá no crhome a configuração do papel e margens sema "Nenhuma").

O layout imprime de cara o nome em destaque, as datas lado a lado, e a conservação (Ambiente, Frito, Congelado).
Tudo rodando, no ar, pronto pras lojas acessarem!
