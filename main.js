const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

let mainWindow;

// =============================================
// IPC HANDLERS
// =============================================

// Abre link externo no navegador do sistema (com validação de segurança)
ipcMain.handle('abrir-url-externa', async (_event, url) => {
  const permitido = /^https:\/\/github\.com\/SidyFurtado\/Meu-Dinheiro\//.test(url);
  if (permitido) await shell.openExternal(url);
});

// Instalar atualização baixada (Windows via electron-updater)
ipcMain.handle('instalar-atualizacao', () => {
  autoUpdater.quitAndInstall();
});

// Baixar atualização em background (Windows via electron-updater)
ipcMain.handle('baixar-atualizacao', () => {
  autoUpdater.downloadUpdate();
});

// =============================================
// JANELA PRINCIPAL
// =============================================

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
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 18 },
    backgroundColor: '#059669',
    show: false,
  });

  mainWindow.loadFile('app.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// =============================================
// SISTEMA DE ATUALIZAÇÃO AUTOMÁTICA
// =============================================

function configurarAutoUpdater() {
  if (!mainWindow) return;

  // No macOS, o electron-updater NÃO funciona sem assinatura Apple.
  // Usamos verificação manual via GitHub API e abrimos o download no browser.
  if (process.platform === 'darwin') {
    verificarAtualizacaoMac();
    return;
  }

  // ---- WINDOWS: electron-updater funciona com latest.yml no release ----
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info) => {
    if (mainWindow) mainWindow.webContents.send('update-available', info.version);
  });

  autoUpdater.on('update-downloaded', (info) => {
    if (mainWindow) mainWindow.webContents.send('update-downloaded', info.version);
  });

  autoUpdater.on('download-progress', (progress) => {
    if (mainWindow) mainWindow.webContents.send('update-progress', progress);
  });

  autoUpdater.on('error', (err) => {
    console.error('[AutoUpdater] Erro:', err.message);
  });

  autoUpdater.checkForUpdatesAndNotify().catch((err) => {
    console.error('[AutoUpdater] checkForUpdates falhou:', err.message);
  });
}

/**
 * Verificação de atualização para macOS:
 * Consulta a GitHub Releases API, compara versões e notifica o renderer.
 * Quando há update, o renderer abre o link de download no navegador do sistema.
 */
async function verificarAtualizacaoMac() {
  try {
    const https = require('https');
    const currentVersion = app.getVersion();

    const data = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.github.com',
        path: '/repos/SidyFurtado/Meu-Dinheiro/releases/latest',
        headers: {
          'User-Agent': 'MeuDinheiro-App',
          'Accept': 'application/vnd.github.v3+json',
        },
      };
      const req = https.get(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
        });
      });
      req.on('error', reject);
      req.setTimeout(8000, () => { req.destroy(); reject(new Error('Timeout')); });
    });

    const latestVersion = (data.tag_name || '').replace(/^v/, '');
    if (!latestVersion) return;

    // Compara versões semver
    const partes = (v) => v.split('.').map(Number);
    const [aC, bC, cC] = partes(currentVersion);
    const [aL, bL, cL] = partes(latestVersion);
    const temUpdate = aL > aC || (aL === aC && bL > bC) || (aL === aC && bL === bC && cL > cC);

    if (temUpdate && mainWindow) {
      // Encontra o asset .dmg para download
      const assets = data.assets || [];
      const dmg = assets.find(a => a.name.endsWith('.dmg'));
      const urlDownload = dmg ? dmg.browser_download_url : data.html_url;

      mainWindow.webContents.send('update-available-mac', {
        version: latestVersion,
        url: urlDownload,
      });
    }
  } catch (err) {
    console.error('[MacUpdater] Falhou:', err.message);
  }
}

// =============================================
// MENU DO APP
// =============================================

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

// =============================================
// INICIALIZAÇÃO DO APP
// =============================================

app.whenReady().then(() => {
  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
  createWindow();

  // Verificar atualizações após a janela estar pronta
  setTimeout(() => configurarAutoUpdater(), 3000);

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
