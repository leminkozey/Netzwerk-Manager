// ═══════════════════════════════════════════════════════════════════
// Web Terminal Page – SSH commands via TOTP-secured gateway
// ═══════════════════════════════════════════════════════════════════

import { t } from '../i18n.js';
import { el } from '../ui.js';
import { iconEl } from '../icons.js';
import { getConfig, state } from '../state.js';
import { showToast } from '../ui.js';
import * as api from '../api.js';
import { showSudoApprovalModal } from '../components/sudo-modal.js';

let session = null;
let activeSudoHandler = null;

function resetSession() {
  if (session) {
    if (session.timer) clearInterval(session.timer);
    if (session.token) api.terminalDisconnect(session.token);
  }
  session = {
    token: null,
    expiresAt: 0,
    timer: null,
    history: [],
    historyIndex: -1,
    cwd: '~',
  };
}

export function renderTerminal(container) {
  const cfg = getConfig();
  const page = el('div', { className: 'terminal-page' });

  // Terminal disabled?
  if (!cfg?.terminal?.enabled) {
    page.appendChild(el('div', { className: 'terminal-warning' }, [
      el('span', { className: 'terminal-warning-icon' }, [iconEl('terminal', 48)]),
      el('h2', { textContent: t('terminal.disabled') }),
      el('p', { textContent: t('terminal.disabledHint') }),
    ]));
    container.appendChild(page);
    return;
  }

  resetSession();

  // Show TOTP status check
  showTotpGate(page);
  container.appendChild(page);

  // Cleanup on navigation
  return () => {
    if (activeSudoHandler) {
      window.removeEventListener('ws:sudo-challenge', activeSudoHandler);
      activeSudoHandler = null;
    }
    resetSession();
    session = null;
  };
}

// ── Loading indicator with animated dots ──
function createLoadingEl(text) {
  return el('div', { className: 'terminal-loading' }, [
    el('div', { className: 'terminal-loading-dots' }, [
      el('span'), el('span'), el('span'),
    ]),
    text ? el('span', { className: 'terminal-loading-text', textContent: text }) : null,
  ].filter(Boolean));
}

async function showTotpGate(page) {
  page.replaceChildren();
  page.appendChild(createLoadingEl(t('terminal.checking')));

  try {
    const status = await api.getTotpStatus();

    page.replaceChildren();

    if (!status.configured) {
      // TOTP not set up
      page.appendChild(el('div', { className: 'terminal-warning' }, [
        el('span', { className: 'terminal-warning-icon' }, [iconEl('shield', 48)]),
        el('h2', { textContent: t('terminal.noTotp') }),
        el('p', { textContent: t('terminal.noTotpHint') }),
        el('button', {
          className: 'btn',
          textContent: t('terminal.goToSettings'),
          onClick: () => window.dispatchEvent(new CustomEvent('open-settings')),
        }),
      ]));
      return;
    }

    // Show TOTP input
    showTotpInput(page);
  } catch {
    page.replaceChildren();
    page.appendChild(el('div', { className: 'terminal-warning' }, [
      el('p', { textContent: t('msg.error') }),
    ]));
  }
}

