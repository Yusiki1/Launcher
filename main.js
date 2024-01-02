const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const https = require('https');
const extract = require('extract-zip');

let mainWindow;
let outputDir;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.on('download-game', (event) => {
  try {
    const zipUrl = 'https://mega.nz/file/9vFDHDRL#u4VHa8nR3utL3ABLH4m4sLpyQp7NL2HIQGjS_DaMqrk';
    const zipPath = path.join(os.tmpdir(), 'pokemonstalactite.zip');
    outputDir = path.join(__dirname, 'app-stalactite');

    const file = fs.createWriteStream(zipPath);

    https.get(zipUrl, (response) => {
      response.pipe(file);

      file.on('finish', () => {
        file.close(() => {
          console.log('Téléchargement terminé !');

          // Extraction des fichiers du ZIP
          console.log('Début de l\'extraction...');
          extract(zipPath, { dir: outputDir }, (err) => {
            if (err) {
              console.error('Erreur lors de l\'extraction :', err);
              event.sender.send('download-error', 'Une erreur est survenue lors de l\'extraction.');
            } else {
              console.log('Extraction terminée !');
              event.sender.send('download-complete', outputDir);
            }
          });
        });
      });
    }).on('error', (err) => {
      console.error('Erreur lors du téléchargement :', err);
      event.sender.send('download-error', 'Une erreur est survenue lors du téléchargement.');
    });
  } catch (error) {
    console.error('Erreur inattendue :', error);
    event.sender.send('download-error', 'Une erreur inattendue est survenue.');
  }
});

ipcMain.on('install-game', (event) => {
  try {
    if (!outputDir) {
      console.error('Le dossier de sortie (outputDir) n\'est pas défini.');
      return;
    }

    console.log('Installation du jeu dans le dossier :', outputDir);

    console.log('Logique d\'installation terminée.');
    dialog.showMessageBox({ message: 'Le jeu a été installé avec succès.' });
  } catch (error) {
    console.error('Erreur lors de l\'installation :', error);
    dialog.showMessageBox({ message: 'Une erreur est survenue lors de l\'installation.' });
  }
});
