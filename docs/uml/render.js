// Renders a UML class diagram model (stageN.model.js) to SVG.
// Usage: node render.js stage1.model.js stage1.svg
// The model lists classes with manual positions, relationships and notes.
'use strict';
const fs = require('fs');
const path = require('path');

const FONT = "Consolas, 'Courier New', monospace";
const CHAR_W = 6.6;      // width of one 11px monospace character
const LINE_H = 14;
const PAD = 6;

const PKG_STYLE = {
  boundary: { fill: '#eef7ee', stroke: '#7aa97a', head: '#d6ecd6', label: 'boundary' },
  control: { fill: '#eef3fb', stroke: '#7d97c4', head: '#d8e3f5', label: 'control' },
  entity: { fill: '#fdf8ea', stroke: '#c9ad62', head: '#f5e9c4', label: 'entity' },
  app: { fill: '#f4f4f4', stroke: '#999999', head: '#e6e6e6', label: '(default)' },
};

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function memberText(m) {
  let text = m, italic = false, underline = false;
  if (text.startsWith('*')) { italic = true; text = text.slice(1); }
  if (text.startsWith('$')) { underline = true; text = text.slice(1); }
  text = text.replace(/^ +/, (s) => ' '.repeat(s.length)); // keep indentation of wrapped lines
  return { text, italic, underline };
}

function layoutClass(c) {
  const header = [];
  if (c.stereo) header.push('«' + c.stereo + '»');
  header.push(c.name);
  const attrs = (c.attrs || []).map(memberText);
  const ops = (c.ops || []).map(memberText);
  const longest = Math.max(
    ...header.map((h) => h.length * 7.2),
    ...attrs.map((a) => a.text.length * CHAR_W),
    ...ops.map((o) => o.text.length * CHAR_W), 60);
  c.w = c.w || Math.ceil(longest + PAD * 2);
  c.headH = header.length * 15 + 8;
  c.attrH = attrs.length ? attrs.length * LINE_H + PAD : 8;
  c.opsH = c.ops === undefined ? 0 : (ops.length ? ops.length * LINE_H + PAD : 8);
  c.h = c.headH + c.attrH + c.opsH;
  c._header = header; c._attrs = attrs; c._ops = ops;
}

function anchor(c, side, frac) {
  const f = frac === undefined ? 0.5 : frac;
  switch (side) {
    case 'top': return [c.x + c.w * f, c.y];
    case 'bottom': return [c.x + c.w * f, c.y + c.h];
    case 'left': return [c.x, c.y + c.h * f];
    case 'right': return [c.x + c.w, c.y + c.h * f];
    default: throw new Error('bad side ' + side);
  }
}

const vertical = (s) => s === 'top' || s === 'bottom';

function route(a, as, b, bs, via, points) {
  if (points) return [a, ...points, b];
  if (vertical(as) && vertical(bs)) {
    if (Math.abs(a[0] - b[0]) < 0.5) return [a, b];
    const mid = via !== undefined ? via : (a[1] + b[1]) / 2;
    return [a, [a[0], mid], [b[0], mid], b];
  }
  if (!vertical(as) && !vertical(bs)) {
    if (Math.abs(a[1] - b[1]) < 0.5) return [a, b];
    const mid = via !== undefined ? via : (a[0] + b[0]) / 2;
    return [a, [mid, a[1]], [mid, b[1]], b];
  }
  if (vertical(as)) return [a, [a[0], b[1]], b];
  return [a, [b[0], a[1]], b];
}

function multLabel(p, side, text, out, at) {
  if (!text) return;
  if (at) { out.push(`<text x="${at[0]}" y="${at[1]}" font-family="${FONT}" font-size="11" fill="#333">${esc(text)}</text>`); return; }
  let x = p[0], y = p[1], anchorAttr = 'start';
  if (side === 'top') { x += 5; y -= 5; }
  if (side === 'bottom') { x += 5; y += 13; }
  if (side === 'left') { x -= 5; y -= 5; anchorAttr = 'end'; }
  if (side === 'right') { x += 5; y -= 5; }
  out.push(`<text x="${x}" y="${y}" font-family="${FONT}" font-size="11" text-anchor="${anchorAttr}" fill="#333">${esc(text)}</text>`);
}