function showTotpInput(page) {
  page.replaceChildren();

  const codeInput = el('input', {
    type: 'text',
    className: 'totp-input',
    maxLength: '6',
    placeholder: '000000',
    autocomplete: 'one-time-code',
    inputMode: 'numeric',
    pattern: '[0-9]{6}',
  });

  const statusMsg = el('div', { className: 'totp-status' });

  const form = el('div', { className: 'terminal-totp-gate' }, [
    el('span', { className: 'terminal-warning-icon' }, [iconEl('shield', 48)]),
    el('h2', { textContent: t('terminal.totpTitle') }),
    el('p', { textContent: t('terminal.totpHint') }),
    codeInput,
    statusMsg,
  ]);

  let isVerifying = false;

  async function doVerify() {
    const code = codeInput.value.trim();
    if (!/^\d{6}$/.test(code) || isVerifying) return;
    isVerifying = true;
    codeInput.disabled = true;
    statusMsg.textContent = '';
    statusMsg.className = 'totp-status';

    try {
      const result = await api.terminalAuth(code);
      if (result.success) {
        // Success feedback
        codeInput.classList.add('success');
        showToast(t('terminal.authSuccess'));
        session.token = result.terminalToken;
        session.expiresAt = result.expiresAt;
        setTimeout(() => showDeviceSelection(page), 350);
        return;
      } else {
        // Error feedback with shake
        codeInput.classList.add('shake');
        statusMsg.textContent = t('terminal.invalidCode');
        statusMsg.className = 'totp-status error';
        setTimeout(() => codeInput.classList.remove('shake'), 500);
        codeInput.value = '';
        codeInput.disabled = false;
        codeInput.focus();
      }
    } catch {
      statusMsg.textContent = t('msg.error');
      statusMsg.className = 'totp-status error';
    }
    codeInput.disabled = false;
    isVerifying = false;
  }

  // Auto-submit when 6 digits entered
  codeInput.addEventListener('input', () => {
    codeInput.value = codeInput.value.replace(/\D/g, '');
    if (codeInput.value.length === 6) doVerify();
  });

  page.appendChild(form);
  setTimeout(() => codeInput.focus(), 100);
}

async function showDeviceSelection(page) {
  page.replaceChildren();
  page.appendChild(createLoadingEl(t('terminal.loadingDevices')));

  try {
    const data = await api.getTerminalDevices(session.token);

    page.replaceChildren();

    if (!data.devices || data.devices.length === 0) {
      page.appendChild(el('div', { className: 'terminal-warning' }, [
        el('p', { textContent: t('terminal.noDevices') }),
      ]));
      return;
    }

    const grid = el('div', { className: 'terminal-device-grid' });
    for (const device of data.devices) {
      grid.appendChild(el('button', {
        className: 'terminal-device-card',
        onClick: () => showTerminalView(page, device),
      }, [
        el('span', { className: 'terminal-device-icon' }, [iconEl(device.icon || 'server', 32)]),
        el('span', { className: 'terminal-device-name', textContent: device.name }),
        el('span', { className: 'terminal-device-ip', textContent: device.ip }),
      ]));
    }

    page.appendChild(el('div', { className: 'terminal-device-selection' }, [
      el('h2', { textContent: t('terminal.selectDevice') }),
      grid,
    ]));
  } catch (err) {
    if (err.message === 'Unauthenticated') return;
    page.replaceChildren();
    // Token might be expired
    page.appendChild(el('div', { className: 'terminal-warning' }, [
      el('p', { textContent: t('terminal.sessionExpired') }),
      el('button', {
        className: 'btn',
        textContent: t('terminal.verify'),
        onClick: () => showTotpInput(page),
      }),
    ]));
  }
}

