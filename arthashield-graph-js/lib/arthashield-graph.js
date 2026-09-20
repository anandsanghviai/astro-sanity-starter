/*
 * arthashield-graph.js
 * An embeddable, framework-free intelligence-graph modeler for ArthaShield.
 *
 * Positioning: ArthaShield is the intelligence layer that connects the dots
 * existing financial systems keep separate. This modeler lets a user build a
 * small knowledge graph of financial entities and turns its structure into
 * CHALLENGE -> INTELLIGENCE -> ACTION insights.
 *
 * Features: drag nodes, pan/zoom the canvas, on-node context actions
 * (connect / delete), auto-layout, JSON import/export, and a transparent
 * rule-based intelligence engine.
 *
 * The intelligence engine is a prototype, not a live model.
 * `ArthaShieldIntelligence.analyze` is a pure function of the graph, so a real
 * model (e.g. a Claude API call) can replace it without touching the UI.
 */
(function (global) {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var WORLD_W = 4000, WORLD_H = 3000;

  var ENTITY_TYPES = {
    'Customer':          { color: '#2563eb', rank: 0 },
    'Account':           { color: '#4f46e5', rank: 1 },
    'Loan':              { color: '#7c3aed', rank: 1 },
    'Transaction':       { color: '#0ea5e9', rank: 2 },
    'Merchant':          { color: '#64748b', rank: 2 },
    'Counterparty':      { color: '#e11d48', rank: 2 },
    'Complaint':         { color: '#db2777', rank: 2 },
    'Settlement':        { color: '#0d9488', rank: 3 },
    'Risk Signal':       { color: '#f59e0b', rank: 3 },
    'Regulation':        { color: '#8b5cf6', rank: 4 },
    'AI Recommendation': { color: '#10b981', rank: 5 },
    'Workflow':          { color: '#0891b2', rank: 6 }
  };

  function typeMeta(type) { return ENTITY_TYPES[type] || { color: '#64748b', rank: 3 }; }
  function uid(p) { return (p || 'n') + '_' + Math.random().toString(36).slice(2, 8); }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  // ---- Modeler ------------------------------------------------------------

  function ArthaShieldGraph(options) {
    options = options || {};
    var container = typeof options.container === 'string'
      ? document.querySelector(options.container) : options.container;
    if (!container) throw new Error('ArthaShieldGraph: container not found');

    this.container = container;
    this.onChange = options.onChange || function () {};
    this.onSelect = options.onSelect || function () {};

    this.nodes = [];
    this.edges = [];
    this.selected = null;
    this.view = { scale: 1, tx: 0, ty: 0 };
    this._connectSource = null;
    this._linking = false;
    this._drag = null;
    this._pan = null;
    this._nodeEls = {};

    this._build();
    this._bind();
  }

  ArthaShieldGraph.prototype._build = function () {
    this.container.classList.add('asg-wrap');
    this.container.innerHTML = '';

    var vp = document.createElement('div');
    vp.className = 'asg-viewport';
    vp.style.width = WORLD_W + 'px';
    vp.style.height = WORLD_H + 'px';
    this.viewport = vp;

    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'asg-edges');
    svg.setAttribute('width', WORLD_W);
    svg.setAttribute('height', WORLD_H);
    var defs = document.createElementNS(SVG_NS, 'defs');
    defs.innerHTML =
      '<marker id="asg-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">' +
      '<path d="M0 0 L10 5 L0 10 z" fill="#94a3b8"></path></marker>';
    svg.appendChild(defs);
    this.svg = svg;

    vp.appendChild(svg);
    this.container.appendChild(vp);

    var pad = document.createElement('div');
    pad.className = 'asg-pad';
    pad.innerHTML =
      '<button data-act="connect">→ Connect</button>' +
      '<button data-act="delete">✕ Delete</button>';
    this.pad = pad;
    this.container.appendChild(pad);

    var self = this;
    pad.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    pad.addEventListener('click', function (e) {
      var act = e.target.getAttribute && e.target.getAttribute('data-act');
      if (act === 'connect' && self.selected && self.selected.kind === 'node') self._startLink(self.selected.id);
      if (act === 'delete') self.deleteSelected();
    });

    this._applyView();
  };

  ArthaShieldGraph.prototype._bind = function () {
    var self = this;
    // Background: pan on drag, clear selection on click.
    this.container.addEventListener('pointerdown', function (e) {
      if (e.target !== self.container && e.target !== self.svg && e.target !== self.viewport) return;
      self._pan = { x: e.clientX, y: e.clientY, tx: self.view.tx, ty: self.view.ty, moved: false };
      self.container.setPointerCapture(e.pointerId);
    });
    this.container.addEventListener('pointermove', function (e) {
      if (!self._pan) return;
      var dx = e.clientX - self._pan.x, dy = e.clientY - self._pan.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) self._pan.moved = true;
      self.view.tx = self._pan.tx + dx;
      self.view.ty = self._pan.ty + dy;
      self._applyView();
    });
    this.container.addEventListener('pointerup', function () {
      if (self._pan && !self._pan.moved) { self._clearConnect(); self.select(null); }
      self._pan = null;
    });
    this.container.addEventListener('wheel', function (e) {
      e.preventDefault();
      self.zoomAt(e.deltaY < 0 ? 1.1 : 0.9, e.clientX, e.clientY);
    }, { passive: false });

    document.addEventListener('keydown', function (e) {
      var tag = (document.activeElement && document.activeElement.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && self.selected) { e.preventDefault(); self.deleteSelected(); }
      if (e.key === 'Escape') { self._clearConnect(); self.select(null); }
    });
    window.addEventListener('resize', function () { self._positionPad(); });
  };

  // ---- View (pan / zoom) --------------------------------------------------

  ArthaShieldGraph.prototype._applyView = function () {
    this.viewport.style.transform =
      'translate(' + this.view.tx + 'px,' + this.view.ty + 'px) scale(' + this.view.scale + ')';
    this._positionPad();
  };

  ArthaShieldGraph.prototype.zoomAt = function (factor, clientX, clientY) {
    var rect = this.container.getBoundingClientRect();
    var cx = (clientX != null ? clientX - rect.left : rect.width / 2);
    var cy = (clientY != null ? clientY - rect.top : rect.height / 2);
    var s0 = this.view.scale, s1 = clamp(s0 * factor, 0.3, 2.5);
    // keep the point under the cursor stable
    this.view.tx = cx - (cx - this.view.tx) * (s1 / s0);
    this.view.ty = cy - (cy - this.view.ty) * (s1 / s0);
    this.view.scale = s1;
    this._applyView();
  };
  ArthaShieldGraph.prototype.zoomIn = function () { this.zoomAt(1.2); };
  ArthaShieldGraph.prototype.zoomOut = function () { this.zoomAt(1 / 1.2); };

  ArthaShieldGraph.prototype.fit = function () {
    if (!this.nodes.length) { this.view = { scale: 1, tx: 40, ty: 40 }; this._applyView(); return; }
    var self = this, minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    this.nodes.forEach(function (n) {
      var el = self._nodeEls[n.id], w = el ? el.offsetWidth : 120, h = el ? el.offsetHeight : 38;
      minX = Math.min(minX, n.x); minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + w); maxY = Math.max(maxY, n.y + h);
    });
    var rect = this.container.getBoundingClientRect();
    var pad = 60, bw = maxX - minX, bh = maxY - minY;
    var scale = clamp(Math.min((rect.width - pad * 2) / bw, (rect.height - pad * 2) / bh), 0.3, 1.3);
    this.view.scale = scale;
    this.view.tx = (rect.width - bw * scale) / 2 - minX * scale;
    this.view.ty = (rect.height - bh * scale) / 2 - minY * scale;
    this._applyView();
  };

  // ---- Public API ---------------------------------------------------------

  ArthaShieldGraph.prototype.loadGraph = function (graph) {
    this.nodes = (graph.nodes || []).map(function (n) {
      return { id: n.id || uid(), type: n.type, label: n.label || n.type, x: n.x || 40, y: n.y || 40 };
    });
    this.edges = (graph.edges || []).map(function (e) {
      return { id: e.id || uid('e'), from: e.from, to: e.to, dashed: !!e.dashed };
    });
    this.select(null);
    this._clearConnect();
    this._render();
    this.fit();
    this._emitChange();
  };

  ArthaShieldGraph.prototype.getGraph = function () {
    return {
      nodes: this.nodes.map(function (n) { return { id: n.id, type: n.type, label: n.label, x: Math.round(n.x), y: Math.round(n.y) }; }),
      edges: this.edges.map(function (e) { return { id: e.id, from: e.from, to: e.to, dashed: e.dashed }; })
    };
  };

  ArthaShieldGraph.prototype.addNode = function (type) {
    var rect = this.container.getBoundingClientRect();
    // place near the centre of the current view, in world coords
    var cx = (rect.width / 2 - this.view.tx) / this.view.scale;
    var cy = (rect.height / 2 - this.view.ty) / this.view.scale;
    var node = { id: uid(), type: type, label: type,
      x: cx - 60 + (Math.random() * 50 - 25), y: cy - 20 + (Math.random() * 50 - 25) };
    this.nodes.push(node);
    this._render();
    this.select({ kind: 'node', id: node.id });
    this._emitChange();
    return node;
  };

  ArthaShieldGraph.prototype.deleteSelected = function () {
    if (!this.selected) return;
    if (this.selected.kind === 'node') {
      var id = this.selected.id;
      this.nodes = this.nodes.filter(function (n) { return n.id !== id; });
      this.edges = this.edges.filter(function (e) { return e.from !== id && e.to !== id; });
    } else {
      var eid = this.selected.id;
      this.edges = this.edges.filter(function (e) { return e.id !== eid; });
    }
    this.select(null);
    this._render();
    this._emitChange();
  };

  ArthaShieldGraph.prototype.select = function (sel) {
    this.selected = sel;
    this._refreshSelection();
    this._positionPad();
    this.onSelect(sel, this);
  };

  ArthaShieldGraph.prototype.autoLayout = function () {
    var rows = {};
    this.nodes.forEach(function (n) { var r = typeMeta(n.type).rank; (rows[r] = rows[r] || []).push(n); });
    var ranks = Object.keys(rows).map(Number).sort(function (a, b) { return a - b; });
    ranks.forEach(function (r, ri) {
      var row = rows[r], slotW = 260;
      var totalW = slotW * row.length;
      row.forEach(function (n, i) { n.x = 400 - totalW / 2 + slotW * i + 60; n.y = 40 + ri * 110; });
    });
    this._render();
    this.fit();
    this._emitChange();
  };

  // ---- Rendering ----------------------------------------------------------

  ArthaShieldGraph.prototype._render = function () {
    var self = this, keep = {};
    this.nodes.forEach(function (n) {
      keep[n.id] = true;
      var el = self._nodeEls[n.id];
      if (!el) {
        el = document.createElement('div');
        el.className = 'asg-node';
        el.innerHTML = '<span class="asg-dot"></span><span class="asg-label"></span>';
        self.viewport.appendChild(el);
        self._nodeEls[n.id] = el;
        self._bindNode(el, n);
      }
      el.querySelector('.asg-dot').style.background = typeMeta(n.type).color;
      el.querySelector('.asg-label').textContent = n.label;
      el.title = n.type;
      el.style.transform = 'translate(' + n.x + 'px,' + n.y + 'px)';
    });
    Object.keys(this._nodeEls).forEach(function (id) {
      if (!keep[id]) { self._nodeEls[id].remove(); delete self._nodeEls[id]; }
    });
    this._renderEdges();
    this._refreshSelection();
    this._positionPad();
  };

  ArthaShieldGraph.prototype._center = function (node) {
    var el = this._nodeEls[node.id], w = el ? el.offsetWidth : 120, h = el ? el.offsetHeight : 38;
    return { x: node.x + w / 2, y: node.y + h / 2 };
  };

  ArthaShieldGraph.prototype._renderEdges = function () {
    var self = this;
    Array.prototype.slice.call(this.svg.querySelectorAll('.asg-edge,.asg-edge-hit')).forEach(function (n) { n.remove(); });
    var byId = {}; this.nodes.forEach(function (n) { byId[n.id] = n; });
    this.edges.forEach(function (e) {
      var a = byId[e.from], b = byId[e.to]; if (!a || !b) return;
      var ca = self._center(a), cb = self._center(b);
      var d = 'M' + ca.x + ',' + ca.y + ' L' + cb.x + ',' + cb.y;
      var hit = document.createElementNS(SVG_NS, 'path');
      hit.setAttribute('class', 'asg-edge-hit'); hit.setAttribute('d', d);
      hit.addEventListener('pointerdown', function (ev) { ev.stopPropagation(); self.select({ kind: 'edge', id: e.id }); });
      self.svg.appendChild(hit);
      var path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('class', 'asg-edge' + (e.dashed ? ' dashed' : '') +
        (self.selected && self.selected.kind === 'edge' && self.selected.id === e.id ? ' selected' : ''));
      path.setAttribute('d', d); path.setAttribute('marker-end', 'url(#asg-arrow)');
      self.svg.appendChild(path);
    });
  };

  ArthaShieldGraph.prototype._refreshSelection = function () {
    var self = this;
    Object.keys(this._nodeEls).forEach(function (id) {
      var el = self._nodeEls[id];
      el.classList.toggle('selected', !!self.selected && self.selected.kind === 'node' && self.selected.id === id);
      el.classList.toggle('source', self._connectSource === id);
    });
  };

  ArthaShieldGraph.prototype._positionPad = function () {
    if (!this.selected || this.selected.kind !== 'node') { this.pad.classList.remove('show'); return; }
    var node = this.nodes.filter(function (n) { return n.id === this.selected.id; }, this)[0];
    var el = this._nodeEls[this.selected.id];
    if (!node || !el) { this.pad.classList.remove('show'); return; }
    var w = el.offsetWidth;
    var sx = this.view.tx + (node.x + w / 2) * this.view.scale;
    var sy = this.view.ty + node.y * this.view.scale;
    this.pad.style.left = sx + 'px';
    this.pad.style.top = (sy - 10) + 'px';
    this.pad.classList.add('show');
  };

  // ---- Node interaction ---------------------------------------------------

  ArthaShieldGraph.prototype._bindNode = function (el, node) {
    var self = this;
    el.addEventListener('pointerdown', function (e) {
      e.stopPropagation();
      if (self._linking) { self._completeLink(node); return; }
      self.select({ kind: 'node', id: node.id });
      var rect = self.container.getBoundingClientRect();
      var gx = (e.clientX - rect.left - self.view.tx) / self.view.scale;
      var gy = (e.clientY - rect.top - self.view.ty) / self.view.scale;
      self._drag = { id: node.id, ox: gx - node.x, oy: gy - node.y };
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove', function (e) {
      if (!self._drag || self._drag.id !== node.id) return;
      var rect = self.container.getBoundingClientRect();
      node.x = (e.clientX - rect.left - self.view.tx) / self.view.scale - self._drag.ox;
      node.y = (e.clientY - rect.top - self.view.ty) / self.view.scale - self._drag.oy;
      el.style.transform = 'translate(' + node.x + 'px,' + node.y + 'px)';
      self._renderEdges(); self._positionPad();
    });
    el.addEventListener('pointerup', function () { if (self._drag) { self._drag = null; self._emitChange(); } });
  };

  ArthaShieldGraph.prototype._startLink = function (id) {
    this._linking = true; this._connectSource = id;
    this.container.classList.add('connect'); this._refreshSelection();
  };
  ArthaShieldGraph.prototype._completeLink = function (node) {
    var from = this._connectSource, to = node.id;
    if (from && from !== to) {
      var exists = this.edges.some(function (e) {
        return (e.from === from && e.to === to) || (e.from === to && e.to === from);
      });
      if (!exists) this.edges.push({ id: uid('e'), from: from, to: to, dashed: false });
    }
    this._clearConnect(); this._render(); this._emitChange();
  };
  ArthaShieldGraph.prototype._clearConnect = function () {
    this._linking = false; this._connectSource = null;
    this.container.classList.remove('connect'); this._refreshSelection();
  };

  ArthaShieldGraph.prototype._emitChange = function () { this.onChange(this.getGraph(), this); };

  // ---- Intelligence engine (transparent, rule-based prototype) ------------

  var ArthaShieldIntelligence = {
    LEVELS: { risk: 3, watch: 2, info: 1 },

    analyze: function (graph) {
      var nodes = graph.nodes || [], edges = graph.edges || [];
      var byId = {}; nodes.forEach(function (n) { byId[n.id] = n; });
      var adj = {}; nodes.forEach(function (n) { adj[n.id] = []; });
      edges.forEach(function (e) { if (adj[e.from]) adj[e.from].push(e.to); if (adj[e.to]) adj[e.to].push(e.from); });
      function typesOf(id) { return byId[id] ? byId[id].type : null; }
      function has(t) { return nodes.some(function (n) { return n.type === t; }); }
      function nodesOf(t) { return nodes.filter(function (n) { return n.type === t; }); }
      function neighboursByType(id, t) {
        return (adj[id] || []).map(function (nb) { return byId[nb]; }).filter(function (n) { return n && n.type === t; });
      }
      function connected(a, b) {
        return edges.some(function (e) { var ta = typesOf(e.from), tb = typesOf(e.to); return (ta === a && tb === b) || (ta === b && tb === a); });
      }
      var out = [];

      ['Counterparty', 'Merchant'].forEach(function (hubType) {
        nodesOf(hubType).forEach(function (hub) {
          var parties = (adj[hub.id] || []).map(function (id) { return byId[id]; })
            .filter(function (n) { return n && (n.type === 'Customer' || n.type === 'Account' || n.type === 'Transaction'); });
          if (parties.length >= 2) out.push({
            level: 'risk',
            title: 'A shared ' + hubType.toLowerCase() + ' links several parties.',
            why: 'One ' + hubType.toLowerCase() + ' connected to ' + parties.length + ' accounts or transactions can indicate a coordinated pattern rather than isolated activity.',
            action: 'Investigate the ' + hubType.toLowerCase() + ' network before it grows.'
          });
        });
      });

      if (connected('Transaction', 'Merchant') && connected('Transaction', 'Risk Signal')) out.push({
        level: 'watch',
        title: 'Recent transactions differ from historical behaviour.',
        why: 'Transactions form a relationship pattern (customer → transaction → merchant) that a risk signal has flagged as unusual.',
        action: 'Review transaction history.'
      });

      nodes.forEach(function (h) {
        var comps = neighboursByType(h.id, 'Complaint');
        if (comps.length >= 2) out.push({
          level: 'watch',
          title: 'Complaints are clustering on one ' + h.type.toLowerCase() + '.',
          why: comps.length + ' complaints share the same ' + h.type.toLowerCase() + ' — a recurring theme, not isolated grievances.',
          action: 'Trace the root cause behind this ' + h.type.toLowerCase() + '.'
        });
      });

      if (connected('Risk Signal', 'Regulation')) out.push({
        level: 'watch',
        title: 'This risk maps to a specific regulatory obligation.',
        why: 'A risk signal is linked to a regulation, so the event may carry a reporting duty.',
        action: 'Check compliance status and reporting timelines.'
      });

      // Early-warning: a loan carries a risk signal (collections use case).
      if (connected('Loan', 'Risk Signal')) out.push({
        level: 'watch',
        title: 'An early-warning signal is attached to a loan.',
        why: 'A loan is linked to a risk signal, pointing to possible stress before it becomes a default.',
        action: 'Sequence borrower outreach and review the account.'
      });

      // AML: a counterparty directly linked to a risk signal.
      if (connected('Counterparty', 'Risk Signal')) out.push({
        level: 'watch',
        title: 'A counterparty is linked to a risk signal.',
        why: 'Flows to this counterparty match a monitored pattern rather than ordinary activity.',
        action: 'Prepare an STR / CTR draft for review.'
      });

      // Reconciliation: a settlement chain shows a break.
      if (connected('Settlement', 'Risk Signal')) out.push({
        level: 'watch',
        title: 'A settlement chain shows a break.',
        why: 'A settlement is tied to a risk signal — records across rails are not reconciling.',
        action: 'Reconcile the settlement and resolve the break.'
      });

      nodesOf('Customer').forEach(function (c) {
        var products = neighboursByType(c.id, 'Account').concat(neighboursByType(c.id, 'Loan'));
        if (products.length >= 2) out.push({
          level: 'info',
          title: 'Exposure is concentrated on one customer.',
          why: 'A single customer is connected to ' + products.length + ' products, so risk is not spread across the book.',
          action: 'Review aggregate exposure for this customer.'
        });
      });

      if (connected('AI Recommendation', 'Workflow')) out.push({
        level: 'info',
        title: 'A next best action is ready to trigger.',
        why: 'An AI recommendation is wired to a workflow — the decision can move to execution.',
        action: 'Approve and trigger the workflow (human-in-the-loop).'
      });

      var isolated = nodes.filter(function (n) { return (adj[n.id] || []).length === 0; });
      if (isolated.length > 0 && nodes.length > 1) out.push({
        level: 'info',
        title: isolated.length + ' entit' + (isolated.length === 1 ? 'y is' : 'ies are') + ' not yet connected.',
        why: 'Intelligence comes from relationships. Disconnected entities are data, not context.',
        action: 'Connect the dots — that is where ArthaShield adds value.'
      });

      out.sort(function (a, b) { return ArthaShieldIntelligence.LEVELS[b.level] - ArthaShieldIntelligence.LEVELS[a.level]; });
      return {
        metrics: { entities: nodes.length, relationships: edges.length, connected: nodes.length - isolated.length },
        insights: out.slice(0, 5)
      };
    }
  };

  ArthaShieldGraph.ENTITY_TYPES = ENTITY_TYPES;
  ArthaShieldGraph.typeMeta = typeMeta;
  global.ArthaShieldGraph = ArthaShieldGraph;
  global.ArthaShieldIntelligence = ArthaShieldIntelligence;
})(typeof window !== 'undefined' ? window : this);
