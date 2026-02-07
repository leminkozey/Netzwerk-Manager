// ═══════════════════════════════════════════════════════════════════
// Landing Page
// ═══════════════════════════════════════════════════════════════════

import { t } from '../i18n.js';
import { navigate } from '../router.js';
import { el } from '../ui.js';
import { icon } from '../icons.js';
import { getConfig } from '../state.js';

function randomGreeting() {
  const greetings = t('landing.greetings');
  if (Array.isArray(greetings)) {
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
  return greetings;
}

export function renderLanding(container) {
  const page = el('div', { className: 'landing-page' });

  // ── "Lokales Netzwerk" title ──
  page.appendChild(el('h1', { className: 'landing-title', textContent: t('app.title') }));

  // ── Random greeting ──
  page.appendChild(el('p', { className: 'landing-greeting', textContent: randomGreeting() }));

  // ── Action buttons with icons ──
  const actions = [
    { icon: 'info', title: t('landing.info'), sub: t('landing.infoSub'), route: '/info' },
    { icon: 'start', title: t('landing.start'), sub: t('landing.startSub'), route: '/start' },
    { icon: 'analysen', title: t('landing.analysen'), sub: t('landing.analysenSub'), route: '/analysen' },
  ];

  const btnRow = el('div', { className: 'landing-actions' });
  for (const action of actions) {
    btnRow.appendChild(el('button', {
      className: 'action-btn',
      onClick: () => navigate(action.route),
    }, [
      el('span', { className: 'action-btn-icon', innerHTML: icon(action.icon, 28) }),
      el('div', { className: 'action-btn-text' }, [
        el('span', { className: 'action-btn-title', textContent: action.title }),
        el('span', { className: 'action-btn-sub', textContent: action.sub }),
      ]),
    ]));
  }
  page.appendChild(btnRow);

  // ── Link chips with website favicons ──
  const cfg = getConfig();
  const links = (cfg && cfg.headerLinks) ? cfg.headerLinks : [];

  if (links.length > 0) {
    const chipRow = el('div', { className: 'landing-links' });
    for (const link of links) {
      if (!link.name || !link.url) continue;
      let domain = '';
      try { domain = new URL(link.url).hostname; } catch { continue; }
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;
      chipRow.appendChild(el('a', {
        className: 'link-chip',
        href: link.url,
        target: '_blank',
        rel: 'noopener noreferrer',
      }, [
        el('img', {
          src: faviconUrl,
          width: '16',
          height: '16',
          alt: '',
          style: { borderRadius: '3px' },
          onError: (e) => { e.target.style.display = 'none'; },
        }),
        el('span', { textContent: link.name }),
      ]));
    }
    if (chipRow.children.length > 0) {
      page.appendChild(chipRow);
    }
  }

  container.appendChild(page);
}