function showTerminalView(page, device) {
  page.replaceChildren();
  session.history = [];
  session.historyIndex = -1;

  // Session timer
  const timerEl = el('span', { className: 'terminal-timer' });
  function updateTimer() {
    const remaining = Math.max(0, session.expiresAt - Date.now());
    if (remaining === 0) {
      clearInterval(session.timer);
      showSessionExpired(page);
      return;
    }
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    timerEl.textContent = `${mins}:${String(secs).padStart(2, '0')}`;

    // Timer warning states
    const totalSec = mins * 60 + secs;
    if (totalSec <= 30) {
      timerEl.className = 'terminal-timer critical';
    } else if (totalSec <= 60) {
      timerEl.className = 'terminal-timer warn';
    } else {
      timerEl.className = 'terminal-timer';
    }
  }
  updateTimer();
  if (session.timer) clearInterval(session.timer);
  session.timer = setInterval(updateTimer, 1000);

  // Header
  const header = el('div', { className: 'terminal-header' }, [
    el('div', { className: 'terminal-dots' }, [
      el('span', { className: 'dot red' }),
      el('span', { className: 'dot yellow' }),
      el('span', { className: 'dot green' }),
    ]),
    el('span', { className: 'terminal-header-title', textContent: `${device.name} (${device.ip})` }),
    el('div', { className: 'terminal-header-right' }, [
      timerEl,
      el('button', {
        className: 'terminal-header-btn fullscreen-btn',
        title: 'Fullscreen',
        onClick: (e) => {
          const container = e.target.closest('.terminal-container');
          container.classList.toggle('fullscreen');
        },
      }, [
        el('div', { className: 'fullscreen-icon' }, [
          el('div', { className: 'corner corner-tl' }),
          el('div', { className: 'corner corner-tr' }),
          el('div', { className: 'corner corner-bl' }),
          el('div', { className: 'corner corner-br' }),
        ]),
      ]),
      el('button', {
        className: 'terminal-header-btn',
        textContent: t('terminal.switchDevice'),
        onClick: () => {
          clearInterval(session.timer);
          if (session.token) api.terminalDisconnect(session.token);
          session.cwd = '~';
          showDeviceSelection(page);
        },
      }),
      el('button', {
        className: 'terminal-header-btn danger',
        textContent: t('terminal.disconnect'),
        onClick: () => {
          clearInterval(session.timer);
          if (session.token) api.terminalDisconnect(session.token);
          session.token = null;
          session.cwd = '~';
          showTotpGate(page);
        },
      }),
    ]),
  ]);

  // Output area
  const output = el('div', { className: 'terminal-output', id: 'terminalOutput' });

  // Welcome banner
  const welcome = el('div', { className: 'terminal-welcome' }, [
    el('div', { className: 'terminal-welcome-text', textContent: `Connected to ${device.name}` }),
    el('div', { className: 'terminal-welcome-info', textContent: `${device.ip} | ${t('terminal.readyHint')}` }),
  ]);
  output.appendChild(welcome);

  // Input line
  const promptLabel = el('span', { className: 'terminal-prompt-label', textContent: `${device.name}:~$ ` });
  const cmdInput = el('input', {
    type: 'text',
    className: 'terminal-cmd-input',
    spellcheck: 'false',
    autocomplete: 'off',
    autocapitalize: 'off',
  });

  const inputLine = el('div', { className: 'terminal-input-line' }, [
    promptLabel,
    cmdInput,
  ]);

  // Function to update prompt with current working directory
  const updatePromptLabel = (cwd) => {
    const promptText = `${device.name}:${cwd}$ `;
    promptLabel.textContent = promptText;
  };

  // Initialize prompt
  updatePromptLabel(session.cwd);

  async function runCommand(outputEl, dev, command, totpCode) {
    const loadingLine = el('div', { className: 'terminal-line loading' }, [
      el('span', { textContent: t('terminal.executing') + ' ' }),
      el('span', { className: 'terminal-loading-dots', style: { display: 'inline-flex', gap: '3px', verticalAlign: 'middle' } }, [
        el('span', { style: { width: '4px', height: '4px', borderRadius: '50%', background: '#8b949e', display: 'inline-block' } }),
        el('span', { style: { width: '4px', height: '4px', borderRadius: '50%', background: '#8b949e', display: 'inline-block' } }),
        el('span', { style: { width: '4px', height: '4px', borderRadius: '50%', background: '#8b949e', display: 'inline-block' } }),
      ]),
    ]);
    outputEl.appendChild(loadingLine);
    scrollToBottom(outputEl);

    try {
      const result = await api.terminalExecute(session.token, dev.id, command, totpCode);
      loadingLine.remove();

      if (result.expired) {
        const expLine = el('div', { className: 'terminal-line error', textContent: t('terminal.sessionExpired') });
        outputEl.appendChild(expLine);
        return;
      }

      if (result.rateLimited) {
        const rlLine = el('div', { className: 'terminal-line error', textContent: t('terminal.rateLimited') });
        outputEl.appendChild(rlLine);
        return;
      }

      // Backend flagged as dangerous but we didn't send TOTP code
      if (!result.success && result.dangerous && !totpCode) {
        return 'needs-totp';
      }

      if (!result.success && result.error) {
        const errLine = el('div', { className: 'terminal-line error', textContent: result.error });
        outputEl.appendChild(errLine);
        return;
      }

      // Show output (combined stdout/stderr in PTY mode)
      if (result.output && result.output.trim()) {
        const outputBlock = el('pre', {
          className: 'terminal-line stdout',
          textContent: result.output
        });
        outputEl.appendChild(outputBlock);
      }

      // Update current working directory
      if (result.cwd) {
        session.cwd = result.cwd;
        updatePromptLabel(session.cwd);
      }

      // Show error if present
      if (result.error) {
        const errLine = el('div', {
          className: 'terminal-line error',
          textContent: result.error
        });
        outputEl.appendChild(errLine);
      }

      // Show exit code only if non-zero
      if (result.exitCode && result.exitCode !== 0) {
        const exitLine = el('div', { className: 'terminal-line error', textContent: `exit code: ${result.exitCode}` });
        outputEl.appendChild(exitLine);
      }

      // NO MORE "(ok)" - if command has no output, show nothing (like real terminal)
    } catch {
      loadingLine.remove();
      const errLine = el('div', { className: 'terminal-line error', textContent: t('terminal.error') });
      outputEl.appendChild(errLine);
    }

    scrollToBottom(outputEl);
  }

  async function handleDangerousCommand(outputEl, dev, command, inputEl) {
    return new Promise((resolve) => {
      const overlay = el('div', { className: 'dangerous-overlay' });

      const codeInput = el('input', {
        type: 'text',
        className: 'totp-input',
        maxLength: '6',
        placeholder: '000000',
        autocomplete: 'one-time-code',
        inputMode: 'numeric',
        pattern: '[0-9]{6}',
      });

      const statusMsg = el('div', { className: 'totp-status' });

      const confirmBtn = el('button', {
        className: 'btn danger',
        textContent: t('terminal.dangerousConfirm'),
      });

      const cancelBtn = el('button', {
        className: 'btn secondary',
        textContent: t('ui.cancel'),
      });

      overlay.appendChild(el('div', { className: 'dangerous-modal' }, [
        el('h3', { textContent: t('terminal.dangerousTitle') }),
        el('p', { textContent: t('terminal.dangerousHint') }),
        el('pre', { className: 'dangerous-command', textContent: command }),
        codeInput,
        statusMsg,
        el('div', { className: 'dangerous-actions' }, [cancelBtn, confirmBtn]),
      ]));

      cancelBtn.addEventListener('click', () => {
        overlay.remove();
        const cancelLine = el('div', { className: 'terminal-line error', textContent: 'Aborted.' });
        outputEl.appendChild(cancelLine);
        scrollToBottom(outputEl);
        if (inputEl) inputEl.focus();
        resolve();
      });

      let isConfirming = false;
      async function doConfirm() {
        const code = codeInput.value.trim();
        if (!/^\d{6}$/.test(code) || isConfirming) return;
        isConfirming = true;
        confirmBtn.disabled = true;
        confirmBtn.classList.add('loading');
        statusMsg.textContent = '';

        overlay.remove();
        await runCommand(outputEl, dev, command, code);
        if (inputEl) inputEl.focus();
        resolve();
      }

      confirmBtn.addEventListener('click', doConfirm);
      codeInput.addEventListener('keyup', e => {
        if (e.key === 'Enter') doConfirm();
      });
      codeInput.addEventListener('input', () => {
        codeInput.value = codeInput.value.replace(/\D/g, '');
        if (codeInput.value.length === 6) doConfirm();
      });

      document.querySelector('.terminal-container')?.appendChild(overlay);
      setTimeout(() => codeInput.focus(), 100);
    });
  }

  const termContainer = el('div', { className: 'terminal-container' }, [
    header,
    output,
    inputLine,
  ]);

  page.appendChild(termContainer);

  // Focus input on click anywhere in terminal
  termContainer.addEventListener('click', (e) => {
    if (!e.target.closest('.terminal-header-btn') && !e.target.closest('.terminal-header-right')) {
      cmdInput.focus();
    }
  });

  // Sudo challenge listener – show modal when backend requests sudo approval
  if (activeSudoHandler) {
    window.removeEventListener('ws:sudo-challenge', activeSudoHandler);
  }
  activeSudoHandler = function handleSudoChallenge(event) {
    showSudoApprovalModal(event.detail, (response) => {
      if (state.socket?.readyState === WebSocket.OPEN) {
        state.socket.send(JSON.stringify(response));
      }
    });
  };
  window.addEventListener('ws:sudo-challenge', activeSudoHandler);

  let isExecuting = false;

  async function executeCommand() {
    const command = cmdInput.value.trim();
    if (!command || isExecuting) return;

    // Handle clear command locally
    if (command === 'clear') {
      output.replaceChildren();
      cmdInput.value = '';
      session.history.push(command);
      session.historyIndex = session.history.length;
      return;
    }

    isExecuting = true;

    try {
      // Add to history
      session.history.push(command);
      if (session.history.length > 500) session.history.shift();
      session.historyIndex = session.history.length;
      cmdInput.value = '';

      // Check token expiry
      if (Date.now() > session.expiresAt) {
        showSessionExpired(page);
        return;
      }

      // Show command in output with current working directory
      const cmdLine = el('div', { className: 'terminal-line' }, [
        el('span', { className: 'terminal-line-prompt', textContent: `${device.name}:${session.cwd}$ ` }),
        el('span', { className: 'terminal-line-cmd', textContent: command }),
      ]);
      output.appendChild(cmdLine);

      // Check if dangerous
      const cfg = getConfig();
      const dangerousPatterns = cfg?.terminal?.dangerousCommands || [];
      const isDangerous = dangerousPatterns.some(pattern => command.includes(pattern));

      if (isDangerous) {
        await handleDangerousCommand(output, device, command, cmdInput);
      } else {
        const result = await runCommand(output, device, command);
        // Backend detected dangerous command that frontend missed (config drift)
        if (result === 'needs-totp') {
          await handleDangerousCommand(output, device, command, cmdInput);
        }
      }

      scrollToBottom(output);
      cmdInput.focus();
    } finally {
      isExecuting = false;
    }
  }

  cmdInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      executeCommand();
    } else if (e.key === 'Escape') {
      const container = e.target.closest('.terminal-container');
      if (container && container.classList.contains('fullscreen')) {
        e.preventDefault();
        container.classList.remove('fullscreen');
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (session.historyIndex > 0) {
        session.historyIndex--;
        cmdInput.value = session.history[session.historyIndex];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (session.historyIndex < session.history.length - 1) {
        session.historyIndex++;
        cmdInput.value = session.history[session.historyIndex];
      } else {
        session.historyIndex = session.history.length;
        cmdInput.value = '';
      }
    }
  });

  setTimeout(() => cmdInput.focus(), 100);
}

function showSessionExpired(page) {
  if (session.timer) clearInterval(session.timer);
  session.token = null;

  const container = page.querySelector('.terminal-container');
  if (container) {
    const overlay = el('div', { className: 'dangerous-overlay' }, [
      el('div', { className: 'dangerous-modal' }, [
        el('div', { className: 'expired-icon' }, [iconEl('shield', 36)]),
        el('h3', { textContent: t('terminal.sessionExpired') }),
        el('p', { textContent: t('terminal.sessionExpiredHint') }),
        el('button', {
          className: 'btn',
          textContent: t('terminal.verify'),
          onClick: () => showTotpInput(page),
        }),
      ]),
    ]);
    container.appendChild(overlay);
  } else {
    showTotpInput(page);
  }
}

function scrollToBottom(el) {
  requestAnimationFrame(() => {
    el.scrollTop = el.scrollHeight;
  });
}
