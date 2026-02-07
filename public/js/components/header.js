// ═══════════════════════════════════════════════════════════════════
// Global Header Component
// ═══════════════════════════════════════════════════════════════════

import { t } from '../i18n.js';
import { state, getConfig } from '../state.js';
import { navigate, getCurrentRoute } from '../router.js';
import { el } from '../ui.js';
import { icon } from '../icons.js';

let headerEl = null;

export function renderHeader(container) {
  const cfg = getConfig();
  const links = cfg?.headerLinks || [];

  headerEl = el('div', { className: 'top-bar', id: 'topBar' }, [
    // Settings button (left)
    el('button', {
      className: 'settings-btn',
      'aria-label': t('app.settings'),
      onClick: () => {
        window.dispatchEvent(new CustomEvent('open-settings'));
      },
    }, [
      el('span', { className: 'settings-icon', innerHTML: icon('settings', 18) }),
      el('span', { className: 'settings-text', textContent: t('app.settings'), 'data-i18n': 'app.settings' }),
    ]),

    // Center: nav links
    el('div', { className: 'header-nav' }, [
      createNavBtn('/', icon('home', 16), ''),
      createNavBtn('/info', icon('info', 16), t('landing.info')),
      createNavBtn('/start', icon('start', 16), t('landing.start')),
      createNavBtn('/analysen', icon('analysen', 16), t('landing.analysen')),
    ]),

    // Quick links
    el('div', { className: 'header-links', id: 'headerLinks' },
      links.filter(l => l.name && l.url).map(link => {
        let url;
        try {
          url = new URL(link.url);
          if (!['http:', 'https:'].includes(url.protocol)) return null;
        } catch { return null; }

        const a = el('a', {
          href: url.href,
          target: '_blank',
          rel: 'noopener noreferrer',
          className: 'header-link',
        }, [
          el('img', {
            src: `${url.origin}/favicon.ico`,
            alt: '',
            loading: 'lazy',
            style: { width: '14px', height: '14px', borderRadius: '2px' },
            onError: (e) => { e.target.style.display = 'none'; },
          }),
          el('span', { textContent: link.name }),
        ]);
        return a;
      }).filter(Boolean)
    ),

    // Version chip (right)
    el('div', {
      className: 'chip',
      id: 'versionChip',
      textContent: `${t('app.lastVersion')}: --`,
    }),
  ]);

  container.prepend(headerEl);
  updateActiveNav();

  // Listen for route changes
  window.addEventListener('hashchange', updateActiveNav);

  return headerEl;
}

function createNavBtn(route, iconHtml, label) {
  const btn = el('button', {
    className: 'nav-btn',
    'data-route': route,
    onClick: () => navigate(route),
    'aria-label': label || 'Home',
  }, [
    el('span', { className: 'nav-btn-icon', innerHTML: iconHtml }),
    ...(label ? [el('span', { className: 'nav-btn-label', textContent: label })] : []),
  ]);
  return btn;
}

function updateActiveNav() {
  const current = getCurrentRoute() || '/';
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.route === current);
  });
}

export function updateVersionChip(versions) {
  const chip = document.getElementById('versionChip');
  if (!chip || !versions?.length) return;
  const latest = versions[0];
  if (latest?.label) {
    chip.textContent = `${t('app.lastVersion')}: ${latest.label}`;
  }
}
