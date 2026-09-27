// Interactive knowledge graph shared by index.html and knowledge-graph.html.
// Expects an <svg id="kgSvg"> and a caption element with id="kgCaption".
(function renderKnowledgeGraph() {
  const svg = document.getElementById('kgSvg');
  const caption = document.getElementById('kgCaption');
  if (!svg || !caption) return;
  const DEFAULT_CAPTION = caption.textContent;
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const GROUP_COLORS = { people: '#38bdf8', money: '#818cf8', risk: '#fb7185', action: '#34d399' };
  const NODES = [
    { id: 'customer', label: 'Customer', group: 'people', note: 'Who they are, and every account, loan and complaint tied to them.' },
    { id: 'account', label: 'Account', group: 'money', note: 'Balances and behaviour, linked to the customer and every transaction.' },
    { id: 'transaction', label: 'Transaction', group: 'money', note: 'Each payment in context — who sent it, who received it, and why it matters.' },
    { id: 'merchant', label: 'Merchant', group: 'people', note: 'Where money goes, and which patterns connect merchants to risk.' },
    { id: 'counterparty', label: 'Counterparty', group: 'people', note: 'The other side of the deal — exposure mapped across the network.' },
    { id: 'risk', label: 'Risk Signal', group: 'risk', note: 'Anomalies surfaced from transactions, loans and complaint data.' },
    { id: 'regulation', label: 'Regulation', group: 'risk', note: 'Each risk signal mapped to the rule it touches — audit-ready by default.' },
    { id: 'recommendation', label: 'AI Recommendation', group: 'action', note: 'What to do next, with the full chain of evidence behind it.' },
    { id: 'workflow', label: 'Workflow', group: 'action', note: 'Human-approved actions routed into the systems you already run.' },
    { id: 'loan', label: 'Loan', group: 'money', note: 'Credit exposure connected to the customer and their risk signals.' }
  ];
  const LINKS = [
    ['customer', 'account'], ['account', 'transaction'], ['transaction', 'merchant'],
    ['transaction', 'counterparty'], ['transaction', 'risk'], ['risk', 'regulation'],
    ['risk', 'recommendation'], ['recommendation', 'workflow'], ['customer', 'loan'],
    ['loan', 'risk'], ['regulation', 'recommendation'], ['workflow', 'customer']
  ];
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let currentLayout = null;

  function make(tag, attributes, parent) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attributes).forEach(([key, value]) => el.setAttribute(key, value));
    if (parent) parent.appendChild(el);
    return el;
  }

  function draw(isNarrow) {
    const width = isNarrow ? 420 : 900;
    const height = isNarrow ? 560 : 480;
    const cx = width / 2, cy = height / 2;
    const rx = isNarrow ? 150 : 350;
    const ry = isNarrow ? 225 : 175;
    svg.innerHTML = '';
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    const defs = make('defs', {}, svg);
    const coreGradient = make('radialGradient', { id: 'kgCore', cx: '35%', cy: '30%', r: '75%' }, defs);
    make('stop', { offset: '0', 'stop-color': '#818cf8' }, coreGradient);
    make('stop', { offset: '1', 'stop-color': '#3730a3' }, coreGradient);
    const glow = make('filter', { id: 'kgGlow', x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs);
    make('feGaussianBlur', { stdDeviation: '6' }, glow);

    const positions = {};
    NODES.forEach((node, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / NODES.length;
      positions[node.id] = { x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) };
    });

    const spokes = make('g', {}, svg);
    NODES.forEach(node => {
      const p = positions[node.id];
      make('line', { class: 'kg-spoke', 'data-ids': node.id, x1: cx, y1: cy, x2: p.x, y2: p.y }, spokes);
    });

    const links = make('g', {}, svg);
    const particles = make('g', { class: 'kg-particles' }, svg);
    LINKS.forEach(([a, b], i) => {
      const pa = positions[a], pb = positions[b];
      // Bend each link toward the core so the graph reads as one connected layer
      const qx = (pa.x + pb.x) / 2 + (cx - (pa.x + pb.x) / 2) * 0.35;
      const qy = (pa.y + pb.y) / 2 + (cy - (pa.y + pb.y) / 2) * 0.35;
      const d = `M${pa.x},${pa.y} Q${qx},${qy} ${pb.x},${pb.y}`;
      make('path', { class: 'kg-link', 'data-ids': `${a} ${b}`, d }, links);
      if (prefersReducedMotion) return;
      const dot = make('circle', { r: 2.4, fill: '#e0e7ff' }, particles);
      make('animateMotion', { dur: `${3.2 + (i % 4) * 0.7}s`, begin: `-${(i * 0.9) % 4}s`, repeatCount: 'indefinite', path: d }, dot);
    });

    const core = make('g', {}, svg);
    make('circle', { cx, cy, r: 46, fill: '#6366f1', opacity: 0.45, filter: 'url(#kgGlow)' }, core);
    make('circle', { class: 'kg-core-ring', cx, cy, r: 58, fill: 'none', stroke: 'rgba(199,210,254,.35)', 'stroke-width': 1, 'stroke-dasharray': '3 7' }, core);
    make('circle', { cx, cy, r: 40, fill: 'url(#kgCore)', stroke: 'rgba(255,255,255,.35)', 'stroke-width': 1 }, core);
    const coreLabel = make('text', { x: cx, y: cy + 4, 'text-anchor': 'middle', fill: '#fff', 'font-family': 'Inter, sans-serif', 'font-size': 11.5, 'font-weight': 700 }, core);
    coreLabel.textContent = 'ArthaShield';

    const nodesGroup = make('g', {}, svg);
    NODES.forEach((node, i) => {
      const p = positions[node.id];
      const color = GROUP_COLORS[node.group];
      const g = make('g', { class: 'kg-node', 'data-id': node.id, tabindex: 0, role: 'button', 'aria-label': `${node.label}: ${node.note}` }, nodesGroup);
      const halo = make('circle', { class: 'kg-halo', cx: p.x, cy: p.y, r: 16, fill: color }, g);
      halo.style.animationDelay = `${(i % 5) * 0.5}s`;
      make('circle', { cx: p.x, cy: p.y, r: 7, fill: color, stroke: '#030308', 'stroke-width': 2 }, g);
      make('circle', { cx: p.x, cy: p.y, r: 22, fill: 'transparent' }, g);
      const labelBelow = p.y >= cy - 1;
      // On phones, side labels anchor inward so long names like "AI Recommendation" don't clip
      let anchor = 'middle', labelX = p.x;
      if (isNarrow && p.x < cx - 60) { anchor = 'start'; labelX = p.x - 12; }
      if (isNarrow && p.x > cx + 60) { anchor = 'end'; labelX = p.x + 12; }
      const label = make('text', { x: labelX, y: labelBelow ? p.y + 30 : p.y - 20, 'text-anchor': anchor }, g);
      label.style.fontSize = isNarrow ? '15px' : '13px';
      label.textContent = node.label;
    });

    svg.querySelectorAll('.kg-node').forEach(el => {
      el.addEventListener('pointerenter', () => focusNode(el.dataset.id));
      el.addEventListener('focus', () => focusNode(el.dataset.id));
      el.addEventListener('click', (e) => { e.stopPropagation(); focusNode(el.dataset.id); });
      el.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') clearFocus(); });
      el.addEventListener('blur', clearFocus);
    });
  }

  function focusNode(id) {
    const node = NODES.find(n => n.id === id);
    const connected = new Set([id]);
    svg.querySelectorAll('.kg-link, .kg-spoke').forEach(el => {
      const ids = el.dataset.ids.split(' ');
      const isActive = ids.includes(id);
      el.classList.toggle('is-active', isActive);
      if (isActive) ids.forEach(x => connected.add(x));
    });
    svg.querySelectorAll('.kg-node').forEach(el => el.classList.toggle('is-active', connected.has(el.dataset.id)));
    svg.classList.add('is-focus');
    caption.innerHTML = `<span class="font-semibold text-white">${node.label}.</span> ${node.note}`;
  }

  function clearFocus() {
    svg.classList.remove('is-focus');
    svg.querySelectorAll('.is-active').forEach(el => el.classList.remove('is-active'));
    caption.textContent = DEFAULT_CAPTION;
  }

  document.addEventListener('click', (e) => { if (!svg.contains(e.target)) clearFocus(); });

  function redrawIfLayoutChanged(width) {
    const layout = width < 640 ? 'narrow' : 'wide';
    if (layout === currentLayout) return;
    currentLayout = layout;
    draw(layout === 'narrow');
  }

  redrawIfLayoutChanged(svg.parentElement.getBoundingClientRect().width);
  new ResizeObserver(([entry]) => redrawIfLayoutChanged(entry.contentRect.width)).observe(svg.parentElement);
})();
