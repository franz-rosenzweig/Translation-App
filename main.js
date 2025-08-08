import { app, BrowserWindow, Menu, shell, dialog, ipcMain, safeStorage } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV === 'development';

// API Key storage helpers
const getApiKeyPath = () => {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'api-key.dat');
};

let cachedApiKey = null;

async function getStoredApiKey() {
  if (cachedApiKey) return cachedApiKey;
  
  try {
    const keyPath = getApiKeyPath();
    if (!fs.existsSync(keyPath)) return null;
    
    const encryptedData = fs.readFileSync(keyPath);
    if (safeStorage.isEncryptionAvailable()) {
      cachedApiKey = safeStorage.decryptString(encryptedData);
    } else {
      // Fallback for systems without encryption
      cachedApiKey = encryptedData.toString();
    }
    return cachedApiKey;
  } catch (error) {
    console.error('Failed to read API key:', error);
    return null;
  }
}

async function saveApiKey(apiKey) {
  try {
    const keyPath = getApiKeyPath();
    let dataToStore;
    
    if (safeStorage.isEncryptionAvailable()) {
      dataToStore = safeStorage.encryptString(apiKey);
    } else {
      // Fallback for systems without encryption
      dataToStore = Buffer.from(apiKey);
    }
    
    fs.writeFileSync(keyPath, dataToStore);
    cachedApiKey = apiKey;
    return true;
  } catch (error) {
    console.error('Failed to save API key:', error);
    throw error;
  }
}

async function removeApiKey() {
  try {
    const keyPath = getApiKeyPath();
    if (fs.existsSync(keyPath)) {
      fs.unlinkSync(keyPath);
    }
    cachedApiKey = null;
    return true;
  } catch (error) {
    console.error('Failed to remove API key:', error);
    throw error;
  }
}

async function testApiKey(apiKey) {
  try {
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey });
    
    // Test with a simple completion
    await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Test" }],
      max_tokens: 1
    });
    
    return true;
  } catch (error) {
    console.error('API key test failed:', error);
    return false;
  }
}

// OpenAI API handler - now uses the full API route logic
async function handleTranslationProcessing(event, payload) {
  try {
    // Get API key from storage or environment
    const apiKey = await getStoredApiKey() || process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('No OpenAI API key configured. Please add your API key in Settings.');
    }

    // Set the API key for the process
    process.env.OPENAI_API_KEY = apiKey;

    // Import and use the actual API route logic
    const { POST } = await import('./app/api/process/route.js');
    
    // Create a mock request object
    const mockRequest = {
      json: async () => payload
    };

    // Call the actual API route
    const response = await POST(mockRequest);
    const result = await response.json();

    if (response.status !== 200) {
      throw new Error(result.error || `API Error: ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, 'assets/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: !isDev,
      preload: path.join(__dirname, 'preload.js') // We'll create this
    },
    titleBarStyle: 'hiddenInset', // macOS style
    trafficLightPosition: { x: 20, y: 20 }
  });

  // Load the app
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, 'out/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Setup menu
  setupMenu();
}

function setupMenu() {
  const template = [
    {
      label: 'Translation Chat',
      submenu: [
        {
          label: 'About Translation Chat',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Translation Chat',
              message: 'Translation Chat',
              detail: 'Professional Hebrew-English AI Translation Editor with Style Awareness\nVersion 1.0.0'
            });
          }
        },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'New Translation',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-translation');
          }
        },
        { type: 'separator' },
        {
          label: 'Import Document',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile'],
              filters: [
                { name: 'Text Files', extensions: ['txt', 'md'] },
                { name: 'All Files', extensions: ['*'] }
              ]
            });
            
            if (!result.canceled) {
              mainWindow.webContents.send('menu-import-file', result.filePaths[0]);
            }
          }
        },
        {
          label: 'Export Translation',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu-export-translation');
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectall' },
        { type: 'separator' },
        {
          label: 'Prompt Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow.webContents.send('menu-open-settings');
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Learn More',
          click: () => {
            shell.openExternal('https://github.com/franz-rosenzweig/Translation-App');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App event handlers
app.whenReady().then(() => {
  createWindow();
  
  // Register IPC handlers
  ipcMain.handle('process-translation', handleTranslationProcessing);
  
  // API Key management handlers
  ipcMain.handle('api-key:get', async () => {
    return await getStoredApiKey();
  });
  
  ipcMain.handle('api-key:save', async (event, apiKey) => {
    return await saveApiKey(apiKey);
  });
  
  ipcMain.handle('api-key:test', async (event, apiKey) => {
    return await testApiKey(apiKey);
  });
  
  ipcMain.handle('api-key:remove', async () => {
    return await removeApiKey();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Security: Prevent navigation to external websites
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (navigationEvent, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== 'http://localhost:3000' && parsedUrl.origin !== 'file://') {
      navigationEvent.preventDefault();
    }
  });
});
