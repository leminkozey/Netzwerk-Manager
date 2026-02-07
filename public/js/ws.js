// ═══════════════════════════════════════════════════════════════════
// WebSocket Management
// ═══════════════════════════════════════════════════════════════════

import { state } from './state.js';
import { handleForceLogout } from './auth.js';

let ws = null;
let heartbeatInterval = null;

export function connectSocket() {
  closeSocket();

  const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  ws = new WebSocket(`${protocol}://${location.host}/`);
  state.socket = ws;

  ws.addEventListener('open', () => {
    // Authenticate via first message (not URL query) to avoid token in logs
    ws.send(JSON.stringify({ type: 'auth', token: state.token }));
  });

  ws.addEventListener('message', e => {
    try {
      const msg = JSON.parse(e.data);
      if (msg.type === 'forceLogout') {
        handleForceLogout(msg.deviceName, msg.loginAt);
      }
    } catch {
      // ignore non-JSON messages
    }
  });

  ws.addEventListener('close', () => {
    ws = null;
    state.socket = null;
    clearInterval(heartbeatInterval);
  });

  ws.addEventListener('error', () => {
    ws?.close();
  });

  // Keep alive
  heartbeatInterval = setInterval(() => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send('ping');
    }
  }, 25000);
}

export function closeSocket() {
  clearInterval(heartbeatInterval);
  if (ws) {
    ws.close();
    ws = null;
    state.socket = null;
  }
}
