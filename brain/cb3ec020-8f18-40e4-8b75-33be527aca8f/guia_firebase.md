# 🔥 Guia Firebase — 5 minutos

## Passo 1 — Criar projeto
1. Acesse: **https://console.firebase.google.com**
2. Clique em **"Adicionar projeto"**
3. Nome do projeto: **`controle-cozinha-central`**
4. Clique em **Continuar**
5. **Desative** o Google Analytics (toggle para desligar)
6. Clique em **"Criar projeto"** e aguarde ~30 segundos
7. Clique em **Continuar**

---

## Passo 2 — Criar banco de dados
1. No menu esquerdo: clique em **"Criação" → "Realtime Database"**
2. Clique em **"Criar banco de dados"**
3. Local: deixe o padrão (EUA) e clique **Próxima**
4. Marque **"Iniciar no modo de teste"**
5. Clique em **"Ativar"**
6. ✅ Você verá uma URL assim: `https://controle-cozinha-central-default-rtdb.firebaseio.com/`
7. **COPIE ESSA URL** — é o valor 1 que preciso

---

## Passo 3 — Registrar o app web
1. Clique no ícone ⚙️ ao lado de **"Visão geral do projeto"**
2. Clique em **"Configurações do projeto"**
3. Role para baixo até **"Seus aplicativos"**
4. Clique no ícone **`</>`** (Web)
5. Apelido: **`controle-cozinha-web`**
6. Clique em **"Registrar app"**
7. Você verá um bloco de código como este:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",          ← valor 2 (apiKey)
  authDomain: "...",
  databaseURL: "https://...",   ← valor 1 (mesmo de cima)
  projectId: "controle-...",    ← valor 3 (projectId)
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

8. **COPIE O BLOCO INTEIRO** e cole aqui no chat

---

> Me mande o bloco `firebaseConfig` completo e eu faço o resto!
