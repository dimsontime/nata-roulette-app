import { createApp } from 'vue';
import { Capacitor } from '@capacitor/core';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { StatusBar, Style } from '@capacitor/status-bar';
import App from './App.vue';
import './styles.css';

async function configureNativeShell() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await ScreenOrientation.lock({ orientation: 'landscape' });
  } catch (error) {
    console.warn('Unable to lock screen orientation', error);
  }

  try {
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setOverlaysWebView({ overlay: true });
    await StatusBar.hide();
  } catch (error) {
    console.warn('Unable to hide status bar', error);
  }
}

void configureNativeShell();
createApp(App).mount('#app');
