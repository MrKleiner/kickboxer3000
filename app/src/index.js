const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
	app.quit();
}

const createWindow = () => {
  // Create the browser window.
	const mainWindow = new BrowserWindow({
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			webviewTag: true,
		},
		width: 1280,
		height: 720,
		minWidth: 400,
		minHeight: 300,
		// frame: false,
		// titleBarOverlay: true,
		icon: path.join(__dirname, 'assets', 'pink_panther.png'),
		// transparent: true,
	});

	// and load the index.html of the app.
	mainWindow.loadFile(path.join(__dirname, 'index.html'));

	// Open the DevTools.
	mainWindow.webContents.openDevTools();

	// pwnt lolololololol
	mainWindow.webContents.session.webRequest.onHeadersReceived(
		{ urls: [ "*://*/*" ] },
		(d, c)=>{
			if(d.responseHeaders['X-Frame-Options']){
				delete d.responseHeaders['X-Frame-Options'];
			} else if(d.responseHeaders['x-frame-options']) {
				delete d.responseHeaders['x-frame-options'];
			}

			c({cancel: false, responseHeaders: d.responseHeaders});
		}
	);

	mainWindow.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
		details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36';
		callback({ cancel: false, requestHeaders: details.requestHeaders });
	});

	globalShortcut.register('CommandOrControl+R', function() {
		mainWindow.reload();
	})

	globalShortcut.register('CommandOrControl+Shift+I', function() {
		mainWindow.webContents.openDevTools();
	})
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

app.on('browser-window-created',function(e,window) {
	window.removeMenu()
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
