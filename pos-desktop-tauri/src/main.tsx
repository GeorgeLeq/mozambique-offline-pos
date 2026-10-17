import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/600.css';
import '@fontsource/jetbrains-mono/700.css';
import App from './App.tsx';
import './index.css';

// Initialize global POS logging array immediately
(window as any).__pos_logs = [];
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

function addLog(type: 'log' | 'warn' | 'error', ...args: any[]) {
  const message = args.map(arg => {
    if (typeof arg === 'object') {
      try { return JSON.stringify(arg); } catch { return String(arg); }
    }
    return String(arg);
  }).join(' ');
  (window as any).__pos_logs.push({
    timestamp: new Date().toLocaleTimeString(),
    type,
    message
  });
  if ((window as any).__pos_logs.length > 200) {
    (window as any).__pos_logs.shift();
  }
}

// console.log = (...args) => {
//   originalLog(...args);
//   addLog('log', ...args);
// };
// console.warn = (...args) => {
//   originalWarn(...args);
//   addLog('warn', ...args);
// };
// console.error = (...args) => {
//   originalError(...args);
//   addLog('error', ...args);
// };

window.addEventListener('error', (event) => {
  addLog('error', `Window Error: ${event.message} at ${event.filename}:${event.lineno}`);
});

window.addEventListener('unhandledrejection', (event) => {
  addLog('error', `Unhandled Rejection: ${event.reason}`);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
