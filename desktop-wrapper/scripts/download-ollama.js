const fs = require('fs');
const https = require('https');
const path = require('path');
const { execSync } = require('child_process');

const OLLAMA_VERSION = 'v0.1.48'; // Adjust version if needed
const URLS = {
  mac: `https://github.com/ollama/ollama/releases/download/${OLLAMA_VERSION}/ollama-darwin`,
  win: `https://github.com/ollama/ollama/releases/download/${OLLAMA_VERSION}/ollama-windows-amd64.exe`,
};

const BIN_DIR = path.join(__dirname, '../bin');

if (!fs.existsSync(BIN_DIR)) {
  fs.mkdirSync(BIN_DIR, { recursive: true });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) {
      console.log(`File already exists: ${dest}`);
      return resolve();
    }
    console.log(`Downloading ${url} to ${dest}...`);
    
    // Follow redirects
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
      }

      const file = fs.createWriteStream(dest);
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Finished downloading: ${dest}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  try {
    const isMac = process.platform === 'darwin';
    const isWin = process.platform === 'win32';
    
    // Download only the appropriate binary based on the host platform
    if (isMac) {
      await downloadFile(URLS.mac, path.join(BIN_DIR, 'ollama-darwin'));
      execSync(`chmod +x ${path.join(BIN_DIR, 'ollama-darwin')}`);
    } else if (isWin) {
      // NOTE: For Windows, the URL should be fixed to the zip file and unzipped,
      // but for now we skip Windows download on Mac.
      await downloadFile(URLS.win, path.join(BIN_DIR, 'ollama.exe'));
    }
  } catch (err) {
    console.error('Error downloading Ollama:', err);
    process.exit(1);
  }
}

main();
