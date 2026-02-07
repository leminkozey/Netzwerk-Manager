// ═══════════════════════════════════════════════════════════════════
// Global Header Component
// ═══════════════════════════════════════════════════════════════════

import { t } from '../i18n.js';
import { getConfig } from '../state.js';
import { navigate, getCurrentRoute } from '../router.js';
import { el } from '../ui.js';
import { iconEl } from '../icons.js';

let headerEl = null;
let pageContextEl = null;
let hashChangeHandler = null;

// Route → { titleKey, iconName }
const PAGE_META = {
  '/info':     { titleKey: 'page.info',     iconName: 'info' },
  '/start':    { titleKey: 'page.start',    iconName: 'start' },
  '/analysen': { titleKey: 'page.analysen', iconName: 'analysen' },
};

export function renderHeader(container) {
  const cfg = getConfig();
  const links = cfg?.headerLinks || [];

  // Page context: back button + page title (hidden on landing/login)
  pageContextEl = el('div', { className: 'page-context', id: 'pageContext' });

  headerEl = el('div', { className: 'top-bar', id: 'topBar' }, [
    // Left group: settings + page context
    el('div', { className: 'top-bar-left' }, [
      el('button', {
        className: 'settings-btn',
        'aria-label': t('app.settings'),
        onClick: () => {
          window.dispatchEvent(new CustomEvent('open-settings'));
        },
      }, [
        el('span', { className: 'settings-icon' }, [iconEl('settings', 18)]),
        el('span', { className: 'settings-text', textContent: t('app.settings'), 'data-i18n': 'app.settings' }),
      ]),
      pageContextEl,
    ]),

    // Center: nav links
    el('div', { className: 'header-nav' }, [
      createNavBtn('/', iconEl('home', 16), ''),
      createNavBtn('/info', iconEl('info', 16), t('landing.info')),
      createNavBtn('/start', iconEl('start', 16), t('landing.start')),
      createNavBtn('/analysen', iconEl('analysen', 16), t('landing.analysen')),
    ]),

    // Right group: quick links + version chip
    el('div', { className: 'top-bar-right' }, [
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
      el('div', {
        className: 'chip',
        id: 'versionChip',
        textContent: `${t('app.lastVersion')}: --`,
      }),
    ]),
  ]);

  container.prepend(headerEl);
  updateActiveNav();
  updatePageContext();

  // Listen for route changes (remove previous listener to prevent leaks)
  if (hashChangeHandler) window.removeEventListener('hashchange', hashChangeHandler);
  hashChangeHandler = () => {
    updateActiveNav();
    updatePageContext();
  };
  window.addEventListener('hashchange', hashChangeHandler);

  return headerEl;
}

function createNavBtn(route, iconNode, label) {
  const btn = el('button', {
    className: 'nav-btn',
    'data-route': route,
    onClick: () => navigate(route),
    'aria-label': label || 'Home',
  }, [
    el('span', { className: 'nav-btn-icon' }, [iconNode]),
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

function updatePageContext() {
  if (!pageContextEl) return;
  const route = getCurrentRoute() || '/';
  const meta = PAGE_META[route];

  pageContextEl.replaceChildren();

  if (meta) {
    pageContextEl.appendChild(el('button', {
      className: 'page-context-back',
      'aria-label': 'Back',
      onClick: () => navigate('/'),
    }, [iconEl('back', 18)]));
    pageContextEl.appendChild(el('span', {
      className: 'page-context-title',
      textContent: t(meta.titleKey),
    }));
    pageContextEl.style.display = '';
  } else {
    pageContextEl.style.display = 'none';
  }
}

export function updateVersionChip(versions) {
  const chip = document.getElementById('versionChip');
  if (!chip || !versions?.length) return;
  const latest = versions[0];
  if (latest?.label) {
    chip.textContent = `${t('app.lastVersion')}: ${latest.label}`;
  }
}
