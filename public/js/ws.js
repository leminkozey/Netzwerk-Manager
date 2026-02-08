// ═══════════════════════════════════════════════════════════════════
// WebSocket Management
// ═══════════════════════════════════════════════════════════════════

import { state } from './state.js';
import { handleForceLogout } from './auth.js';

let ws = null;
let heartbeatInterval = null;
let reconnectTimeout = null;
let reconnectDelay = 1000;

export function connectSocket() {
  closeSocket();
  reconnectDelay = 1000;

  const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  ws = new WebSocket(`${protocol}://${location.host}/`);
  state.socket = ws;

  ws.addEventListener('open', () => {
    // Guard: token may have been cleared between connect and open
    if (!state.token) { ws.close(); return; }
    // Authenticate via first message (not URL query) to avoid token in logs
    ws.send(JSON.stringify({ type: 'auth', token: state.token }));
    reconnectDelay = 1000; // Reset on successful connection
  });

  ws.addEventListener('message', e => {
    try {
      const msg = JSON.parse(e.data);
      if (msg.type === 'forceLogout' && typeof msg.deviceName === 'string') {
        const loginAt = typeof msg.loginAt === 'number' ? msg.loginAt : null;
        handleForceLogout(msg.deviceName, loginAt);
      }
    } catch {
      // ignore non-JSON messages
    }
  });

  ws.addEventListener('close', () => {
    ws = null;
    state.socket = null;
    clearInterval(heartbeatInterval);
    // Reconnect if still logged in
    if (state.token) {
      reconnectTimeout = setTimeout(() => {
        if (state.token) connectSocket();
      }, Math.min(reconnectDelay, 30000));
      reconnectDelay *= 2;
    }
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
  clearTimeout(reconnectTimeout);
  reconnectTimeout = null;
  clearInterval(heartbeatInterval);
  if (ws) {
    ws.close();
    ws = null;
    state.socket = null;
  }
}
