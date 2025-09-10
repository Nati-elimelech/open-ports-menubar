import path from 'path';
import { fileURLToPath } from 'url';
import { nativeImage } from 'electron';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Icon file mappings (without .png extension for flexibility)
const SERVICE_ICON_FILES = {
  // Databases
  'postgres': 'postgres',
  'postgresql': 'postgres',
  'psql': 'postgres',
  'mysql': 'mysql',
  'mysqld': 'mysql',
  'mongod': 'mongodb',
  'mongodb': 'mongodb',
  'redis': 'redis',
  'redis-server': 'redis',
  
  // Web servers
  'nginx': 'nginx',
  'apache': 'apache',
  'httpd': 'apache',
  
  // Development
  'node': 'node',
  'npm': 'node',
  'yarn': 'node',
  'python': 'python',
  'python3': 'python',
  
  // Containers
  'docker': 'docker',
  'dockerd': 'docker',
  'containerd': 'docker',
  
  // Version control
  'git': 'git',
  
  // Apple/macOS system services
  'rapportd': 'apple',
  'mDNSResponder': 'apple',
  'AirPlayXPCHelper': 'apple',
  'sharingd': 'apple',
  'bluetoothd': 'apple',
  'apsd': 'apple',
  'controlcenter': 'apple',
  'WiFiAgent': 'apple',
  'trustd': 'apple',
  'locationd': 'apple',
  'identityservicesd': 'apple',
  'cloudd': 'apple',
  'bird': 'apple',
  'coreaudiod': 'apple',
  'WindowServer': 'apple',
  'loginwindow': 'apple',
  'launchd': 'apple',
  'kernel_task': 'apple',
  'UserEventAgent': 'apple',
  'cfprefsd': 'apple',
  'distnoted': 'apple',
  'notifyd': 'apple',
  'securityd': 'apple',
  'coreservicesd': 'apple',
  'powerd': 'apple',
  'configd': 'apple',
  'CoreLocationAgent': 'apple',
  'commerce': 'apple',
  'akd': 'apple',
  'AMPLibraryAgent': 'apple',
  'amsengagementd': 'apple',
  'amsaccountsd': 'apple',
  'remindd': 'apple',
  'CalendarAgent': 'apple',
  'ContactsAgent': 'apple',
  'photoanalysisd': 'apple',
  'photolibraryd': 'apple',
  'cloudphotod': 'apple',
  'MusicLibrary': 'apple',
  'TVLibrary': 'apple',
  'parsec-fbf': 'apple',
  'gamecontrollerd': 'apple',
  'RemoteDesktop': 'apple',
  'ScreensharingAgent': 'apple',
  'universalaccessd': 'apple',
  'AirPlayUIAgent': 'apple',
  'CoreServicesUIAgent': 'apple'
};

// Cache for loaded icons
const iconCache = new Map();

/**
 * Get the icon for a service as a NativeImage
 * @param {string} processName - The name of the process/service
 * @returns {import('electron').NativeImage|null} The icon image or null if not found
 */
export function getServiceIconImage(processName) {
  if (!processName) return null;
  
  const lowerName = processName.toLowerCase();
  
  // Check cache first
  if (iconCache.has(lowerName)) {
    return iconCache.get(lowerName);
  }
  
  // Find icon file name
  let iconFileName = null;
  
  // Check for exact match
  if (SERVICE_ICON_FILES[lowerName]) {
    iconFileName = SERVICE_ICON_FILES[lowerName];
  } else {
    // Check for partial matches
    for (const [key, value] of Object.entries(SERVICE_ICON_FILES)) {
      if (lowerName.includes(key) || key.includes(lowerName)) {
        iconFileName = value;
        break;
      }
    }
  }
  
  // Use generic icon if no specific icon found
  if (!iconFileName) {
    iconFileName = 'generic';
  }
  
  // Try to load the icon
  const iconPath = path.join(__dirname, '..', '..', 'assets', 'icons', `${iconFileName}.png`);
  
  try {
    if (fs.existsSync(iconPath)) {
      const image = nativeImage.createFromPath(iconPath);
      
      // Resize to 16x16 if needed
      if (!image.isEmpty()) {
        const resized = image.resize({ width: 16, height: 16 });
        iconCache.set(lowerName, resized);
        return resized;
      }
    }
  } catch (error) {
    console.error(`Failed to load icon for ${processName}:`, error);
  }
  
  return null;
}

/**
 * Clear the icon cache (useful if icons are updated)
 */
export function clearIconCache() {
  iconCache.clear();
}

// Performance logging helper
export function perfLog(message, startTime) {
  const elapsed = startTime ? ` took: ${Date.now() - startTime}ms` : '';
  console.log(`⏱️  [AI-PERF] Icon loading ${message}${elapsed}`);
}