function render(model) {
  const byId = {};
  for (const c of model.classes) { layoutClass(c); byId[c.id] = c; }
  const out = [];
  const W = model.width, H = model.height;
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`);
  out.push(`<defs>
  <marker id="tri" viewBox="0 0 12 12" refX="12" refY="6" markerWidth="14" markerHeight="14" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0,0 L12,6 L0,12 z" fill="#fff" stroke="#333" stroke-width="1.2"/></marker>
  <marker id="open" viewBox="0 0 12 12" refX="12" refY="6" markerWidth="11" markerHeight="11" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0,1 L12,6 L0,11" fill="none" stroke="#333" stroke-width="1.3"/></marker>
  <marker id="dfill" viewBox="0 0 16 10" refX="16" refY="5" markerWidth="18" markerHeight="11" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0,5 L8,0 L16,5 L8,10 z" fill="#333" stroke="#333"/></marker>
  <marker id="dhollow" viewBox="0 0 16 10" refX="16" refY="5" markerWidth="18" markerHeight="11" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0,5 L8,0 L16,5 L8,10 z" fill="#fff" stroke="#333"/></marker>
</defs>`);
  out.push(`<rect width="${W}" height="${H}" fill="#ffffff"/>`);
  out.push(`<text x="16" y="28" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="bold" fill="#222">${esc(model.title)}</text>`);
  if (model.subtitle) {
    out.push(`<text x="16" y="48" font-family="Segoe UI, Arial, sans-serif" font-size="12" fill="#555">${esc(model.subtitle)}</text>`);
  }

  // Package frames
  for (const pkg of model.packages || []) {
    const members = model.classes.filter((c) => c.pkg === pkg.id);
    const st = PKG_STYLE[pkg.id];
    const x0 = Math.min(...members.map((c) => c.x)) - 14;
    const y0 = Math.min(...members.map((c) => c.y)) - 30;
    const x1 = Math.max(...members.map((c) => c.x + c.w)) + 14 + (pkg.extraRight || 0);
    const y1 = Math.max(...members.map((c) => c.y + c.h)) + 14 + (pkg.extraBottom || 0);
    out.push(`<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" rx="6" fill="${st.fill}" stroke="${st.stroke}" stroke-width="1.2"/>`);
    out.push(`<rect x="${x0}" y="${y0}" width="${pkg.name.length * 7.5 + 20}" height="20" rx="4" fill="${st.head}" stroke="${st.stroke}"/>`);
    out.push(`<text x="${x0 + 10}" y="${y0 + 14}" font-family="Segoe UI, Arial, sans-serif" font-size="12" font-weight="bold" fill="#333">${esc(pkg.name)}</text>`);
  }

  // Edges (drawn before classes so boxes sit on top)
  for (const e of model.edges) {
    const a = byId[e.from], b = byId[e.to];
    if (!a || !b) throw new Error('unknown class in edge ' + e.from + ' -> ' + e.to);
    const pa = anchor(a, e.fs, e.fo), pb = anchor(b, e.ts, e.too);
    const pts = route(pa, e.fs, pb, e.ts, e.via, e.points);
    let dash = '', ms = '', me = '';
    switch (e.kind) {
      case 'inherit': me = 'url(#tri)'; break;
      case 'realize': me = 'url(#tri)'; dash = '6,4'; break;
      case 'compose': ms = 'url(#dfill)'; if (e.nav) me = 'url(#open)'; break;
      case 'aggregate': ms = 'url(#dhollow)'; if (e.nav) me = 'url(#open)'; break;
      case 'assoc': if (e.nav !== false) me = 'url(#open)'; break;
      case 'bi': break;
      case 'dep': me = 'url(#open)'; dash = '5,4'; break;
      default: throw new Error('bad kind ' + e.kind);
    }
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
    out.push(`<path d="${d}" fill="none" stroke="#333" stroke-width="1.2"${dash ? ` stroke-dasharray="${dash}"` : ''}${ms ? ` marker-start="${ms}"` : ''}${me ? ` marker-end="${me}"` : ''}/>`);
    multLabel(pa, e.fs, e.fm, out, e.fmAt);
    multLabel(pb, e.ts, e.tm, out, e.tmAt);
    if (e.label) {
      let lx, ly;
      if (e.labelAt) { [lx, ly] = e.labelAt; } else {
        const i = Math.floor((pts.length - 1) / 2);
        lx = (pts[i][0] + pts[i + 1][0]) / 2; ly = (pts[i][1] + pts[i + 1][1]) / 2;
      }
      const w = e.label.length * 6.2 + 6;
      out.push(`<rect x="${lx - w / 2}" y="${ly - 9}" width="${w}" height="13" fill="#fff" opacity="0.9"/>`);
      out.push(`<text x="${lx}" y="${ly + 1}" font-family="Segoe UI, Arial, sans-serif" font-size="10.5" font-style="italic" text-anchor="middle" fill="#444">${esc(e.label)}</text>`);
    }
  }

  // Classes
  for (const c of model.classes) {
    const st = PKG_STYLE[c.pkg] || PKG_STYLE.app;
    const highlight = c.isNew ? ' stroke="#c0392b" stroke-width="2.2"' : ' stroke="#333" stroke-width="1.2"';
    out.push(`<rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" fill="#fff"${highlight}/>`);
    out.push(`<rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.headH}" fill="${st.head}"${highlight}/>`);
    c._header.forEach((h, i) => {
      const isName = i === c._header.length - 1;
      out.push(`<text x="${c.x + c.w / 2}" y="${c.y + 16 + i * 15}" font-family="Segoe UI, Arial, sans-serif" font-size="${isName ? 13 : 11}" text-anchor="middle"${isName ? ' font-weight="bold"' : ''}${isName && c.abstract ? ' font-style="italic"' : ''} fill="#111">${esc(h)}</text>`);
    });
    let y = c.y + c.headH;
    out.push(`<line x1="${c.x}" y1="${y}" x2="${c.x + c.w}" y2="${y}" stroke="#333"/>`);
    c._attrs.forEach((m, i) => {
      out.push(`<text x="${c.x + PAD}" y="${y + 13 + i * LINE_H}" font-family="${FONT}" font-size="11"${m.italic ? ' font-style="italic"' : ''}${m.underline ? ' text-decoration="underline"' : ''} fill="#111">${esc(m.text)}</text>`);
    });
    if (c.ops !== undefined) {
      y += c.attrH;
      out.push(`<line x1="${c.x}" y1="${y}" x2="${c.x + c.w}" y2="${y}" stroke="#333"/>`);
      c._ops.forEach((m, i) => {
        out.push(`<text x="${c.x + PAD}" y="${y + 13 + i * LINE_H}" font-family="${FONT}" font-size="11"${m.italic ? ' font-style="italic"' : ''}${m.underline ? ' text-decoration="underline"' : ''} fill="#111">${esc(m.text)}</text>`);
      });
    }
  }

  // Notes
  for (const n of model.notes || []) {
    const h = n.lines.length * 13 + 10;
    const w = n.w || Math.ceil(Math.max(...n.lines.map((l) => l.length)) * 6 + 16);
    const target = byId[n.to];
    if (target) {
      const ns = n.ns || 'left';
      const nx = ns === 'left' ? n.x : ns === 'right' ? n.x + w : n.x + w / 2;
      const ny = ns === 'top' ? n.y : ns === 'bottom' ? n.y + h : n.y + h / 2;
      const [cx, cy] = anchor(target, n.cs || 'right', n.co);
      out.push(`<line x1="${nx}" y1="${ny}" x2="${cx}" y2="${cy}" stroke="#8a6d00" stroke-dasharray="3,3"/>`);
    }
    const f = 10;
    out.push(`<path d="M${n.x},${n.y} L${n.x + w - f},${n.y} L${n.x + w},${n.y + f} L${n.x + w},${n.y + h} L${n.x},${n.y + h} z" fill="#fff8c4" stroke="#8a6d00"/>`);
    out.push(`<path d="M${n.x + w - f},${n.y} L${n.x + w - f},${n.y + f} L${n.x + w},${n.y + f}" fill="none" stroke="#8a6d00"/>`);
    n.lines.forEach((l, i) => {
      const bold = i === 0 && n.boldFirst !== false;
      out.push(`<text x="${n.x + 6}" y="${n.y + 15 + i * 13}" font-family="Segoe UI, Arial, sans-serif" font-size="10.5"${bold ? ' font-weight="bold"' : ''} fill="#3d3000">${esc(l)}</text>`);
    });
  }

  // Legend
  if (model.legend) {
    const [lx, ly] = model.legend;
    const items = [
      ['inherit', 'generalisation (extends)'], ['realize', 'realisation (implements)'],
      ['compose', 'composition (owns)'], ['aggregate', 'aggregation (has)'],
      ['assoc', 'association (navigable)'], ['dep', 'dependency (uses / creates)'],
    ];
    out.push(`<rect x="${lx}" y="${ly}" width="250" height="${items.length * 18 + 52 + (model.legendNew ? 18 : 0)}" fill="#fff" stroke="#999"/>`);
    out.push(`<text x="${lx + 8}" y="${ly + 16}" font-family="Segoe UI, Arial, sans-serif" font-size="12" font-weight="bold">Legend</text>`);
    items.forEach(([k, label], i) => {
      const y = ly + 34 + i * 18;
      const dash = k === 'realize' || k === 'dep' ? ' stroke-dasharray="5,4"' : '';
      const ms = k === 'compose' ? ' marker-start="url(#dfill)"' : k === 'aggregate' ? ' marker-start="url(#dhollow)"' : '';
      const me = k === 'inherit' || k === 'realize' ? ' marker-end="url(#tri)"' : (k === 'assoc' || k === 'dep') ? ' marker-end="url(#open)"' : '';
      out.push(`<path d="M${lx + 10},${y} L${lx + 70},${y}" stroke="#333" stroke-width="1.2" fill="none"${dash}${ms}${me}/>`);
      out.push(`<text x="${lx + 80}" y="${y + 4}" font-family="Segoe UI, Arial, sans-serif" font-size="11">${label}</text>`);
    });
    const y = ly + 34 + items.length * 18;
    out.push(`<text x="${lx + 10}" y="${y + 4}" font-family="${FONT}" font-size="11">+ public  - private  # protected  ~ package</text>`);
    if (model.legendNew) {
      out.push(`<rect x="${lx + 10}" y="${y + 10}" width="22" height="10" fill="#fff" stroke="#c0392b" stroke-width="2"/>`);
      out.push(`<text x="${lx + 40}" y="${y + 19}" font-family="Segoe UI, Arial, sans-serif" font-size="11">${esc(model.legendNew)}</text>`);
    }
  }
  out.push('</svg>');
  return out.join('\n');
}

const [, , modelFile, outFile] = process.argv;
const model = require(path.resolve(modelFile));
fs.writeFileSync(outFile, render(model));
console.log('Wrote ' + outFile);
