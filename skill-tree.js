(() => {
  'use strict';
  const nodes = window.portfolioSkillTree;
  const byId = new Map(nodes.map(node => [node.id, node]));
  const active = new Set();
  const visible = new Set(['core']);
  const section = document.querySelector('#skills');
  const viewport = section.querySelector('.atlas-viewport');
  const world = section.querySelector('.atlas-world');
  const layer = section.querySelector('.atlas-nodes');
  const edges = section.querySelector('.atlas-edges');
  const colors = ['#ed8e83', '#86c9ee', '#9fe2b2', '#c4aedf', '#abbbe0', '#cfb99f'];
  let scale = .85;
  let selected = 'core';
  let pan = {x: 0, y: 0};
  function positionWorld() {
    world.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${scale})`;
  }
  const children = id => nodes.filter(n => n.parent === id);
  const polar = (radius, angle) => ({x: 1300 + radius * Math.cos(angle), y: 1200 + radius * Math.sin(angle)});
  Object.assign(byId.get('core'), {x: 1300, y: 1200});
  nodes.filter(n => n.kind === 'branch').forEach(branch => {
    const angle = (-150 + branch.branch * 60) * Math.PI / 180;
    Object.assign(branch, polar(480, angle));
    const skills = children(branch.id);
    skills.forEach((skill, index) => {
      const a = angle + (index - (skills.length - 1) / 2) * .18;
      Object.assign(skill, polar(index % 2 ? 900 : 740, a));
      const leaves = children(skill.id);
      leaves.forEach((leaf, i) => Object.assign(leaf, polar(1120, a + (i - (leaves.length - 1) / 2) * .105)));
    });
  });
  function activate(node) {
    const fresh = !active.has(node.id);
    active.add(node.id);
    children(node.id).forEach(n => visible.add(n.id));
    nodes.filter(n => n.parents?.includes(node.id)).forEach(n => visible.add(n.id));
    render();
    selected = node.id;
    if (fresh) fit();
  }
  function render() {
    nodes.forEach(node => {
      let button = layer.querySelector('[data-id="' + node.id + '"]');
      if (!visible.has(node.id)) { if (button) button.remove(); return; }
      if (!button) {
        button = document.createElement('button');
        button.type = 'button';
        button.dataset.id = node.id;
        button.className = 'atlas-node atlas-node--' + node.kind + (node.branch >= 0 && node.branch < 3 ? ' atlas-node--primary' : '');
        button.style.left = node.x + 'px'; button.style.top = node.y + 'px';
        button.style.setProperty('--node-color', colors[node.branch] || '#e5c27a');
        const emblem = document.createElement('span'); emblem.className = 'atlas-emblem'; emblem.setAttribute('aria-hidden', 'true');
        emblem.textContent = node.kind === 'core' ? 'PM' : node.kind === 'project' ? '◇' : node.kind === 'branch' ? ['⚔', '⌘', '♫', '⚒', '⌬', '✧'][node.branch] : '◆';
        const label = document.createElement('span'); label.className = 'atlas-label'; label.textContent = node.title;
        button.append(emblem, label);
        button.addEventListener('click', event => {
          if (suppressClick) { event.preventDefault(); return; }
          activate(node);
        });
        button.addEventListener('focus', () => { if (button.matches(':focus-visible')) { selected = node.id; center(node); } });
        layer.append(button);
      }
      button.classList.toggle('is-active', active.has(node.id));
      button.setAttribute('aria-pressed', String(active.has(node.id)));
      button.setAttribute('aria-label', node.title + (active.has(node.id) ? '. Explored.' : '. Discover skill and connected paths.'));
    });
    edges.replaceChildren();
    nodes.filter(n => visible.has(n.id)).forEach(node => {
      (node.parents || (node.parent ? [node.parent] : [])).forEach(id => {
        // A project never reveals its hidden skill paths in reverse.
        if (!active.has(id) || !visible.has(id)) return;
        const parent = byId.get(id);
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const mx = (parent.x + node.x) / 2;
        path.setAttribute('d', `M ${parent.x} ${parent.y} Q ${mx} ${parent.y} ${node.x} ${node.y}`);
        path.setAttribute('class', node.kind === 'project' ? 'atlas-edge atlas-edge--project' : 'atlas-edge');
        path.style.stroke = node.kind === 'project' ? '#e5c27a' : colors[node.branch];
        edges.append(path);
      });
    });
    section.querySelector('#atlas-count').textContent = `${active.size} explored · ${visible.size} discovered / ${nodes.length}`;
  }
  function center(node) {
    pan = {x: viewport.clientWidth / 2 - node.x * scale, y: viewport.clientHeight / 2 - node.y * scale};
    positionWorld();
  }
  function zoom(next, point) {
    const target = point || {x: (viewport.clientWidth / 2 - pan.x) / scale, y: (viewport.clientHeight / 2 - pan.y) / scale};
    scale = Math.max(.12, Math.min(1.5, next));
    world.style.setProperty("--node-boost", Math.min(1.6, 1 / scale));
    center(target);
  }
  function fit() {
    const shown = nodes.filter(n => visible.has(n.id));
    const minX = Math.min(...shown.map(n => n.x)) - 160, maxX = Math.max(...shown.map(n => n.x)) + 160;
    const minY = Math.min(...shown.map(n => n.y)) - 130, maxY = Math.max(...shown.map(n => n.y)) + 130;
    zoom(Math.min(.9, viewport.clientWidth / (maxX-minX), viewport.clientHeight / (maxY-minY)), {x:(minX+maxX)/2, y:(minY+maxY)/2});
  }
  section.querySelector('#atlas-in').addEventListener('click', () => zoom(scale * 1.25));
  section.querySelector('#atlas-out').addEventListener('click', () => zoom(scale / 1.25));
  section.querySelector('#atlas-fit').addEventListener('click', fit);
  section.querySelector('#atlas-reset').addEventListener('click', () => {
    active.clear(); visible.clear(); visible.add('core'); selected = 'core'; render(); zoom(.85, byId.get('core'));
  });
  viewport.addEventListener('keydown', event => {
    if (event.key === '+' || event.key === '=') { event.preventDefault(); zoom(scale * 1.25); }
    if (event.key === '-') { event.preventDefault(); zoom(scale / 1.25); }
    if (event.target === viewport && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) {
      event.preventDefault();
      pan.x += event.key === 'ArrowLeft' ? 100 : event.key === 'ArrowRight' ? -100 : 0;
      pan.y += event.key === 'ArrowUp' ? 100 : event.key === 'ArrowDown' ? -100 : 0;
      positionWorld();
    }
  });
  let drag;
  let suppressClick = false;
  viewport.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    // Keep pointer focus from scrolling the page to transformed node bounds.
    event.preventDefault();
    suppressClick = false;
    drag = {id: event.pointerId, x: event.clientX, y: event.clientY, pan: {...pan}, moved: false};
  });
  viewport.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 5) return;
    drag.moved = true;
    suppressClick = true;
    viewport.setPointerCapture(event.pointerId);
    viewport.classList.add('is-dragging');
    pan = {x: drag.pan.x + dx, y: drag.pan.y + dy};
    positionWorld();
  });
  const endDrag = event => {
    if (!drag || event.pointerId !== drag.id) return;
    drag = null;
    viewport.classList.remove('is-dragging');
    // The click following a drag must not discover a node underneath it.
    setTimeout(() => { suppressClick = false; }, 0);
  };
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);
  viewport.addEventListener('lostpointercapture', endDrag);
  viewport.addEventListener('wheel', event => {
    if (event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.clientHeight : 1;
    pan.x -= (event.shiftKey && !event.deltaX ? event.deltaY : event.deltaX) * unit;
    pan.y -= (event.shiftKey && !event.deltaX ? 0 : event.deltaY) * unit;
    positionWorld();
  }, {passive: false});
  render(); zoom(.85, byId.get('core'));
  new ResizeObserver(() => center(byId.get(selected))).observe(viewport);
})();

