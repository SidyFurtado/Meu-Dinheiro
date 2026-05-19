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

  // ---- Auto-Updater: Windows (electron-updater) ----
  onUpdateAvailable:  (cb) => ipcRenderer.on('update-available',  (_e, version) => cb(version)),
  onUpdateDownloaded: (cb) => ipcRenderer.on('update-downloaded', (_e, version) => cb(version)),
  onUpdateProgress:   (cb) => ipcRenderer.on('update-progress',   (_e, progress) => cb(progress)),
  baixarAtualizacao:  ()  => ipcRenderer.invoke('baixar-atualizacao'),
  instalarAtualizacao: () => ipcRenderer.invoke('instalar-atualizacao'),

  // ---- Auto-Updater: macOS (GitHub API + browser download) ----
  // Recebe { version, url } quando há update disponível no macOS
  onUpdateAvailableMac: (cb) => ipcRenderer.on('update-available-mac', (_e, info) => cb(info)),

  // ---- Google Auth via BrowserWindow controlada ----
  googleOAuth: () => ipcRenderer.invoke('google-oauth'),
});
