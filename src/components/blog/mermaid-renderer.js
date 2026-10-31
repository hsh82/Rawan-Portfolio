let mermaidPromise;
let configuredTheme = '';

function themeName() {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'default';
}

async function mermaidEngine() {
  const mermaid = (await (mermaidPromise ||= import('mermaid'))).default;
  const theme = themeName();
  if (configuredTheme !== theme) {
    mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme });
    configuredTheme = theme;
  }
  return mermaid;
}

function status(stage, message, className) {
  stage.replaceChildren();
  const element = document.createElement('p');
  element.className = className;
  element.textContent = message;
  stage.append(element);
}

export async function renderMermaidFigure(figure, { force = false } = {}) {
  if (!(figure instanceof HTMLElement)) return false;
  if (!force && (figure.dataset.mermaidRendering === 'true' || figure.dataset.mermaidRendered === 'true')) return true;
  const stage = figure.querySelector('.diagram-stage');
  const source = figure.dataset.chart || '';
  if (!stage || !source.trim()) {
    if (stage) status(stage, 'Unable to render diagram. Check Mermaid syntax.', 'diagram-error');
    figure.dataset.mermaidError = 'true';
    return false;
  }
  figure.dataset.mermaidRendering = 'true';
  status(stage, 'Rendering diagram…', 'diagram-status');
  try {
    const engine = await mermaidEngine();
    const { svg } = await engine.render(`mermaid-${Math.random().toString(36).slice(2)}`, source);
    stage.innerHTML = svg;
    figure.dataset.mermaidRendered = 'true';
    delete figure.dataset.mermaidError;
    return true;
  } catch (error) {
    status(stage, 'Unable to render diagram. Check Mermaid syntax.', 'diagram-error');
    figure.dataset.mermaidError = 'true';
    if (globalThis.location?.hostname === '127.0.0.1' || globalThis.location?.hostname === 'localhost') console.warn('Mermaid diagram failed to render', error);
    return false;
  } finally {
    delete figure.dataset.mermaidRendering;
  }
}

export async function renderMermaidDiagrams(root = document) {
  const figures = [...root.querySelectorAll('[data-mermaid]')];
  for (const figure of figures) await renderMermaidFigure(figure);
  bindMermaidControls(root);
  return figures.length;
}

export async function refreshMermaidDiagrams(root = document) {
  const figures = [...root.querySelectorAll('[data-mermaid]')];
  for (const figure of figures) {
    delete figure.dataset.mermaidRendered;
    await renderMermaidFigure(figure, { force: true });
  }
  bindMermaidControls(root);
  return figures.length;
}

export function bindMermaidControls(root = document) {
  root.querySelectorAll('[data-mermaid] [data-enlarge]').forEach(button => {
    if (button.dataset.mermaidBound === 'true') return;
    button.dataset.mermaidBound = 'true';
    button.addEventListener('click', () => {
      const figure = button.closest('[data-mermaid]');
      figure?.classList.toggle('diagram-expanded');
    });
  });
}

export function observeMermaidDiagrams(root = document) {
  if (root.documentElement?.dataset.mermaidObserver === 'true') return;
  if (root.documentElement) root.documentElement.dataset.mermaidObserver = 'true';
  const renderVisible = entries => entries.filter(entry => entry.isIntersecting).forEach(entry => {
    observer.unobserve(entry.target);
    void renderMermaidFigure(entry.target).then(() => bindMermaidControls(root));
  });
  const observer = 'IntersectionObserver' in globalThis
    ? new IntersectionObserver(renderVisible, { rootMargin: '240px' })
    : null;
  const scan = () => {
    const figures = [...root.querySelectorAll('[data-mermaid]')];
    if (observer) figures.filter(figure => figure.dataset.mermaidRendered !== 'true').forEach(figure => observer.observe(figure));
    else void renderMermaidDiagrams(root);
    bindMermaidControls(root);
  };
  scan();
  new MutationObserver(scan).observe(root, { childList: true, subtree: true });
  new MutationObserver(() => void refreshMermaidDiagrams(root)).observe(root.documentElement || root, { attributes: true, attributeFilter: ['class'] });
}
