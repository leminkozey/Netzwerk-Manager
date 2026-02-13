// ═══════════════════════════════════════════════════════════════════
// Landing Page
// ═══════════════════════════════════════════════════════════════════

import { t } from '../i18n.js';
import { navigate } from '../router.js';
import { el } from '../ui.js';
import { iconEl } from '../icons.js';
import { getConfig } from '../state.js';

function randomGreeting() {
  const cfg = getConfig();
  const greetingsCfg = cfg?.greetings;

  // Custom-only: nur eigene Nachrichten verwenden
  if (greetingsCfg?.customOnly && Array.isArray(greetingsCfg.messages) && greetingsCfg.messages.length > 0) {
    return greetingsCfg.messages[Math.floor(Math.random() * greetingsCfg.messages.length)];
  }

  // Fallback: eingebaute zufällige Nachrichten aus i18n
  const greetings = t('landing.greetings');
  if (Array.isArray(greetings)) {
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
  return greetings;
}

export function renderLanding(container) {
  const page = el('div', { className: 'landing-page' });

  // ── Animated GIF above title (accent-colored via CSS mask) ──
  const cfg0 = getConfig();
  const gifSrc = cfg0?.landingGif;
  // Sanitize: only allow simple filenames to prevent CSS injection via url()
  const safeSrc = typeof gifSrc === 'string' && /^[a-zA-Z0-9._-]+\.(png|gif|webp|apng|jpg|jpeg)$/i.test(gifSrc) ? gifSrc : null;
  if (safeSrc) {
    const gifSize = Math.min(1000, Math.max(50, Number(cfg0?.landingGifSize) || 200)) + 'px';
    page.appendChild(el('div', {
      className: 'landing-gif',
      style: {
        width: gifSize,
        height: gifSize,
        WebkitMaskImage: `url(${safeSrc})`,
        maskImage: `url(${safeSrc})`,
      },
    }));
  }

  // ── "Lokales Netzwerk" title ──
  page.appendChild(el('h1', { className: 'landing-title', textContent: t('app.title') }));

  // ── Random greeting ──
  page.appendChild(el('p', { className: 'landing-greeting', textContent: randomGreeting() }));

  // ── Action buttons with icons ──
  const cfg = getConfig();
  const buttons = cfg?.buttons || {};
  const allActions = [
    { key: 'info',     icon: 'info',     title: t('landing.info'),     sub: t('landing.infoSub'),     route: '/info' },
    { key: 'control',  icon: 'start',    title: t('landing.start'),    sub: t('landing.startSub'),    route: '/start' },
    { key: 'analysen', icon: 'analysen', title: t('landing.analysen'), sub: t('landing.analysenSub'), route: '/analysen' },
  ];
  const actions = allActions.filter(a => buttons[a.key] !== false);

  const btnRow = el('div', { className: 'landing-actions' });
  for (const action of actions) {
    btnRow.appendChild(el('button', {
      className: 'action-btn',
      'data-icon': action.icon,
      onClick: () => navigate(action.route),
    }, [
      el('span', { className: 'action-btn-icon' }, [iconEl(action.icon, 28)]),
      el('div', { className: 'action-btn-text' }, [
        el('span', { className: 'action-btn-title', textContent: action.title }),
        el('span', { className: 'action-btn-sub', textContent: action.sub }),
      ]),
    ]));
  }
  page.appendChild(btnRow);

  // ── Link chips with website favicons ──
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
