// ═══════════════════════════════════════════════════════════════════
// Hash-based SPA Router
// ═══════════════════════════════════════════════════════════════════

const routes = new Map();
let currentRoute = null;
let contentEl = null;
let onBeforeNavigate = null;

export function registerRoute(path, handler) {
  routes.set(path, handler);
}

export function setContentElement(el) {
  contentEl = el;
}

export function setBeforeNavigate(fn) {
  onBeforeNavigate = fn;
}

export function navigate(path) {
  if (window.location.hash === `#${path}`) {
    handleRoute();
  } else {
    window.location.hash = `#${path}`;
  }
}

export function getCurrentRoute() {
  return currentRoute;
}

function handleRoute() {
  const hash = window.location.hash.slice(1) || '/';
  const path = hash.startsWith('/') ? hash : `/${hash}`;

  if (onBeforeNavigate && !onBeforeNavigate(path)) {
    return;
  }

  const handler = routes.get(path);
  if (!handler) {
    const fallback = routes.get('/');
    if (fallback && contentEl) {
      currentRoute = '/';
      contentEl.replaceChildren();
      fallback(contentEl);
    }
    return;
  }

  currentRoute = path;
  if (contentEl) {
    contentEl.replaceChildren();
    handler(contentEl);
  }

  // Update active nav indicators
  document.querySelectorAll('[data-route]').forEach(el => {
    el.classList.toggle('nav-active', el.dataset.route === path);
  });
}

export function initRouter() {
  window.addEventListener('hashchange', handleRoute);
  // Don't auto-navigate on init - let auth check do it
}

export function startRouter() {
  handleRoute();
}
