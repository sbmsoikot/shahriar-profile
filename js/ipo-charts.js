/*
 * ipo-charts.js — charts for "Anthropic Goes Public: Riding the Exponential".
 * Plain SVG, no dependencies. Each <div class="viz-plot" data-chart="..."> is drawn
 * at its own pixel width (so text stays legible on phones) and redrawn on resize.
 * Palette validated for colour-vision deficiency: rust #BE4A2C + blue #2E6DA4;
 * warm-gray context marks are always directly labelled.
 */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const C = {
    ink: '#17130F', soft: '#473d33', muted: '#7d7062', grid: '#E9E1D3', axis: '#cbbfa9',
    rust: '#BE4A2C', blue: '#2E6DA4', ctx: '#B7AD9F', ctxDark: '#9C9284', surface: '#FBF8F2',
  };
  const SANS = "'Spline Sans',system-ui,sans-serif";
  const MONO = "'JetBrains Mono',ui-monospace,monospace";
  const SERIF = "'Fraunces',Georgia,serif";

  function el(tag, a, p) {
    const e = document.createElementNS(NS, tag);
    for (const k in a) e.setAttribute(k, a[k]);
    if (p) p.appendChild(e);
    return e;
  }
  function tx(p, x, y, s, a) {
    const t = el('text', Object.assign({ x, y, 'font-family': SANS, 'font-size': 12, fill: C.soft }, a || {}), p);
    t.textContent = s;
    return t;
  }
  function root(box, W, H, label) {
    box.innerHTML = '';
    const s = el('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': label }, box);
    s.style.display = 'block';
    s.style.overflow = 'visible';
    return s;
  }
  function tipper(box) {
    const t = document.createElement('div');
    t.className = 'viz-tip';
    box.appendChild(t);
    return {
      show(html, x, y) {
        t.innerHTML = html;
        t.style.opacity = 1;
        const bw = box.clientWidth, tw = t.offsetWidth, th = t.offsetHeight;
        t.style.left = Math.min(Math.max(0, x - tw / 2), bw - tw) + 'px';
        t.style.top = (y - th - 12 < 0 ? y + 14 : y - th - 12) + 'px';
      },
      hide() { t.style.opacity = 0; },
    };
  }
  function hatch(s, id, color, bg) {
    const d = el('defs', {}, s);
    const p = el('pattern', { id, width: 7, height: 7, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, d);
    el('rect', { width: 7, height: 7, fill: bg || '#fff' }, p);
    el('line', { x1: 0, y1: 0, x2: 0, y2: 7, stroke: color, 'stroke-width': 2.4, 'stroke-opacity': 0.6 }, p);
    return `url(#${id})`;
  }
  const topRounded = (x, y, w, h, r) => {
    r = Math.min(r, h, w / 2);
    return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
  };
  const rightRounded = (x, y, w, h, r) => {
    r = Math.min(r, w, h / 2);
    return `M${x},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h - r}Q${x + w},${y + h} ${x + w - r},${y + h}H${x}Z`;
  };
  function hover(target, tp, html, x, y) {
    target.style.cursor = 'default';
    target.addEventListener('pointerenter', () => tp.show(html, x, y));
    target.addEventListener('pointerleave', () => tp.hide());
  }

  /* ---------- Fig 1: largest IPOs (horizontal bars) ---------- */
  function ipo(box, W) {
    const D = [
      { n: 'Anthropic', d: 'Nov 2026', v: 81.34, hi: 1 },
      { n: 'SpaceX', d: 'Jun 2026', v: 75, opt: 10.7 },
      { n: 'Saudi Aramco', d: 'Dec 2019', v: 25.6 },
      { n: 'Alibaba', d: 'Sep 2014', v: 21.8 },
    ];
    const nar = W < 540, L = nar ? 94 : 128, R = nar ? 62 : 80, rowH = nar ? 56 : 64, T = 4, B = 26;
    const H = T + D.length * rowH + B;
    const s = root(box, W, H, 'Largest IPOs by gross base offering: Anthropic $81.34B, SpaceX $75B, Saudi Aramco $25.6B, Alibaba $21.8B.');
    const tp = tipper(box), hp = hatch(s, 'h-ipo', C.ctxDark);
    const x = v => L + (W - L - R) * v / 90;
    [0, 20, 40, 60, 80].forEach(g => {
      el('line', { x1: x(g), x2: x(g), y1: T, y2: H - B + 4, stroke: g ? C.grid : C.axis, 'stroke-width': 1 }, s);
      tx(s, x(g), H - 6, g ? `$${g}B` : '$0', { 'text-anchor': 'middle', 'font-family': MONO, 'font-size': 10.5, fill: C.muted });
    });
    D.forEach((r, i) => {
      const yc = T + i * rowH + rowH / 2 - (r.opt ? 6 : 0), bh = nar ? 18 : 22, y = yc - bh / 2;
      tx(s, L - 12, yc - 1, r.n, { 'text-anchor': 'end', 'font-size': nar ? 12.5 : 14, 'font-weight': r.hi ? 700 : 500, fill: C.ink });
      tx(s, L - 12, yc + 14, r.d, { 'text-anchor': 'end', 'font-family': MONO, 'font-size': 10.5, fill: C.muted });
      if (r.opt) {
        el('rect', { x: x(0), y, width: x(r.v) - x(0), height: bh, fill: C.ctx }, s);
        el('path', { d: rightRounded(x(r.v) + 2, y, x(r.v + r.opt) - x(r.v) - 2, bh, 4), fill: hp, stroke: C.ctxDark, 'stroke-width': 1 }, s);
        tx(s, x(r.v + r.opt), y + bh + 15, `+$${r.opt}B option → $85.7B`, { 'text-anchor': 'end', 'font-family': MONO, 'font-size': 10, fill: C.muted });
      } else {
        el('path', { d: rightRounded(x(0), y, x(r.v) - x(0), bh, 4), fill: r.hi ? C.rust : C.ctx }, s);
      }
      const end = x(r.v + (r.opt || 0));
      tx(s, end + 9, yc + 5, `$${r.v}B`, { 'font-size': nar ? 13 : 15, 'font-weight': 700, fill: C.ink });
      const hit = el('rect', { x: 0, y: T + i * rowH, width: W, height: rowH, fill: 'transparent' }, s);
      hover(hit, tp, `<b>${r.n}</b> · ${r.d}<br>$${r.v}B gross base offering` +
        (r.opt ? `<br>+$${r.opt}B over-allotment → $85.7B` : '') +
        (r.hi ? '<br>~$93.5B if the 147M-share option is fully exercised' : ''), end, y);
    });
  }

  /* ---------- Fig 2: revenue run-rate (log line) ---------- */
  function runrate(box, W) {
    const P = [
      ['Jan 2024', 2024.0, 0.087, '$87M'], ['May 2025', 2025.41, 3, '$3B'], ['Aug 2025', 2025.58, 5, '$5B'],
      ['Oct 2025', 2025.79, 7, '$7B'], ['Dec 2025', 2025.99, 9, '$9B'], ['Feb 2026', 2026.12, 14, '$14B'],
      ['Apr 2026', 2026.27, 30, '$30B'], ['May 2026', 2026.38, 47, '$47B'], ['Jul 2026', 2026.54, 65, '$65B'],
      ['Oct 31, 2026', 2026.83, 81, '$81B'],
    ];
    const nar = W < 540, H = nar ? 310 : 400;
    const M = { l: nar ? 46 : 58, r: nar ? 16 : 30, t: 18, b: 30 };
    const t0 = 2023.92, t1 = 2027.0, lo = Math.log10(0.04), hi = Math.log10(170);
    const x = t => M.l + (W - M.l - M.r) * (t - t0) / (t1 - t0);
    const y = v => M.t + (H - M.t - M.b) * (1 - (Math.log10(v) - lo) / (hi - lo));
    const s = root(box, W, H, 'Line chart, log scale: Anthropic annualized revenue run-rate rose from $87M in January 2024 to $81B in October 2026.');
    const tp = tipper(box);
    const defs = el('defs', {}, s);
    const g = el('linearGradient', { id: 'g-rr', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el('stop', { offset: 0, 'stop-color': C.rust, 'stop-opacity': 0.2 }, g);
    el('stop', { offset: 1, 'stop-color': C.rust, 'stop-opacity': 0 }, g);

    [0.1, 1, 10, 100].forEach(v => {
      el('line', { x1: M.l, x2: W - M.r, y1: y(v), y2: y(v), stroke: C.grid }, s);
      tx(s, M.l - 8, y(v) + 4, v < 1 ? '$0.1B' : `$${v}B`, { 'text-anchor': 'end', 'font-family': MONO, 'font-size': 10.5, fill: C.muted });
    });
    const xt = nar ? [[2024, '2024'], [2025, '2025'], [2026, '2026'], [2027, '2027']]
      : [[2024, 'Jan 2024'], [2024.5, 'Jul 2024'], [2025, 'Jan 2025'], [2025.5, 'Jul 2025'], [2026, 'Jan 2026'], [2026.5, 'Jul 2026'], [2027, 'Jan 2027']];
    el('line', { x1: M.l, x2: W - M.r, y1: H - M.b, y2: H - M.b, stroke: C.axis }, s);
    xt.forEach(([t, l]) => {
      el('line', { x1: x(t), x2: x(t), y1: H - M.b, y2: H - M.b + 4, stroke: C.axis }, s);
      tx(s, x(t), H - 9, l, { 'text-anchor': 'middle', 'font-family': MONO, 'font-size': 10.5, fill: C.muted });
    });
    // IPO marker
    const xi = x(2026.885);
    el('line', { x1: xi, x2: xi, y1: M.t, y2: H - M.b, stroke: C.axis, 'stroke-dasharray': '3 4' }, s);
    tx(s, xi + 5, M.t + 10, 'IPO', { 'font-family': MONO, 'font-size': 10, fill: C.muted, 'font-weight': 700 });

    const pts = P.map(p => [x(p[1]), y(p[2])]);
    const base = H - M.b;
    el('path', { d: `M${pts.map(p => p.join(',')).join('L')}L${pts[pts.length - 1][0]},${base}L${pts[0][0]},${base}Z`, fill: 'url(#g-rr)' }, s);
    el('line', { x1: pts[0][0], y1: pts[0][1], x2: pts[1][0], y2: pts[1][1], stroke: C.rust, 'stroke-width': 2, 'stroke-dasharray': '5 5', 'stroke-opacity': 0.7 }, s);
    el('path', { d: 'M' + pts.slice(1).map(p => p.join(',')).join('L'), fill: 'none', stroke: C.rust, 'stroke-width': 2.75, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, s);
    pts.forEach(p => el('circle', { cx: p[0], cy: p[1], r: 4.5, fill: C.rust, stroke: C.surface, 'stroke-width': 2 }, s));

    const lab = (i, pos) => {
      const [px, py] = pts[i], [, , , v] = P[i], d = P[i][0].replace('Oct 31, 2026', 'Oct 2026');
      const left = pos === 'al', dx = left ? -10 : 10, a = left ? 'end' : 'start';
      const y1 = left ? py - 24 : py + 20, y2 = left ? py - 10 : py + 34;
      if (nar && i === 0) { tx(s, px + 9, py + 4, v, { 'font-size': 12.5, 'font-weight': 700, fill: C.ink }); return; }
      tx(s, px + dx, y1, v, { 'text-anchor': a, 'font-size': nar ? 12.5 : 14, 'font-weight': 700, fill: C.ink });
      tx(s, px + dx, y2, d, { 'text-anchor': a, 'font-family': MONO, 'font-size': 10.5, fill: C.muted });
    };
    lab(0, 'br'); lab(1, 'br'); if (!nar) lab(4, 'al'); lab(6, 'al'); lab(9, 'al');

    // story callout
    if (nar) {
      tx(s, x(2024.0), y(15), '~930x in 33 months', { 'font-family': SERIF, 'font-style': 'italic', 'font-weight': 600, 'font-size': 16, fill: C.rust });
    } else {
      tx(s, x(2024.12), y(30), '~930x in 33 months', { 'font-family': SERIF, 'font-style': 'italic', 'font-weight': 600, 'font-size': 22, fill: C.rust });
      tx(s, x(2024.12), y(30) + 20, 'run-rate, Jan 2024 → Oct 2026', { 'font-family': MONO, 'font-size': 10.5, fill: C.muted });
    }

    // crosshair hover
    const cross = el('line', { y1: M.t, y2: H - M.b, stroke: C.ink, 'stroke-opacity': 0.25, visibility: 'hidden' }, s);
    const ring = el('circle', { r: 8, fill: 'none', stroke: C.rust, 'stroke-width': 2, visibility: 'hidden' }, s);
    const ov = el('rect', { x: M.l, y: M.t, width: W - M.l - M.r, height: H - M.t - M.b, fill: 'transparent' }, s);
    const move = e => {
      const r = s.getBoundingClientRect(), mx = e.clientX - r.left;
      let k = 0; pts.forEach((p, i) => { if (Math.abs(p[0] - mx) < Math.abs(pts[k][0] - mx)) k = i; });
      const [px, py] = pts[k];
      cross.setAttribute('x1', px); cross.setAttribute('x2', px); cross.setAttribute('visibility', 'visible');
      ring.setAttribute('cx', px); ring.setAttribute('cy', py); ring.setAttribute('visibility', 'visible');
      tp.show(`<b>${P[k][0]}</b><br>${P[k][3]} annualized run-rate`, px, py);
    };
    ov.addEventListener('pointermove', move);
    ov.addEventListener('pointerdown', move);
    ov.addEventListener('pointerleave', () => { tp.hide(); cross.setAttribute('visibility', 'hidden'); ring.setAttribute('visibility', 'hidden'); });
  }

  /* ---------- Column chart (Figs 3 and 5) ---------- */
  function columns(box, W, o) {
    const nar = W < 540, n = o.data.length;
    const M = { l: nar ? 44 : 56, r: 6, t: (o.growth ? 52 : 26) + (o.noteTop ? 14 : 0), b: 46 };
    const H = (nar ? 310 : 390) + (o.growth ? 26 : 0);
    const s = root(box, W, H, o.label);
    const tp = tipper(box), hp = hatch(s, 'h-' + o.id, C.rust, '#fff');
    const band = (W - M.l - M.r) / n, bw = Math.min(band * (nar ? 0.68 : 0.58), 96);
    const y = v => H - M.b - (H - M.t - M.b) * v / o.max;
    const cx = i => M.l + band * i + band / 2;
    o.ticks.forEach(t => {
      el('line', { x1: M.l, x2: W - M.r, y1: y(t), y2: y(t), stroke: t ? C.grid : C.axis }, s);
      tx(s, M.l - 8, y(t) + 4, o.fmt(t), { 'text-anchor': 'end', 'font-family': MONO, 'font-size': 10.5, fill: C.muted });
    });
    if (o.callout) {
      tx(s, M.l + 10, y(o.callout.at), o.callout.text, { 'font-family': SERIF, 'font-style': 'italic', 'font-weight': 600, 'font-size': nar ? 17 : 22, fill: C.rust });
      tx(s, M.l + 10, y(o.callout.at) + 20, o.callout.sub, { 'font-family': MONO, 'font-size': 10.5, fill: C.muted });
    }
    o.data.forEach((d, i) => {
      const bx = cx(i) - bw / 2, by = y(d.v), bh = y(0) - by;
      if (d.kind === 'est') el('path', { d: topRounded(bx + 0.75, by + 0.75, bw - 1.5, bh - 0.75, 4), fill: hp, stroke: C.rust, 'stroke-width': 1.5 }, s);
      else el('path', { d: topRounded(bx, by, bw, bh, 4), fill: d.kind === 'hi' ? C.rust : C.ctx }, s);
      tx(s, cx(i), by - 8, d.lab, { 'text-anchor': 'middle', 'font-size': nar ? 11 : 14, 'font-weight': 700, fill: C.ink });
      if (d.note && !nar) tx(s, cx(i), by - 26, d.note, { 'text-anchor': 'middle', 'font-family': MONO, 'font-size': 10, fill: C.muted });
      tx(s, cx(i), H - M.b + 18, nar ? d.as : d.a, { 'text-anchor': 'middle', 'font-size': nar ? 11 : 12.5, 'font-weight': 600, fill: C.ink });
      tx(s, cx(i), H - M.b + 33, nar ? d.bs : d.b, { 'text-anchor': 'middle', 'font-family': MONO, 'font-size': nar ? 9.5 : 10.5, fill: C.muted });
      const hit = el('rect', { x: cx(i) - band / 2, y: M.t - 10, width: band, height: H - M.t - M.b + 10, fill: 'transparent' }, s);
      hover(hit, tp, d.tip, cx(i), by);
    });
    if (o.growth) {
      const gy = 16;
      tx(s, M.l, gy - 2, nar ? 'vs. prior quarter' : 'Growth vs. prior quarter', { 'font-family': MONO, 'font-size': 10, fill: C.muted, 'letter-spacing': '.04em' });
      o.growth.forEach((g, i) => {
        if (g == null) return;
        const last = i === o.growth.length - 1, gx = (cx(i - 1) + cx(i)) / 2, label = `+${g}%`;
        const w = label.length * (nar ? 7 : 7.6) + 14;
        el('rect', { x: gx - w / 2, y: gy + 8, width: w, height: 22, rx: 11, fill: last ? C.rust : '#fff', stroke: last ? C.rust : C.axis }, s);
        tx(s, gx, gy + 23, label, { 'text-anchor': 'middle', 'font-family': MONO, 'font-size': nar ? 10.5 : 11.5, 'font-weight': 700, fill: last ? '#fff' : C.soft });
      });
    }
  }
  function valuation(box, W) {
    columns(box, W, {
      id: 'val', max: 2200, ticks: [0, 500, 1000, 1500, 2000],
      fmt: v => (v === 0 ? '$0' : v < 1000 ? `$${v}B` : `$${v / 1000}T`),
      label: 'Column chart: Anthropic valuation by round, from $4.1B at the 2023 Series C to $1.5T at the IPO price and about $2.0T at the first trade.',
      callout: { at: 1850, text: '~365x in 3.5 years', sub: 'Series C → IPO price' },
      data: [
        { a: 'Series C', b: 'May 2023', as: 'C', bs: '5/23', v: 4.1, lab: '$4.1B', tip: '<b>Series C</b> · May 2023<br>~$4.1B (reported by The Information)' },
        { a: 'Series E', b: 'Mar 2025', as: 'E', bs: '3/25', v: 61.5, lab: '$61.5B', tip: '<b>Series E</b> · Mar 2025<br>$61.5B post-money' },
        { a: 'Series F', b: 'Sep 2025', as: 'F', bs: '9/25', v: 183, lab: '$183B', tip: '<b>Series F</b> · Sep 2025<br>$183B post-money' },
        { a: 'Series G', b: 'Feb 2026', as: 'G', bs: '2/26', v: 380, lab: '$380B', tip: '<b>Series G</b> · Feb 2026<br>$380B post-money' },
        { a: 'Series H', b: 'May 2026', as: 'H', bs: '5/26', v: 965, lab: '$965B', tip: '<b>Series H</b> · May 2026<br>$965B post-money' },
        { a: 'IPO price', b: '$83 · Nov 18', as: 'IPO', bs: '11/18', v: 1500, lab: '$1.5T', kind: 'hi', note: '1.55x Series H', tip: '<b>IPO price $83</b> · Nov 18<br>~$1.5T fully diluted equity value' },
        { a: 'First trade', b: '$111.50 · Nov 19', as: 'Open', bs: '11/19', v: 2017, lab: '~$2.0T', kind: 'est', note: 'estimate', tip: '<b>First trade $111.50</b> · Nov 19<br>~$2.02T (estimate: $1.5T × $111.50 ÷ $83)' },
      ],
    });
  }
  function quarterly(box, W) {
    columns(box, W, {
      id: 'qr', max: 20, ticks: [0, 5, 10, 15, 20], fmt: v => (v ? `$${v}B` : '$0'),
      label: 'Column chart: Anthropic quarterly revenue from $1.38B in Q3 2025 to $16.96B in Q3 2026; growth vs. prior quarter +48%, +132%, +144%, +47%.',
      growth: [null, 48, 132, 144, 47],
      data: [
        { a: 'Q3 2025', b: 'Jul–Sep', as: 'Q3', bs: "'25", v: 1.382, lab: '$1.38B', tip: '<b>Q3 2025</b><br>$1.382B revenue' },
        { a: 'Q4 2025', b: 'Oct–Dec', as: 'Q4', bs: "'25", v: 2.04, lab: '$2.04B', tip: '<b>Q4 2025</b><br>$2.040B revenue · +48% q/q' },
        { a: 'Q1 2026', b: 'Jan–Mar', as: 'Q1', bs: "'26", v: 4.731, lab: '$4.73B', tip: '<b>Q1 2026</b><br>$4.731B revenue · +132% q/q' },
        { a: 'Q2 2026', b: 'Apr–Jun', as: 'Q2', bs: "'26", v: 11.555, lab: '$11.6B', tip: '<b>Q2 2026</b><br>$11.555B revenue · +144% q/q' },
        { a: 'Q3 2026', b: 'Jul–Sep', as: 'Q3', bs: "'26", v: 16.956, lab: '$17.0B', kind: 'hi', note: '≈12.3x Q3 2025', tip: '<b>Q3 2026</b><br>$16.956B revenue · +47% q/q<br>≈12.3x the same quarter a year earlier' },
      ],
    });
  }

  /* ---------- Fig 4 / banner: the exponential gap (conceptual) ---------- */
  function gap(box, W, opt) {
    opt = opt || {};
    const big = opt.banner || W >= 540;
    const H = opt.H || (big ? 400 : 290);
    const M = { l: opt.l != null ? opt.l : 34, r: big ? (opt.r != null ? opt.r : 172) : 14, t: opt.t != null ? opt.t : 14, b: 34 };
    const pw = W - M.l - M.r, ph = H - M.t - M.b;
    const X = t => M.l + pw * t, Y = v => M.t + ph * (1 - v);
    const biz = t => 0.1 + 0.24 * t, tech = t => 0.012 * Math.exp(4.17 * t), fr = t => 0.012 * Math.exp(4.9 * t);
    const s = root(box, W, H, 'Conceptual chart: technology capability compounds exponentially while a typical business improves linearly; the gap between them widens, and frontier AI labs push the curve itself. Not to scale.');
    const defs = el('defs', {}, s);
    const g = el('linearGradient', { id: 'g-gap' + (opt.banner ? 'b' : ''), x1: 0, y1: 0, x2: 1, y2: 0 }, defs);
    el('stop', { offset: 0, 'stop-color': C.blue, 'stop-opacity': 0.04 }, g);
    el('stop', { offset: 1, 'stop-color': C.blue, 'stop-opacity': 0.2 }, g);
    const N = 160, ts = Array.from({ length: N + 1 }, (_, i) => i / N);
    let tc = 0; while (tech(tc) < biz(tc)) tc += 0.002;
    const up = ts.filter(t => t >= tc), down = up.slice().reverse();
    el('path', { d: 'M' + up.map(t => `${X(t)},${Y(tech(t))}`).join('L') + 'L' + down.map(t => `${X(t)},${Y(biz(t))}`).join('L') + 'Z', fill: `url(#${g.id})` }, s);
    // axes
    el('line', { x1: M.l, x2: M.l, y1: M.t, y2: H - M.b, stroke: C.axis }, s);
    el('line', { x1: M.l, x2: X(1) + 8, y1: H - M.b, y2: H - M.b, stroke: C.axis }, s);
    tx(s, X(1) + 8, H - 12, 'Time →', { 'text-anchor': 'end', 'font-family': MONO, 'font-size': 11, fill: C.muted });
    tx(s, 0, 0, 'Capability →', { 'text-anchor': 'end', 'font-family': MONO, 'font-size': 11, fill: C.muted, transform: `translate(${M.l - 12},${M.t}) rotate(-90)` });
    const line = (f, tmax, a) => el('path', Object.assign({ d: 'M' + ts.filter(t => t <= tmax).map(t => `${X(t)},${Y(Math.min(f(t), 1.02))}`).join('L'), fill: 'none', 'stroke-width': 3.25, 'stroke-linecap': 'round' }, a), s);
    line(biz, 1, { stroke: C.ctxDark });
    line(tech, 1, { stroke: C.blue });
    line(fr, Math.log(1.02 / 0.012) / 4.9, { stroke: C.rust, 'stroke-dasharray': '10 8' });
    el('circle', { cx: X(1), cy: Y(tech(1)), r: 5, fill: C.blue, stroke: '#fff', 'stroke-width': 2 }, s);
    el('circle', { cx: X(1), cy: Y(biz(1)), r: 5, fill: C.ctxDark, stroke: '#fff', 'stroke-width': 2 }, s);
    // gap label: a bracket between the two end points, labelled in the margin
    if (big) {
      const bx = X(1) + 12, y1 = Y(tech(1)) + 30, y2 = Y(biz(1)) - 24, ym = (y1 + y2) / 2;
      el('path', { d: `M${bx},${y1}h6V${y2}h-6M${bx + 6},${ym}h6`, fill: 'none', stroke: C.blue, 'stroke-width': 1.5 }, s);
      tx(s, bx + 18, ym - 8, 'THE GAP', { 'font-family': MONO, 'font-size': 12.5, 'font-weight': 700, fill: C.blue, 'letter-spacing': '.12em' });
      tx(s, bx + 18, ym + 9, 'where AI-native', { 'font-size': 12.5, 'font-weight': 600, fill: C.blue });
      tx(s, bx + 18, ym + 25, 'startups win', { 'font-size': 12.5, 'font-weight': 600, fill: C.blue });
    }
    if (big) {
      const fs = opt.banner ? 15 : 14;
      tx(s, X(1) + 14, Y(tech(1)) + 0, 'Technology', { 'font-size': fs, 'font-weight': 700, fill: C.blue });
      tx(s, X(1) + 14, Y(tech(1)) + 17, '(exponential)', { 'font-size': fs - 2, fill: C.blue });
      tx(s, X(1) + 14, Y(biz(1)) + 0, 'Typical business', { 'font-size': fs, 'font-weight': 700, fill: C.soft });
      tx(s, X(1) + 14, Y(biz(1)) + 17, '(linear)', { 'font-size': fs - 2, fill: C.soft });
      const tf = Math.log(0.8 / 0.012) / 4.9;
      tx(s, X(tf) - 14, Y(0.8), 'Frontier AI labs push the curve', { 'text-anchor': 'end', 'font-size': fs, 'font-weight': 700, fill: C.rust });
      tx(s, X(tf) - 14, Y(0.8) + 17, '(Anthropic, OpenAI…)', { 'text-anchor': 'end', 'font-size': fs - 2, fill: C.rust });
    }
  }

  const charts = { ipo, runrate, valuation, quarterly, gap };
  function render(box, force) {
    const W = Math.round(box.clientWidth);
    if (!W || (!force && box._w === W)) return;
    box._w = W;
    charts[box.dataset.chart](box, W, box.dataset.banner ? { banner: true, H: +box.dataset.h, r: +box.dataset.r, l: +box.dataset.l, t: +box.dataset.t } : undefined);
  }
  function init() {
    const boxes = Array.from(document.querySelectorAll('.viz-plot[data-chart]'));
    boxes.forEach(b => render(b));
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(es => es.forEach(e => render(e.target)));
      boxes.forEach(b => ro.observe(b));
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => boxes.forEach(b => render(b, true)));
  }
  window.IPOCharts = { charts, render, init };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
