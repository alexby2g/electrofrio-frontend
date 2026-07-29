const { defineCapacitorConfig } = require('@quasar/app-vite/capacitor');

module.exports = defineCapacitorConfig({
  appId: 'bo.com.electrofrio.app',
  appName: 'Electro Frío',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_electrofrio',
      iconColor: '#087D91'
    }
  }
});
