# Chat Local via Hotspot 📱💬

Sistema de chat em tempo real projetado para funcionar **100% offline** através de um hotspot de celular. Ideal para situações de emergência, eventos em locais sem sinal ou redes locais isoladas.

## 🚀 Como Funciona
O sistema consiste em um servidor Node.js (rodando no celular principal via Termux) e uma interface web React acessível por qualquer dispositivo conectado ao mesmo Wi-Fi (hotspot).

---

## 🛠️ Instalação no Android (via Termux)

### 1. Instalar Termux
- Baixe o Termux preferencialmente pelo [F-Droid](https://f-droid.org/en/packages/com.termux/) (a versão da Play Store está desatualizada).
- Abra o Termux e conceda as permissões necessárias.
- Execute os comandos iniciais:
  ```bash
  pkg update && pkg upgrade
  ```

### 2. Instalar Node.js
No Termux, instale o Node.js:
```bash
pkg install nodejs
```

### 3. Configurar o Projeto
- Baixe ou clone os arquivos do projeto para o celular.
- Navegue até a pasta do servidor e instale as dependências:
  ```bash
  cd server
  npm install
  ```
- No seu computador (ou no Termux se preferir buildar lá), build o frontend:
  ```bash
  cd client
  npm install
  npm run build
  ```
- Certifique-se de que a pasta `client/dist` existe e contém o build do React.

---

## 📡 Configuração da Rede (Hotspot)

1. Vá nas **Configurações** do seu Android.
2. Ative o **Roteador Wi-Fi (Hotspot)**.
3. Defina um nome e senha simples (ex: `ChatLocal` / `12345678`).
4. Verifique o IP do hotspot (geralmente é `192.168.43.1` no Android).

---

## 🏁 Iniciar o Servidor

Dentro do Termux, na pasta `server`:
```bash
node server.js
```
O console mostrará o IP e porta para acesso.

> **Dica:** Para evitar que o Android encerre o servidor, use o comando `termux-wake-lock` no Termux.

---

## 📻 Funcionalidade de Rádio (Walkie-Talkie)

O sistema agora inclui um modo **Push-to-Talk (PTT)** integrado:

- **Como usar:** Segure o botão circular grande no centro da tela para transmitir sua voz. Solte para parar.
- **Canal Único:** Apenas uma pessoa pode falar por vez. Se o botão estiver amarelo, o canal está ocupado.
- **Feedback Visual:** 
  - 🟢 **Verde:** Você está transmitindo.
  - 🔴 **Vermelho:** Alguém está falando e você está ouvindo.
  - 🟡 **Amarelo:** Canal ocupado.
- **Permissões:** Você **DEVE** permitir o acesso ao microfone no navegador para usar esta função.
- **Latência:** O áudio é transmitido em chunks de 100ms para garantir baixa latência (quase instantâneo).

---

## 📱 Como Conectar Outros Dispositivos

1. Peça aos outros usuários para conectarem ao seu **Wi-Fi (Hotspot)**.
2. No navegador do celular deles, acessem o endereço exibido (ex: `https://192.168.43.1:3000`).
3. **⚠️ IMPORTANTE (HTTPS):** Para que as notificações e o **microfone** funcionem, o navegador exige uma conexão segura. 
   - Como usamos certificados auto-assinados, o navegador mostrará um aviso de "Conexão não é privada".
   - Clique em **"Avançado"** e depois em **"Prosseguir para [IP] (não seguro)"**.
4. Permita as notificações e o microfone quando solicitado.
5. Escolha um nome e comece a conversar!

---

## 🛠️ Solução de Problemas (Troubleshooting)

- **Microfone não funciona:** Verifique se acessou via `https://` e se deu permissão no cadeado do navegador.
- **Áudio cortando:** Certifique-se de que os aparelhos não estão muito longe do Hotspot.
- **Notificação não aparece:** Alguns navegadores (como Brave) exigem uma interação inicial com a página antes de permitirem sons ou notificações. Clique em qualquer lugar da tela primeiro.

