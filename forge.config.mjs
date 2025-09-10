import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';

/** @type {import('@electron-forge/shared-types').ForgeConfig} */
const config = {
  packagerConfig: {
    name: 'Open Ports Menubar',
    appBundleId: 'app.openports.clone',
    arch: 'universal',
    appCategoryType: 'public.app-category.developer-tools',
    icon: './assets/icon', // Will use icon.icns for production
    asar: true,
    extendInfo: {
      LSUIElement: '1', // Hide Dock icon; menu bar only
      CFBundleDisplayName: 'Open Ports Menubar',
      CFBundleName: 'Open Ports Menubar'
    },
    osxSign: {
      hardenedRuntime: true,
      'gatekeeper-assess': false,
      entitlements: 'entitlements.mac.plist',
      'entitlements-inherit': 'entitlements.mac.plist'
    } // Configure signing with hardened runtime
  },
  rebuildConfig: {},
  makers: [
    new MakerZIP({}),
    new MakerDMG({
      icon: './assets/icon.icns',
      format: 'ULFO',
      name: 'Open Ports Menubar'
    })
  ],
  plugins: [
    new AutoUnpackNativesPlugin({})
  ]
};

export default config;