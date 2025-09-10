// macOS system processes that should be hidden when "Show System Ports" is off
export const SYSTEM_PROCESSES = [
  // Apple system services
  'rapportd',           // Rapport (Handoff/Continuity)
  'mDNSResponder',      // Bonjour/mDNS
  'AirPlayXPCHelper',   // AirPlay
  'sharingd',           // Sharing services
  'bluetoothd',         // Bluetooth daemon
  'apsd',               // Apple Push Service
  'controlcenter',      // Control Center
  'WiFiAgent',          // WiFi
  'trustd',             // Certificate trust
  'locationd',          // Location services
  'identityservicesd',  // iMessage/FaceTime
  'nsurlsessiond',      // NSURLSession daemon
  'cloudd',             // iCloud
  'bird',               // iCloud Documents
  'coreaudiod',         // Core Audio
  'WindowServer',       // Window Server
  'loginwindow',        // Login window
  'launchd',            // Launch daemon
  'kernel_task',        // Kernel
  'systemstats',        // System statistics
  'syslogd',            // System logging
  'UserEventAgent',     // User events
  'cfprefsd',           // Preferences daemon
  'distnoted',          // Distributed notifications
  'notifyd',            // Notification daemon
  'securityd',          // Security daemon
  'coreservicesd',      // Core services
  'powerd',             // Power management
  'diskarbitrationd',   // Disk arbitration
  'configd',            // System configuration
  'CoreLocationAgent',  // Core Location
  'commerce',           // App Store commerce
  'akd',                // Authentication kit
  'AMPLibraryAgent',    // Apple Media Player
  'amsengagementd',     // Apple Media Services
  'amsaccountsd',       // Apple Media Services accounts
  'remindd',            // Reminders daemon
  'CalendarAgent',      // Calendar
  'ContactsAgent',      // Contacts
  'photoanalysisd',     // Photos analysis
  'photolibraryd',      // Photos library
  'cloudphotod',        // iCloud Photos
  'MusicLibrary',       // Music app
  'TVLibrary',          // TV app
  'parsec-fbf',         // Gaming-related
  'gamecontrollerd',    // Game controllers
  'RemoteDesktop',      // Apple Remote Desktop
  'ScreensharingAgent', // Screen sharing
  'universalaccessd',   // Accessibility
  'AirPlayUIAgent',     // AirPlay UI
  'CoreServicesUIAgent' // Core Services UI
];

// Icons for common services (using emojis for simplicity)
export const SERVICE_ICONS = {
  // Databases
  'postgres': '🐘',
  'postgresql': '🐘',
  'psql': '🐘',
  'mysql': '🐬',
  'mysqld': '🐬',
  'mongod': '🍃',
  'mongodb': '🍃',
  'redis': '🔴',
  'redis-server': '🔴',
  'elasticsearch': '🔍',
  'cassandra': '👁️',
  'couchdb': '🛋️',
  'mariadb': '🦭',
  
  // Web servers & proxies
  'nginx': '🌐',
  'apache': '🪶',
  'httpd': '🪶',
  'caddy': '🔒',
  'traefik': '🚦',
  'haproxy': '⚖️',
  
  // Development tools
  'node': '💚',
  'npm': '📦',
  'yarn': '🧶',
  'pnpm': '📦',
  'bun': '🥟',
  'deno': '🦕',
  'python': '🐍',
  'python3': '🐍',
  'ruby': '💎',
  'rails': '🛤️',
  'php': '🐘',
  'php-fpm': '🐘',
  'java': '☕',
  'gradle': '🐘',
  'maven': '🪶',
  'dotnet': '🔷',
  'go': '🐹',
  'rust': '🦀',
  'cargo': '📦',
  
  // Dev servers
  'webpack': '📦',
  'vite': '⚡',
  'next': '▲',
  'nuxt': '💚',
  'gatsby': '🟣',
  'hugo': '🦩',
  'jekyll': '🧪',
  'parcel': '📦',
  'rollup': '📦',
  'esbuild': '⚡',
  
  // Message queues & streaming
  'kafka': '📊',
  'rabbitmq': '🐰',
  'rabbitmq-server': '🐰',
  'nats': '🔄',
  'pulsar': '⭐',
  'mosquitto': '🦟',
  
  // Containers & orchestration
  'docker': '🐳',
  'dockerd': '🐳',
  'containerd': '📦',
  'kubernetes': '☸️',
  'kubectl': '☸️',
  'minikube': '☸️',
  'podman': '🦭',
  
  // Monitoring & logging
  'prometheus': '🔥',
  'grafana': '📊',
  'datadog': '🐕',
  'logstash': '📝',
  'kibana': '📊',
  'telegraf': '📡',
  'influxdb': '📈',
  
  // Version control
  'git': '🌳',
  'gitea': '🍵',
  'gitlab': '🦊',
  
  // Communication
  'slack': '💬',
  'discord': '💜',
  'zoom': '📹',
  'teams': '👥',
  'skype': '📞',
  
  // Browsers
  'chrome': '🌐',
  'firefox': '🦊',
  'safari': '🧭',
  'edge': '🌊',
  'brave': '🦁',
  'opera': '⭕',
  
  // Development environments
  'code': '💙',           // VS Code
  'vsCode': '💙',
  'idea': '🧠',           // IntelliJ IDEA
  'webstorm': '🌊',
  'phpstorm': '🐘',
  'pycharm': '🐍',
  'sublime': '🍊',
  'atom': '⚛️',
  'vim': '📝',
  'nvim': '📝',
  'emacs': '🔮',
  
  // Cloud services
  'aws': '☁️',
  'azure': '☁️',
  'gcloud': '☁️',
  'netlify': '🔷',
  'vercel': '▲',
  'heroku': '🟣',
  
  // Other services
  'jupyter': '📓',
  'rstudio': '📊',
  'tableau': '📊',
  'jenkins': '🤵',
  'teamcity': '🏗️',
  'bamboo': '🎋',
  'consul': '🔑',
  'vault': '🔐',
  'terraform': '🏗️',
  'ansible': '🔄',
  'puppet': '🎭',
  'chef': '👨‍🍳',
  
  // Default for unknown services
  'default': '🔌'
};

// Function to get icon for a process
export function getServiceIcon(processName) {
  if (!processName) return '';
  
  const lowerName = processName.toLowerCase();
  
  // Check for exact match first
  if (SERVICE_ICONS[lowerName]) {
    return SERVICE_ICONS[lowerName];
  }
  
  // Check for partial matches
  for (const [key, icon] of Object.entries(SERVICE_ICONS)) {
    if (lowerName.includes(key) || key.includes(lowerName)) {
      return icon;
    }
  }
  
  // Return empty string for no icon
  return '';
}

// Function to check if a process is a system process
export function isSystemProcess(processName) {
  if (!processName) return false;
  
  const lowerName = processName.toLowerCase();
  
  return SYSTEM_PROCESSES.some(systemProc => 
    lowerName === systemProc.toLowerCase() ||
    lowerName.startsWith(systemProc.toLowerCase())
  );
}

// Performance logging helper
export function perfLog(message, startTime) {
  const elapsed = startTime ? ` took: ${Date.now() - startTime}ms` : '';
  console.log(`⏱️  [AI-PERF] ${message}${elapsed}`);
}