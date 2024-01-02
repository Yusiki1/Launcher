const { ipcRenderer, remote } = require('electron');
const { download } = require('electron-dl');
const ProgressBar = require('electron-progressbar');
const { execFile } = require('child_process');
const path = require('path');

document.getElementById('installButton').addEventListener('click', async () => {
  try {
    const progressBar = new ProgressBar({
      indeterminate: false,
      text: 'Téléchargement en cours...',
      detail: '0%',
      browserWindow: {
        parent: remote.getCurrentWindow(),
        modal: true,
        show: true,
      },
    });

    const { state, filePath } = await download(remote.getCurrentWindow(), 'https://mega.nz/file/9vFDHDRL', {
      onProgress: (progress) => {
        progressBar.text = `Téléchargement en cours... ${progress.toFixed(2)}%`;
        progressBar.detail = `Progression : ${progress.toFixed(2)}%`;
        progressBar.value = progress;
        ipcRenderer.send('download-progress', progress);
      },
    });

    if (state === 'completed') {
      progressBar.setCompleted();
      ipcRenderer.send('download-complete', filePath);
    } else {
      throw new Error('Échec du téléchargement.');
    }
  } catch (error) {
    console.error(`Erreur de téléchargement : ${error.message}`);
    ipcRenderer.send('download-error', error.message);
  }
});

ipcRenderer.on('install-error', (event, errorMessage) => {
  console.error(`Erreur d'installation : ${errorMessage}`);
  remote.dialog.showMessageBox({ message: `Erreur d'installation : ${errorMessage}` });
});

ipcRenderer.on('install-complete', (event, installDir) => {
  remote.dialog.showMessageBox({ message: 'Le jeu a été installé avec succès.' });
  ipcRenderer.send('launch-game', installDir); // Envoyez un signal pour lancer le jeu
});

// Gestionnaire d'événements pour lancer le jeu
ipcRenderer.on('launch-game', (event, installDir) => {
  const gameExePath = path.join(installDir, 'Game.exe');
  execFile(gameExePath, (error, stdout, stderr) => {
    if (error) {
      console.error(`Erreur lors du lancement du jeu : ${error.message}`);
      ipcRenderer.send('launch-game-error', error.message);
    } else {
      console.log(`Le jeu a été lancé avec succès : ${stdout}`);
    }
  });
});
