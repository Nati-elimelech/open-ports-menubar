import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, clipboard, shell, screen, Notification, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Store from 'electron-store';
import electronUpdater from 'electron-updater';
const { autoUpdater } = electronUpdater;
import { scanListeningPorts, scanDockerPublishedPorts, killPid, termPid } from './services/ports.js';
import { isSystemProcess } from './services/config.js';
import { getServiceIconImage, clearIconCache } from './services/iconRegistry.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isMac = process.platform === 'darwin';

// Safe logging function that won't crash on EPIPE errors
function safeLog(...args) {
  try {
    console.log(...args);
  } catch (e) {
    // Silently ignore logging errors
  }
}

const store = new Store({
  defaults: {
    ignoreRules: [],  // strings or regex (e.g. '^(:?3000|5173)$' or 'com.apple.')
    refreshIntervalMs: 2500,
    windowBounds: { width: 520, height: 560 },
    launchAtLogin: false,
    showDockerPorts: true,
    showSystemPorts: true,  // Show system processes in separate section
    showServiceIcons: false,  // Show icons for known services
    refreshInterval: 2.5
  }
});

let refreshInterval;
let updateAvailable = null;
let updateDownloaded = false;
let lastUpdateCheck = new Date(); // Initialize with current time on startup

/** @type {BrowserWindow | null} */
let preferencesWindow = null;
/** @type {Tray | null} */
let tray = null;

// Configure auto-updater
function setupAutoUpdater() {
  const startTime = Date.now();
  
  // Set the feed URL for GitHub releases
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'Nati-elimelech',
    repo: 'open-ports-menubar'
  });
  
  // Disable auto-download so user can choose when to download
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  
  // Check for updates (but don't download automatically)
  autoUpdater.on('checking-for-update', () => {
    safeLog('⏱️  [AI-PERF] Checking for updates...');
    lastUpdateCheck = new Date();
  });
  
  autoUpdater.on('update-available', (info) => {
    safeLog(`⏱️  [AI-PERF] Update available: ${info.version}`);
    updateAvailable = {
      version: info.version,
      releaseNotes: info.releaseNotes,
      releaseName: info.releaseName
    };
    
    // Show system notification for update
    const notification = new Notification({
      title: 'Update Available',
      body: `Open Ports Menubar v${info.version} is available. Click About menu to download.`,
      silent: false
    });
    notification.show();
    
    updateTrayMenu();
  });
  
  autoUpdater.on('update-not-available', () => {
    safeLog('⏱️  [AI-PERF] App is up to date');
    updateAvailable = null;
    updateTrayMenu();
  });
  
  autoUpdater.on('download-progress', (progressObj) => {
    const percent = Math.round(progressObj.percent);
    safeLog(`⏱️  [AI-PERF] Download progress: ${percent}%`);
    if (tray) {
      tray.setTitle(`↓ ${percent}%`); // Show progress in menu bar
    }
  });
  
  autoUpdater.on('update-downloaded', () => {
    safeLog('⏱️  [AI-PERF] Update downloaded, ready to install');
    updateDownloaded = true;
    if (tray) {
      tray.setTitle(''); // Clear progress
    }
    updateTrayMenu();
  });
  
  autoUpdater.on('error', (err) => {
    safeLog(`⏱️  [AI-PERF] Auto-updater error: ${err.message}`);
    if (tray) {
      tray.setTitle(''); // Clear any progress on error
    }
  });
  
  safeLog(`⏱️  [AI-PERF] Auto-updater setup took: ${Date.now() - startTime}ms`);
}

function checkForUpdates() {
  const startTime = Date.now();
  autoUpdater.checkForUpdates()
    .then(() => {
      safeLog(`⏱️  [AI-PERF] Update check completed took: ${Date.now() - startTime}ms`);
    })
    .catch(err => {
      safeLog(`⏱️  [AI-PERF] Update check failed after ${Date.now() - startTime}ms: ${err.message}`);
    });
}

