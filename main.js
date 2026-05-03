const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

let mainWindow;

// --- IPC: Abrir link de download no navegador do sistema ---
ipcMain.handle('abrir-url-externa', async (_event, url) => {
  // Validação de segurança: só permite URLs de GitHub Releases
  const permitido = /^https:\/\/github\.com\/SidyFurtado\/Meu-Dinheiro\/releases\//.test(url);
  if (permitido) await shell.openExternal(url);
});

// --- IPC: Instalar Atualização Baixada ---
ipcMain.handle('instalar-atualizacao', () => {
  autoUpdater.quitAndInstall();
});

// --- IPC: Baixar Atualização ---
ipcMain.handle('baixar-atualizacao', () => {
  autoUpdater.downloadUpdate();
});
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 400,
    minHeight: 600,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'hiddenInset', // Estilo nativo no macOS
    trafficLightPosition: { x: 15, y: 18 },
    backgroundColor: '#059669', // emerald-600 (cor do header)
    show: false, // Mostrar apenas quando estiver pronto
  });

  mainWindow.loadFile('app.html');

  // Mostra a janela quando o conteúdo estiver carregado (evita flash branco)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Configuração do autoUpdater
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('update-available', info.version);
  });

  autoUpdater.on('update-downloaded', (info) => {
    mainWindow.webContents.send('update-downloaded', info.version);
  });

  autoUpdater.on('error', (err) => {
    // Ignora erros de assinatura no Mac para não travar
    console.log('Erro de atualização:', err);
  });
}

// --- Menu do App ---
const menuTemplate = [
  ...(process.platform === 'darwin'
    ? [{
        label: 'Meu Dinheiro',
        submenu: [
          { role: 'about', label: 'Sobre Meu Dinheiro' },
          { type: 'separator' },
          { role: 'hide', label: 'Ocultar' },
          { role: 'hideOthers', label: 'Ocultar Outros' },
          { role: 'unhide', label: 'Mostrar Tudo' },
          { type: 'separator' },
          { role: 'quit', label: 'Sair do Meu Dinheiro' },
        ],
      }]
    : []),
  {
    label: 'Editar',
    submenu: [
      { role: 'undo', label: 'Desfazer' },
      { role: 'redo', label: 'Refazer' },
      { type: 'separator' },
      { role: 'cut', label: 'Recortar' },
      { role: 'copy', label: 'Copiar' },
      { role: 'paste', label: 'Colar' },
      { role: 'selectAll', label: 'Selecionar Tudo' },
    ],
  },
  {
    label: 'Visualizar',
    submenu: [
      { role: 'reload', label: 'Recarregar' },
      { role: 'forceReload', label: 'Forçar Recarregamento' },
      { type: 'separator' },
      { role: 'resetZoom', label: 'Zoom Padrão' },
      { role: 'zoomIn', label: 'Aumentar Zoom' },
      { role: 'zoomOut', label: 'Diminuir Zoom' },
      { type: 'separator' },
      { role: 'togglefullscreen', label: 'Tela Cheia' },
    ],
  },
  {
    label: 'Janela',
    submenu: [
      { role: 'minimize', label: 'Minimizar' },
      { role: 'zoom', label: 'Zoom' },
      ...(process.platform === 'darwin'
        ? [
            { type: 'separator' },
            { role: 'front', label: 'Trazer para Frente' },
          ]
        : [{ role: 'close', label: 'Fechar' }]),
    ],
  },
];

app.whenReady().then(() => {
  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
  createWindow();

  // Inicia a verificação de updates pelo electron-updater
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify().catch(console.error);
  }, 3000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
