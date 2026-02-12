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

## 📱 Como Conectar Outros Dispositivos

1. Peça aos outros usuários para conectarem ao seu **Wi-Fi (Hotspot)**.
2. No navegador do celular deles, acessem o endereço exibido (ex: `http://192.168.43.1:3000`).
3. **Permita as notificações** quando o navegador solicitar.
4. Escolha um nome e comece a conversar!