function openPreferences() {
  if (preferencesWindow && !preferencesWindow.isDestroyed()) {
    preferencesWindow.focus();
    return;
  }
  
  preferencesWindow = new BrowserWindow({
    width: 600,
    height: 500,
    show: true,
    frame: true,
    resizable: false,
    title: 'Preferences',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  
  preferencesWindow.loadFile(path.join(__dirname, 'preferences.html'));
  
  preferencesWindow.on('closed', () => {
    preferencesWindow = null;
  });
}

let currentPorts = [];

async function updatePorts() {
  safeLog('⏱️  [AI-PERF] Updating ports list...');
  const startTime = Date.now();
  const [hostPorts, dockerPorts] = await Promise.all([
    scanListeningPorts(),
    scanDockerPublishedPorts()
  ]);
  safeLog(`⏱️  [AI-PERF] Port scan completed in ${Date.now() - startTime}ms. Found ${hostPorts.length} host ports and ${dockerPorts.length} docker ports`);
  
  const ignoreRules = store.get('ignoreRules');
  function matchIgnore(item) {
    const needle = `${item.port}`;
    for (const rule of ignoreRules) {
      if (!rule) continue;
      try {
        if (rule.startsWith('/') && rule.endsWith('/')) {
          const re = new RegExp(rule.slice(1, -1));
          if (re.test(needle) || re.test(item.command) || re.test(item.name || '')) return true;
        } else if (rule.startsWith('^') || rule.endsWith('$') || rule.includes('.*')) {
          const re = new RegExp(rule);
          if (re.test(needle) || re.test(item.command) || re.test(item.name || '')) return true;
        } else if (rule === needle || rule === item.command || rule === (item.name || '')) {
          return true;
        }
      } catch {}
    }
    return false;
  }
  
  // Apply filters based on user preferences
  let filteredHostPorts = hostPorts.filter(p => !matchIgnore(p));
  let filteredDockerPorts = dockerPorts.filter(p => !matchIgnore(p));
  
  // Filter out system processes if showSystemPorts is false
  if (!store.get('showSystemPorts')) {
    filteredHostPorts = filteredHostPorts.filter(p => !isSystemProcess(p.command));
  }
  
  // Filter out Docker ports if showDockerPorts is false
  if (!store.get('showDockerPorts')) {
    filteredDockerPorts = [];
  }
  
  // ⏱️  [AI-PERF] Deduplicating ports...
  const dedupStartTime = Date.now();
  
  // Remove host ports that are duplicated by Docker ports
  // When a Docker container publishes a port, it appears in both lsof (via limactl/docker-proxy) and docker ps
  // We prefer the Docker entry as it provides more context (container name)
  const dockerPortNumbers = new Set(filteredDockerPorts.map(p => p.port));
  const dedupedHostPorts = filteredHostPorts.filter(p => {
    // Keep the host port if it's not a Docker port, or if it's not a limactl/docker-proxy process
    if (!dockerPortNumbers.has(p.port)) return true;
    // Remove if it's limactl or docker-proxy (these are Docker forwarding processes)
    if (p.command === 'limactl' || p.command === 'docker-proxy' || p.command === 'com.docker.backend') return false;
    // Keep other processes even if they're on the same port (might be legitimate duplicates)
    return true;
  });
  
  safeLog(`⏱️  [AI-PERF] Deduplication took ${Date.now() - dedupStartTime}ms. Removed ${filteredHostPorts.length - dedupedHostPorts.length} duplicate ports`);
  
  currentPorts = [...dedupedHostPorts, ...filteredDockerPorts];
  currentPorts.sort((a, b) => (a.source === b.source ? (a.port - b.port) : a.source.localeCompare(b.source)));
  
  updateTrayMenu();
}

function updateTrayMenu() {
  if (!tray) return;
  
  const menuItems = [];
  
  // Add header
  menuItems.push({ label: 'Open Ports', enabled: false });
  menuItems.push({ type: 'separator' });
  
  // Group ports by source and type
  const hostPorts = currentPorts.filter(p => p.source === 'host' && !isSystemProcess(p.command));
  const systemPorts = currentPorts.filter(p => p.source === 'host' && isSystemProcess(p.command));
  const dockerPorts = currentPorts.filter(p => p.source === 'docker');
  
  // Add regular host ports
  if (hostPorts.length > 0) {
    const showIcons = store.get('showServiceIcons');
    hostPorts.forEach(port => {
      const iconImage = showIcons ? getServiceIconImage(port.command) : null;
      // Only show separator if icons are enabled
      const portLabel = showIcons ? `┊ ${port.port} • ${port.command || 'unknown'}` : `${port.port} • ${port.command || 'unknown'}`;
      menuItems.push({
        label: portLabel,
        icon: iconImage,
        submenu: [
          { 
            label: 'Open in Browser', 
            click: () => shell.openExternal(`http://localhost:${port.port}`)
          },
          { 
            label: 'Copy Port', 
            click: () => clipboard.writeText(String(port.port))
          },
          { type: 'separator' },
          { 
            label: 'Ignore Port', 
            click: async () => {
              const rules = store.get('ignoreRules');
              rules.push(String(port.port));
              store.set('ignoreRules', rules);
              await updatePorts();
            }
          },
          { type: 'separator' },
          ...(port.pid ? [
            { 
              label: 'Terminate Process', 
              click: async () => {
                await termPid(port.pid);
                await updatePorts();
              }
            },
            { 
              label: 'Force Kill Process', 
              click: async () => {
                await killPid(port.pid);
                await updatePorts();
              }
            }
          ] : [])
        ]
      });
    });
  }
  
  // Add Docker container ports
  if (dockerPorts.length > 0) {
    const showIcons = store.get('showServiceIcons');
    menuItems.push({ type: 'separator' });
    menuItems.push({ label: 'Docker Containers', enabled: false });
    dockerPorts.forEach(port => {
      const iconImage = showIcons ? getServiceIconImage(port.containerName || port.command) : null;
      const portLabel = showIcons ? `┊ ${port.port} • ${port.containerName || port.command || 'unknown'}` : `${port.port} • ${port.containerName || port.command || 'unknown'}`;
      menuItems.push({
        label: portLabel,
        icon: iconImage,
        submenu: [
          { 
            label: 'Open in Browser', 
            click: () => shell.openExternal(`http://localhost:${port.port}`)
          },
          { 
            label: 'Copy Port', 
            click: () => clipboard.writeText(String(port.port))
          },
          { 
            label: 'Ignore Port', 
            click: async () => {
              const rules = store.get('ignoreRules');
              rules.push(String(port.port));
              store.set('ignoreRules', rules);
              await updatePorts();
            }
          }
        ]
      });
    });
  }
  
  // Add macOS system services section (if enabled and there are any)
  if (store.get('showSystemPorts') && systemPorts.length > 0) {
    const showIcons = store.get('showServiceIcons');
    menuItems.push({ type: 'separator' });
    menuItems.push({ label: 'System Services', enabled: false });
    systemPorts.forEach(port => {
      const iconImage = showIcons ? getServiceIconImage(port.command) : null;
      const portLabel = showIcons ? `┊ ${port.port} • ${port.command || 'unknown'}` : `${port.port} • ${port.command || 'unknown'}`;
      menuItems.push({
        label: portLabel,
        icon: iconImage,
        submenu: [
          { 
            label: 'Open in Browser', 
            click: () => shell.openExternal(`http://localhost:${port.port}`)
          },
          { 
            label: 'Copy Port', 
            click: () => clipboard.writeText(String(port.port))
          },
          { type: 'separator' },
          { 
            label: 'Ignore Port', 
            click: async () => {
              const rules = store.get('ignoreRules');
              rules.push(String(port.port));
              store.set('ignoreRules', rules);
              await updatePorts();
            }
          },
          { type: 'separator' },
          ...(port.pid ? [
            { 
              label: 'Terminate Process', 
              click: async () => {
                await termPid(port.pid);
                await updatePorts();
              }
            },
            { 
              label: 'Force Kill Process', 
              click: async () => {
                await killPid(port.pid);
                await updatePorts();
              }
            }
          ] : [])
        ]
      });
    });
  }
  
  // Add bottom menu items
  menuItems.push({ type: 'separator' });
  
  const ignoredCount = store.get('ignoreRules').length;
  if (ignoredCount > 0) {
    menuItems.push({ 
      label: `${ignoredCount} ports hidden`,
      submenu: [
        {
          label: 'Clear All Ignored',
          click: async () => {
            store.set('ignoreRules', []);
            await updatePorts();
          }
        }
      ]
    });
  }
  
  menuItems.push({ label: 'Preferences...', click: () => openPreferences() });
  
  // About section with submenu
  menuItems.push({ type: 'separator' });
  const githubIcon = nativeImage.createFromPath(path.join(__dirname, '..', 'assets', 'icons', 'github.png')).resize({ width: 16, height: 16 });
  
  // Format last update check time
  const getLastCheckTime = () => {
    if (!lastUpdateCheck) return 'never';
    const now = new Date();
    const diff = now - lastUpdateCheck;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    
    // For longer times, show the actual time
    return lastUpdateCheck.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Build status message
  let statusMessage = `Open Ports Menubar is up to date`;
  if (updateAvailable) {
    statusMessage = `Update available: v${updateAvailable.version}`;
  } else if (updateDownloaded) {
    statusMessage = `Update ready to install`;
  }

  const aboutSubmenu = [
    {
      label: `Version ${app.getVersion()}`,
      enabled: false
    },
    {
      label: statusMessage,
      enabled: false
    },
    {
      label: `Last checked: ${getLastCheckTime()}`,
      enabled: false
    }
  ];
  
  // Add update status if there's an update
  if (updateDownloaded) {
    aboutSubmenu.push({ type: 'separator' });
    aboutSubmenu.push({
      label: '🎉 Restart to Install Update',
      click: () => autoUpdater.quitAndInstall()
    });
  } else if (updateAvailable) {
    aboutSubmenu.push({ type: 'separator' });
    aboutSubmenu.push({
      label: `🔄 Download Update (v${updateAvailable.version})`,
      click: () => {
        // Try to download update, but if it fails (unsigned app), open GitHub releases
        autoUpdater.downloadUpdate().catch(err => {
          safeLog(`⏱️  [AI-PERF] Download failed: ${err.message}`);
          dialog.showMessageBox({
            type: 'info',
            title: 'Manual Update Required',
            message: `Automatic update failed (unsigned app). Opening GitHub releases page...`,
            buttons: ['OK']
          }).then(() => {
            shell.openExternal(`https://github.com/Nati-elimelech/open-ports-menubar/releases/tag/v${updateAvailable.version}`);
          });
        });
      }
    });
  }
  
  // Add GitHub link at the bottom
  aboutSubmenu.push({ type: 'separator' });
  aboutSubmenu.push({ 
    label: 'GitHub Repository', 
    icon: githubIcon,
    click: () => shell.openExternal('https://github.com/Nati-elimelech/open-ports-menubar')
  });
  
  // Add update notification to About menu label if update is available
  const aboutLabel = updateAvailable ? '🔴 About (Update Available)' : 'About';
  
  menuItems.push({ 
    label: aboutLabel,
    submenu: aboutSubmenu
  });
  
  // Quit section
  menuItems.push({ type: 'separator' });
  menuItems.push({ 
    label: 'Quit Open Ports Menubar', 
    accelerator: 'Cmd+Q', 
    click: () => app.quit() 
  });
  
  const contextMenu = Menu.buildFromTemplate(menuItems);
  tray.setContextMenu(contextMenu);
}

function createTray() {
  // Use template icon for menu bar (macOS requires "Template" in filename)
  const iconPath = path.resolve(path.join(__dirname, '..', 'assets', 'menubarTemplate.png'));
  safeLog('⏱️  [AI-PERF] Loading tray icon from:', iconPath);
  
  let image = nativeImage.createFromPath(iconPath);
  if (isMac) {
    image.setTemplateImage(true); // Makes it work with dark/light mode
  }
  safeLog('⏱️  [AI-PERF] Icon loaded, size:', image.getSize());
  
  tray = new Tray(image);
  safeLog('⏱️  [AI-PERF] Tray created successfully');
  
  tray.setToolTip('Open Ports Menubar');
  
  // Initial menu
  updateTrayMenu();
  
  // Start updating ports
  updatePorts();
  refreshInterval = setInterval(updatePorts, store.get('refreshIntervalMs'));
}

app.whenReady().then(() => {
  if (isMac && app.dock) app.dock.hide();
  createTray();
  
  // Setup auto-updater
  setupAutoUpdater();
  
  // Check for updates on startup (after a short delay to let app fully load)
  setTimeout(() => {
    lastUpdateCheck = new Date(); // Set initial check time
    checkForUpdates();
  }, 2000);
  
  // Check for updates every 4 hours
  setInterval(checkForUpdates, 4 * 60 * 60 * 1000);
});

app.on('window-all-closed', (e) => {
  // Keep running in tray
  e.preventDefault();
});

// IPC: settings handlers for preferences window only
ipcMain.handle('settings:get', async () => {
  const startTime = Date.now();
  const settings = {
    refreshInterval: store.get('refreshInterval'),
    ignoreRules: store.get('ignoreRules'),
    launchAtLogin: app.getLoginItemSettings().openAtLogin,
    showDockerPorts: store.get('showDockerPorts'),
    showSystemPorts: store.get('showSystemPorts'),
    showServiceIcons: store.get('showServiceIcons')
  };
  safeLog(`⏱️  [AI-PERF] Settings retrieval took: ${Date.now() - startTime}ms`);
  return settings;
});

ipcMain.handle('settings:set', async (_e, settings) => {
  const startTime = Date.now();
  
  // Update refresh interval
  if (settings.refreshInterval !== undefined) {
    store.set('refreshInterval', settings.refreshInterval);
    const ms = settings.refreshInterval * 1000;
    store.set('refreshIntervalMs', ms);
    
    // Clear existing interval and set new one
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = setInterval(updatePorts, ms);
    }
  }
  
  // Update ignore rules
  if (settings.ignoreRules !== undefined) {
    store.set('ignoreRules', settings.ignoreRules);
    await updatePorts(); // Refresh to apply new ignore rules
  }
  
  // Update launch at login
  if (settings.launchAtLogin !== undefined) {
    app.setLoginItemSettings({
      openAtLogin: settings.launchAtLogin
    });
  }
  
  // Update Docker ports visibility
  if (settings.showDockerPorts !== undefined) {
    store.set('showDockerPorts', settings.showDockerPorts);
    await updatePorts();
  }
  
  // Update system ports visibility
  if (settings.showSystemPorts !== undefined) {
    store.set('showSystemPorts', settings.showSystemPorts);
    await updatePorts();
  }
  
  // Update service icons visibility
  if (settings.showServiceIcons !== undefined) {
    store.set('showServiceIcons', settings.showServiceIcons);
    await updatePorts();
  }
  
  safeLog(`⏱️  [AI-PERF] Settings update took: ${Date.now() - startTime}ms`);
  return true;
});