// ═══════════════════════════════════════════════════════════════════
// Sudo Approval Modal Component
// ═══════════════════════════════════════════════════════════════════

import { el } from '../ui.js';
import { iconEl } from '../icons.js';

export function showSudoApprovalModal(challenge, onResponse) {
  let responded = false;

  function respond(data) {
    if (responded) return;
    responded = true;
    cleanup();
    onResponse(data);
  }

  function deny() {
    respond({
      type: 'sudo-response',
      challengeId: challenge.challengeId,
      approve: false,
    });
  }

  function confirm() {
    const code = input.value.trim();
    if (!/^\d{6}$/.test(code)) return;
    respond({
      type: 'sudo-response',
      challengeId: challenge.challengeId,
      approve: true,
      totpCode: code,
      rememberSession: checkbox.checked,
    });
  }

  // TOTP input
  const input = el('input', {
    type: 'text',
    className: 'sudo-totp-input',
    inputmode: 'numeric',
    pattern: '[0-9]*',
    maxlength: '6',
    placeholder: '000000',
    autocomplete: 'one-time-code',
  });

  // Remember session checkbox
  const checkbox = el('input', {
    type: 'checkbox',
    id: 'sudoRememberSession',
  });

  // Confirm button (disabled until 6 digits)
  const confirmBtn = el('button', {
    className: 'sudo-confirm-btn',
    textContent: 'Bestätigen',
    disabled: 'true',
    onClick: confirm,
  });

  // Enable/disable confirm button + auto-submit on 6 digits
  input.addEventListener('input', () => {
    input.value = input.value.replace(/\D/g, '');
    const valid = input.value.length === 6;
    if (valid) {
      confirmBtn.removeAttribute('disabled');
      confirm();
    } else {
      confirmBtn.setAttribute('disabled', 'true');
    }
  });

  // Command display (safe via textContent)
  const commandDisplay = el('div', { className: 'sudo-command' });
  commandDisplay.textContent = challenge.command;

  const overlay = el('div', { className: 'sudo-approval-overlay' }, [
    el('div', { className: 'sudo-approval-modal' }, [
      // Icon
      el('div', { className: 'sudo-icon' }, [iconEl('shield', 32)]),

      // Title
      el('h3', { textContent: 'Sudo Authentifizierung' }),

      // Command
      commandDisplay,

      // TOTP section
      el('div', { className: 'sudo-totp-section' }, [
        el('label', { textContent: 'TOTP Code', style: { marginBottom: '8px', display: 'block' } }),
        input,
      ]),

      // Remember session
      el('div', { className: 'sudo-remember-section' }, [
        checkbox,
        el('label', { textContent: 'Sitzung merken (3 Min.)', for: 'sudoRememberSession' }),
      ]),

      // Actions
      el('div', { className: 'sudo-actions' }, [
        el('button', {
          className: 'sudo-deny-btn',
          textContent: 'Ablehnen',
          onClick: deny,
        }),
        confirmBtn,
      ]),
    ]),
  ]);

  // Keyboard handling
  function onKeyDown(e) {
    if (e.key === 'Escape') {
      deny();
    } else if (e.key === 'Enter' && input.value.length === 6) {
      confirm();
    }
  }

  document.addEventListener('keydown', onKeyDown);

  // Click on overlay background to deny
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) deny();
  });

  function cleanup() {
    document.removeEventListener('keydown', onKeyDown);
    overlay.remove();
  }

  document.body.appendChild(overlay);
  requestAnimationFrame(() => input.focus());
}
