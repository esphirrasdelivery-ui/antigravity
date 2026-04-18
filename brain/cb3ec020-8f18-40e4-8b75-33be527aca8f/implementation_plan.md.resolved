# Plano de Implementação: ERP de Lojas (Esphirra's)

Vamos iniciar este novo projeto do absoluto zero em uma pasta dedicada. Este sistema terá uma interface otimizada para o ritmo das lojas, focando principalmente no Controle de Produção Interno (Fracionamento) e Geração de Etiquetas.

## 1. Estrutura do Novo Projeto
Vou criar uma pasta separada chamada `store-erp`. A base de tecnologia será a mesma (Cloud-First, Vanilla JS/CSS) devido à altíssima velocidade de carregamento, porém com o visual possivelmente adaptado (novas cores) para não confundir os gerentes com o painel da Cozinha Central.

## 2. Hospedagem & Novo Link (Netlify)
Usarei o mesmo `Token` de integração (API) que já temos para **criar um site inteiramente novo** dentro da sua conta Netlify. 
- Um novo link gerado do zero.
- Um script de "build" independente (`build_store.ps1`).

## 3. Banco de Dados Diferente
Para garantir a separação que você solicitou, abordaremos os dados de maneira distinta.

> [!WARNING]
> **Open Question - Banco de Dados:**  
> Para isolar os dados rapidamente sem precisar de configuração extra, recomendo usar o **mesmo projeto do Firebase**, mas sob um **"caminho de pasta de dados" completamente isolado** (Ex: O ERP Cozinha salva tudo em `chef_...` e o Lojas salvará em `lojas_...`).  
> Dessa forma a Cozinha nem enxerga as etiquetas da loja, e a loja nem enxerga estoques da cozinha. Isso facilita para você centralizar financeiramente sua conta no Firebase no futuro.
> **Você aceita dividirmos as "pastas" dentro do mesmo Firebase, ou prefere entrar no site e gerar chaves de um projeto novo do zero para mim?**

## 4. O Sistema "Gerador de Etiquetas"
A primeira funcionalidade que desenvolverei logo após a tela inicial será:
1. **Página de "Cadastros Base":** Para que a loja cadastre (ou puxe) a lista do que ela "bota a validade" (e.g. Massa de Esfiha de hoje = Válida por 3 dias).
2. **Aba de Etiquetas (Print-View):** Painel onde você diz "Fracionei Bacon", ele pega a validade, a data do dia, e formata um molde em matriz (Ex: para folha Pimaco ou para bobina térmica) e imprime.

> [!WARNING]
> **Open Question - Impressora:**
> Que formato de impressora as suas lojas usarão para as etiquetas?
> A) **Impressora Térmica comum de cozinha** (bobininhas amarelinhas ou brancas contínuas).
> B) **Impressora Adesiva comum A4** (folha Pimaco com várias etiquetas por folha).
