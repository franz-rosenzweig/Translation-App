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

// OpenAI API handler - uses OpenAI directly with full feature support
async function handleTranslationProcessing(event, payload) {
  try {
    // Get API key from storage or environment
    const apiKey = await getStoredApiKey() || process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('No OpenAI API key configured. Please add your API key in Settings.');
    }

    // Import OpenAI and other dependencies
    const { default: OpenAI } = await import('openai');
    
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // Use the model from payload or default
    const model = payload.model || process.env.OPENAI_MODEL || "gpt-4o-mini";

    // Build the system prompt
    let systemPrompt = "You are a professional translator. ";
    
    if (payload.sourceLanguage === 'hebrew' && payload.targetLanguage === 'english') {
      systemPrompt += "Translate the Hebrew text to clear, natural English. ";
    } else if (payload.sourceLanguage === 'english' && payload.targetLanguage === 'hebrew') {
      systemPrompt += "Translate the English text to clear, natural Hebrew. ";
    } else {
      systemPrompt += `Translate from ${payload.sourceLanguage} to ${payload.targetLanguage}. `;
    }

    systemPrompt += "Provide your response as JSON with 'edited_text' field containing the translation, and optional 'change_log', 'terms_glossary_hits', and 'flags' arrays.";

    // Add audience version instructions if requested
    if (payload.mode && payload.mode.startsWith('audience')) {
      systemPrompt += " When audience mode is requested, also include an 'audience_version' object with 'text' and optional 'rationale' fields for a version optimized for the intended audience based on guidelines and reference material.";
    }

    // Add guidelines if provided
    if (payload.guidelines) {
      systemPrompt += `\n\nTranslation Guidelines:\n${payload.guidelines}`;
    }

    // Add reference material if provided
    if (payload.referenceMaterial) {
      systemPrompt += `\n\nReference Material:\n${payload.referenceMaterial}`;
    }

    // Build user prompt
    let userPrompt = "";
    if (payload.hebrew) {
      userPrompt += `Hebrew text: ${payload.hebrew}\n`;
    }
    if (payload.roughEnglish) {
      userPrompt += `Rough English: ${payload.roughEnglish}\n`;
    }

    // Add style instructions
    if (payload.knobs) {
      userPrompt += `\nStyle preferences (1-10 scale):
- Cultural Localization: ${payload.knobs.localization || payload.knobs.americanization || 5}
- Structure strictness: ${payload.knobs.structureStrictness || 5}
- Tone strictness: ${payload.knobs.toneStrictness || 5}
- Jargon tolerance: ${payload.knobs.jargonTolerance || 5}`;
    }

    // Add custom prompt override with higher priority
    if (payload.promptOverride) {
      userPrompt += `\n\n=== HIGHEST-PRIORITY OVERRIDE DIRECTIVES ===\n${payload.promptOverride}\nIMPORTANT: If any earlier instruction conflicts with these override directives, follow THE OVERRIDE.\n=== END OVERRIDE ===`;
    }

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from OpenAI");

    const result = JSON.parse(content);
    
    // Ensure the response has the expected format that matches the web API
    return {
      edited_text: result.translatedText || result.edited_text || result.translation || content,
      change_log: result.change_log || [],
      terms_glossary_hits: result.terms_glossary_hits || [],
      flags: result.flags || [],
      audience_version: result.audience_version || undefined
    };

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
    minWidth: 400,
    minHeight: 500,
    icon: path.join(__dirname, 'assets/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: !isDev,
      preload: path.join(__dirname, 'preload.js') // We'll create this
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 20, y: 20 },
    // Enable dragging for the entire window content
    movable: true
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
