// ═══════════════════════════════════════════════════════════════════
// AI Chat Widget – Floating chat bubble on landing page
// ═══════════════════════════════════════════════════════════════════

import { el } from '../ui.js';
import { state } from '../state.js';

let chatOpen = false;
let fullscreen = false;
let chatContainer = null;
let messagesEl = null;
let fabEl = null;
let history = [];
let isStreaming = false;

const ICON_CHAT = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><circle cx="9" cy="10" r="0.5" fill="currentColor"/><circle cx="12" cy="10" r="0.5" fill="currentColor"/><circle cx="15" cy="10" r="0.5" fill="currentColor"/></svg>';

const ICON_CLOSE = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

const ICON_EXPAND = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>';

const ICON_SHRINK = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>';

function authHeaders() {
  return state.token
    ? { Authorization: `Bearer ${state.token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

function addMessage(role, content) {
  const msg = el('div', { className: `ai-msg ai-msg-${role}` });
  const bubble = el('div', { className: `ai-bubble ai-bubble-${role}` });
  bubble.textContent = content;
  msg.appendChild(bubble);
  messagesEl.appendChild(msg);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return bubble;
}

function setStatus(text) {
  const existing = chatContainer.querySelector('.ai-status');
  if (existing) existing.textContent = text;
}

async function sendMessage(text) {
  if (!text.trim() || isStreaming) return;
  isStreaming = true;

  addMessage('user', text);
  history.push({ role: 'user', content: text });

  const assistantBubble = addMessage('assistant', '');
  assistantBubble.textContent = '...';

  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ message: text, history: history.slice(0, -1) }),
    });

    if (res.status === 401) {
      assistantBubble.textContent = 'Bitte zuerst einloggen.';
      isStreaming = false;
      return;
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      assistantBubble.textContent = errData.error || 'Serverfehler (' + res.status + ')';
      isStreaming = false;
      return;
    }

    let fullResponse = '';
    assistantBubble.textContent = '';
    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6);
        if (payload === '[DONE]') continue;
        try {
          const parsed = JSON.parse(payload);
          if (parsed.error) {
            assistantBubble.textContent = parsed.error;
            isStreaming = false;
            return;
          }
          if (parsed.content) {
            fullResponse += parsed.content;
            assistantBubble.textContent = fullResponse;
            messagesEl.scrollTop = messagesEl.scrollHeight;
          }
        } catch (e) {}
      }
    }
    if (fullResponse) {
      history.push({ role: 'assistant', content: fullResponse });
    }
  } catch (err) {
    console.error('[AI Chat] Error:', err);
    assistantBubble.textContent = 'Fehler: ' + (err.message || 'Unbekannt');
  }

  isStreaming = false;
}

function toggleFullscreen() {
  fullscreen = !fullscreen;
  chatContainer.classList.toggle('ai-chat-fullscreen', fullscreen);
  const btn = chatContainer.querySelector('.ai-chat-expand');
  if (btn) btn.innerHTML = fullscreen ? ICON_SHRINK : ICON_EXPAND;
}

function createChatWidget() {
  // Floating button — uses --radius-lg from settings
  fabEl = el('button', {
    className: 'ai-fab',
    'aria-label': 'AI Chat oeffnen',
    onClick: () => toggleChat(),
  });
  fabEl.innerHTML = ICON_CHAT;

  // Chat window
  chatContainer = el('div', { className: 'ai-chat-container ai-chat-hidden' });

  // Header with expand + close buttons
  const headerRight = el('div', { className: 'ai-chat-header-right' }, [
    el('button', {
      className: 'ai-chat-expand',
      'aria-label': 'Vollbild',
      onClick: () => toggleFullscreen(),
    }),
    el('button', {
      className: 'ai-chat-close',
      'aria-label': 'Schliessen',
      onClick: () => toggleChat(),
    }),
  ]);
  headerRight.querySelector('.ai-chat-expand').innerHTML = ICON_EXPAND;
  headerRight.querySelector('.ai-chat-close').innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  const header = el('div', { className: 'ai-chat-header' }, [
    el('div', { className: 'ai-chat-header-left' }, [
      el('span', { className: 'ai-chat-title', textContent: 'Netzwerk AI' }),
      el('span', { className: 'ai-status', textContent: '' }),
    ]),
    headerRight,
  ]);

  // Messages area
  messagesEl = el('div', { className: 'ai-messages' });

  // Input area
  const inputEl = el('input', {
    className: 'ai-input',
    type: 'text',
    placeholder: 'Frag mich etwas...',
    autocomplete: 'off',
  });

  const sendBtn = el('button', { className: 'ai-send-btn' });
  sendBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';

  const inputRow = el('div', { className: 'ai-input-row' }, [inputEl, sendBtn]);

  function doSend() {
    const val = inputEl.value.trim();
    if (!val) return;
    inputEl.value = '';
    sendMessage(val);
  }

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSend();
  });
  sendBtn.addEventListener('click', doSend);

  chatContainer.appendChild(header);
  chatContainer.appendChild(messagesEl);
  chatContainer.appendChild(inputRow);

  document.body.appendChild(fabEl);
  document.body.appendChild(chatContainer);

  checkAiStatus();
}

async function checkAiStatus() {
  try {
    const res = await fetch('/api/ai/status', { headers: authHeaders() });
    const data = await res.json();
    if (data.online && data.ready) {
      setStatus('Online');
    } else if (data.online) {
      setStatus('Modell nicht geladen');
    } else {
      setStatus('Offline');
    }
  } catch {
    setStatus('Offline');
  }
}

function toggleChat() {
  chatOpen = !chatOpen;
  if (chatContainer) {
    chatContainer.classList.toggle('ai-chat-hidden', !chatOpen);
  }
  // Switch FAB icon
  if (fabEl) {
    fabEl.innerHTML = chatOpen ? ICON_CLOSE : ICON_CHAT;
    fabEl.classList.toggle('ai-fab-active', chatOpen);
  }

  if (chatOpen && messagesEl && messagesEl.children.length === 0) {
    addMessage('assistant', 'Hi! Ich bin dein Netzwerk-Assistent. Frag mich alles ueber dein lokales Netzwerk.');
  }

  if (chatOpen) {
    const input = chatContainer.querySelector('.ai-input');
    if (input) setTimeout(() => input.focus(), 100);
  }

  // Exit fullscreen when closing
  if (!chatOpen && fullscreen) {
    fullscreen = false;
    chatContainer.classList.remove('ai-chat-fullscreen');
    const btn = chatContainer.querySelector('.ai-chat-expand');
    if (btn) btn.innerHTML = ICON_EXPAND;
  }
}

export function mountAiChat() {
  if (document.querySelector('.ai-fab')) return;
  createChatWidget();
}

export function unmountAiChat() {
  if (fabEl) fabEl.remove();
  if (chatContainer) chatContainer.remove();
  fabEl = null;
  chatOpen = false;
  fullscreen = false;
  chatContainer = null;
  messagesEl = null;
}
