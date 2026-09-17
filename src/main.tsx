import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA Service Worker immediately for installability and online sync
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[PWA] Versi baru tersedia, memperbarui aset di latar belakang...');
  },
  onOfflineReady() {
    console.log('[PWA] Aplikasi siap beroperasi online dengan fallback aman.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
