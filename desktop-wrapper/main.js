const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn, fork } = require('child_process');
const path = require('path');
const waitOn = require('wait-on');
const axios = require('axios');
const fs = require('fs');

let mainWindow;
let splashWindow;
let serverProcess;
let ollamaProcess;

const MODEL_NAME = 'qwen2.5:0.5b'; // Fallback to 0.5b if not specified elsewhere

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 500,
    height: 300,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });
  splashWindow.loadFile('splash.html');
}

function updateSplash(status, progress) {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.webContents.send('status-update', status, progress);
  }
}

function createMainWindow(serverPort) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadURL(`http://localhost:${serverPort}`);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function pullModel(ollamaPort) {
  updateSplash(`Đang kéo mô hình AI cục bộ (${MODEL_NAME})...`, 0);
  try {
    const response = await axios.post(`http://127.0.0.1:${ollamaPort}/api/pull`, {
      name: MODEL_NAME,
      stream: true
    }, { responseType: 'stream' });

    return new Promise((resolve, reject) => {
      response.data.on('data', chunk => {
        try {
          const lines = chunk.toString().trim().split('\n');
          for (let line of lines) {
             const data = JSON.parse(line);
             if (data.total && data.completed) {
               const percentage = Math.round((data.completed / data.total) * 100);
               updateSplash(`Đang tải model ${MODEL_NAME}: ${percentage}%`, percentage);
             } else if (data.status) {
               updateSplash(`Trạng thái Ollama: ${data.status}`, null);
             }
          }
        } catch (e) {
          // ignore parsing error for incomplete chunks
        }
      });

      response.data.on('end', () => {
        updateSplash(`Tải model ${MODEL_NAME} thành công!`, 100);
        resolve();
      });

      response.data.on('error', err => reject(err));
    });
  } catch (error) {
    console.error('Lỗi khi tải model:', error.message);
    // Ignore error and proceed in case it's already there or offline
  }
}

async function startOllama() {
  const { default: getPort } = await import('get-port');
  const ollamaPort = await getPort({ port: 11435 }); // Random port if 11435 is taken
  const host = `127.0.0.1:${ollamaPort}`;
  const modelsDir = path.join(app.getPath('userData'), 'ollama_models');
  
  if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
  }

  const isMac = process.platform === 'darwin';
  const binaryName = isMac ? 'ollama' : 'ollama.exe';
  const binDir = app.isPackaged ? path.join(process.resourcesPath, 'bin') : path.join(__dirname, 'bin');
  const binaryPath = path.join(binDir, binaryName);

  if (!fs.existsSync(binaryPath)) {
    console.warn(`Ollama binary not found at ${binaryPath}. Skipping Ollama startup.`);
    return null;
  }

  updateSplash('Đang khởi động tiến trình AI cục bộ...', null);

  ollamaProcess = spawn(binaryPath, ['serve'], {
    env: { 
      ...process.env, 
      OLLAMA_HOST: host,
      OLLAMA_MODELS: modelsDir 
    }
  });

  ollamaProcess.on('error', (err) => {
    console.error('Không thể khởi chạy Ollama:', err);
  });

  // Wait for Ollama to be ready
  await waitOn({ resources: [`tcp:127.0.0.1:${ollamaPort}`] });

  updateSplash('Ollama đã sẵn sàng. Kiểm tra mô hình...', null);
  await pullModel(ollamaPort);

  return host;
}

app.whenReady().then(async () => {
  createSplashWindow();

  // 1. Khởi động Ollama và kéo model
  const ollamaHost = await startOllama();
  
  // 2. Khởi động AnythingLLM Server
  updateSplash('Đang khởi động máy chủ AnythingLLM...', null);
  const serverPort = 3001; // Can also be made dynamic if needed
  const serverDir = app.isPackaged ? path.join(process.resourcesPath, 'server') : path.join(__dirname, '../server');
  const serverPath = path.join(serverDir, 'index.js');
  
  const storageDir = path.join(app.getPath('userData'), 'storage');
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  const bundledDbPath = path.join(serverDir, 'storage', 'anythingllm.db');
  const userDbPath = path.join(storageDir, 'anythingllm.db');
  if (!fs.existsSync(userDbPath) && fs.existsSync(bundledDbPath)) {
    fs.copyFileSync(bundledDbPath, userDbPath);
  }

  if (fs.existsSync(serverPath)) {
    serverProcess = fork(serverPath, {
      cwd: serverDir,
      env: { 
        ...process.env, 
        NODE_ENV: 'production',
        PORT: serverPort,
        LLM_PROVIDER: 'ollama',
        OLLAMA_BASE_PATH: ollamaHost ? `http://${ollamaHost}` : 'http://127.0.0.1:11434',
        OLLAMA_LLM_MODEL: MODEL_NAME,
        STORAGE_DIR: storageDir,
        DATABASE_URL: `file:${path.join(storageDir, 'anythingllm.db')}`
      }
    });

    // 3. Đợi server ready
    await waitOn({ resources: [`tcp:localhost:${serverPort}`] });
  } else {
    updateSplash('Lỗi: Không tìm thấy máy chủ AnythingLLM!', null);
  }

  // 4. Mở cửa sổ chính và đóng Splash
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close();
  }
  
  createMainWindow(serverPort);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (serverProcess) serverProcess.kill();
  if (ollamaProcess) ollamaProcess.kill();
});
