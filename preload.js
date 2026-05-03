// Preload script — executa antes da página web carregar
// Expõe APIs seguras ao renderer process via contextBridge
const { contextBridge, ipcRenderer } = require('electron');

// Lê a versão atual do package.json de forma segura
let appVersion = '0.0.0';
try {
  appVersion = require('./package.json').version;
} catch (e) { /* ignora se não encontrar */ }

contextBridge.exposeInMainWorld('electronAPI', {
  // Informações da plataforma e do app
  platform:   process.platform,
  isElectron: true,
  version:    appVersion,

  // Abre link de download no navegador do sistema de forma segura
  abrirDownload: (url) => ipcRenderer.invoke('abrir-url-externa', url),

  // Auto-Updater (in-app seamless)
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (_event, version) => callback(version)),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', (_event, version) => callback(version)),
  baixarAtualizacao: () => ipcRenderer.invoke('baixar-atualizacao'),
  instalarAtualizacao: () => ipcRenderer.invoke('instalar-atualizacao'),
});
