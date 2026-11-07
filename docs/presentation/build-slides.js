// Builds RestaurantRush_Presentation.pptx. Speaker notes come from script.js.
// Usage: node build-slides.js <folder containing node_modules with pptxgenjs and apply_theme.js>
'use strict';
const path = require('path');
const lib = process.argv[2];
const pptxgen = require(path.join(lib, 'node_modules', 'pptxgenjs'));
const { applyTheme } = require(path.join(lib, 'apply_theme.js'));
const { speakers, slides: script } = require('./script.js');

const root = path.resolve(__dirname, '..', '..');
const OUT = path.join(__dirname, 'RestaurantRush_Presentation.pptx');

// ---------- palette and type ----------
const INK = '1F2433';      // dark navy-charcoal
const INK2 = '2B3145';     // code boxes
const PAPER = 'FFFFFF';
const TINT = 'F2F3F6';     // card fill
const LINE = 'D9DCE3';
const MUTED = '5B6170';
const TOMATO = 'D9482B';   // main accent
const MUSTARD = 'E3A21A';
const TEAL = '1F8A70';
const PLUM = '7A4B8F';
const SPEAKER = { 1: TEAL, 2: TOMATO, 3: MUSTARD, 4: PLUM };
const PKG = {
  boundary: { fill: 'EEF7EE', line: '7AA97A' },
  control: { fill: 'EEF3FB', line: '7D97C4' },
  entity: { fill: 'FDF8EA', line: 'C9AD62' },
};
const HEAD = 'Cambria';
const BODY = 'Calibri';
const MONO = 'Consolas';

const THEME = {
  name: 'Restaurant Rush',
  headFontFace: HEAD,
  bodyFontFace: BODY,
  colors: { dk1: INK, lt1: PAPER, dk2: INK2, lt2: TINT, accent1: TOMATO, accent2: MUSTARD, accent3: TEAL,
    accent4: PLUM, accent5: '7D97C4', accent6: '7AA97A', hlink: TOMATO, folHlink: PLUM },
};

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5 in
pres.theme = { headFontFace: HEAD, bodyFontFace: BODY };
pres.title = 'Restaurant Rush - CT2003 group presentation';

pres.defineSlideMaster({
  title: 'DARK',
  background: { color: INK },
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.8, y: 2.25, w: 11.7, h: 1.2,
      fontFace: HEAD, fontSize: 44, bold: true, color: PAPER, valign: 'bottom', align: 'left', margin: 0 }, text: '' } },
    { placeholder: { options: { name: 'body', type: 'body', x: 0.8, y: 3.55, w: 11.7, h: 0.7,
      fontFace: BODY, fontSize: 20, color: 'C9CEDA', valign: 'top', margin: 0 }, text: '' } },
  ],
});
pres.defineSlideMaster({
  title: 'DIVIDER',
  background: { color: INK },
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 2.2, y: 2.25, w: 10.3, h: 1.2,
      fontFace: HEAD, fontSize: 34, bold: true, color: PAPER, valign: 'bottom', align: 'left', margin: 0 }, text: '' } },
    { placeholder: { options: { name: 'body', type: 'body', x: 2.2, y: 3.55, w: 10.3, h: 1.0,
      fontFace: BODY, fontSize: 18, color: 'C9CEDA', valign: 'top', margin: 0 }, text: '' } },
  ],
});
pres.defineSlideMaster({
  title: 'CLOSE',
  background: { color: INK },
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.8, y: 0.7, w: 11.7, h: 0.9,
      fontFace: HEAD, fontSize: 40, bold: true, color: PAPER, valign: 'middle', align: 'left', margin: 0 }, text: '' } },
  ],
});
pres.defineSlideMaster({
  title: 'CONTENT',
  background: { color: PAPER },
  margin: [0.4, 0.6, 0.6, 0.6],
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.6, y: 0.35, w: 9.6, h: 0.85,
      fontFace: HEAD, fontSize: 30, bold: true, color: INK, valign: 'middle', align: 'left', margin: 0 }, text: '' } },
    { text: { text: 'Restaurant Rush  ·  CT2003', options: { x: 0.6, y: 7.0, w: 5, h: 0.3, fontFace: BODY, fontSize: 10, color: MUTED, margin: 0 } } },
  ],
  slideNumber: { x: 12.2, y: 7.0, w: 0.5, h: 0.3, fontFace: BODY, fontSize: 10, color: MUTED, align: 'right' },
});

// ---------- helpers ----------
const S = pres.shapes;
const notesFor = (id) => {
  const e = script.find((x) => x.id === id);
  if (!e) throw new Error('No script for ' + id);
  const who = speakers[e.speaker - 1];
  let n = `${who.name} (about ${e.time} s)\n\nSAY: ${e.say}`;
  if (e.do) n += `\n\nDO: ${e.do}`;
  if (e.explain) n += `\n\nBACKGROUND: ${e.explain}`;
  return n;
};

const declared = new Set();
function newSlide(id, master, speaker) {
  const section = `Speaker ${speaker}: ${speakers[speaker - 1].part}`;
  if (!declared.has(section)) {
    pres.addSection({ title: section });
    declared.add(section);
  }
  const slide =pres.addSlide({ masterName: master, sectionTitle: `Speaker ${speaker}: ${speakers[speaker - 1].part}` });
  slide.addNotes(notesFor(id));
  return slide;
}

function badge(slide, n) {
  slide.addShape(S.OVAL, { x: 12.13, y: 0.45, w: 0.6, h: 0.6, fill: { color: SPEAKER[n] }, line: { color: SPEAKER[n] },
    objectName: 'Speaker badge' });
  slide.addText(String(n), { x: 12.13, y: 0.45, w: 0.6, h: 0.6, align: 'center', valign: 'middle', fontSize: 18, bold: true,
    color: PAPER, margin: 0, isTextBox: true, objectName: 'Speaker number' });
}

function demoPill(slide) {
  slide.addShape(S.ROUNDED_RECTANGLE, { x: 10.35, y: 0.55, w: 1.55, h: 0.4, rectRadius: 0.2, fill: { color: TOMATO },
    line: { color: TOMATO }, objectName: 'Live demo tag' });
  slide.addText('LIVE DEMO', { x: 10.35, y: 0.55, w: 1.55, h: 0.4, align: 'center', valign: 'middle', fontSize: 12, bold: true,
    color: PAPER, margin: 0, charSpacing: 1, isTextBox: true });
}

function content(id, speaker, title, { demo = false } = {}) {
  const slide = newSlide(id, 'CONTENT', speaker);
  slide.addText(title, { placeholder: 'title' });
  badge(slide, speaker);
  if (demo) demoPill(slide);
  return slide;
}

function card(slide, x, y, w, h, { fill = TINT, line = null, name = 'Card' } = {}) {
  slide.addShape(S.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.12, fill: { color: fill },
    line: line ? { color: line, width: 1.25 } : { color: fill }, objectName: name });
}

function circleNum(slide, x, y, d, label, color, fontSize = 16) {
  slide.addShape(S.OVAL, { x, y, w: d, h: d, fill: { color }, line: { color } });
  slide.addText(label, { x, y, w: d, h: d, align: 'center', valign: 'middle', fontSize, bold: true, color: PAPER,
    margin: 0, isTextBox: true, fontFace: BODY });
}

function text(slide, t, x, y, w, h, o = {}) {
  slide.addText(t, { x, y, w, h, fontFace: o.fontFace || BODY, fontSize: o.fontSize || 16, color: o.color || INK,
    bold: o.bold, italic: o.italic, align: o.align || 'left', valign: o.valign || 'top', margin: o.margin ?? 0,
    paraSpaceAfter: o.paraSpaceAfter, lineSpacingMultiple: o.lineSpacingMultiple, isTextBox: true,
    objectName: o.name, fit: 'none' });
}

function bullets(slide, items, x, y, w, h, o = {}) {
  slide.addText(items.map((it, i) => ({ text: it, options: { bullet: { indent: 16 }, breakLine: i < items.length - 1 } })),
    { x, y, w, h, fontFace: BODY, fontSize: o.fontSize || 16, color: o.color || INK, valign: 'top', margin: 0,
      paraSpaceAfter: o.paraSpaceAfter ?? 6, isTextBox: true });
}

function codeBox(slide, lines, x, y, w, h, fontSize = 12) {
  slide.addShape(S.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: INK2 }, line: { color: INK2 },
    objectName: 'Code box' });
  slide.addText(lines.join('\n'), { x: x + 0.2, y: y + 0.15, w: w - 0.4, h: h - 0.3, fontFace: MONO, fontSize,
    color: 'E8EAF0', valign: 'top', margin: 0, isTextBox: true, objectName: 'Code' });
}

function divider(id, n) {
  const sp = speakers[n - 1];
  const slide = newSlide(id, 'DIVIDER', n);
  circleNum(slide, 0.8, 2.35, 1.1, String(n), SPEAKER[n], 40);
  slide.addText(sp.part, { placeholder: 'title' });
  slide.addText(`Part ${n}  ·  [${sp.name}]  ·  about ${sp.minutes} minutes\n${sp.segments}`, { placeholder: 'body' });
  return slide;
}

function statTile(slide, x, y, w, h, big, label, color = TOMATO) {
  card(slide, x, y, w, h);
  text(slide, big, x + 0.3, y + 0.2, w - 0.6, 0.95, { fontFace: HEAD, fontSize: 48, bold: true, color });
  text(slide, label, x + 0.3, y + 1.15, w - 0.6, h - 1.3, { fontSize: 15, color: MUTED });
}

// ---------- slides ----------

// 1. Title
{
  const slide = newSlide('title', 'DARK', 1);
  slide.addText('Restaurant Rush', { placeholder: 'title', fontSize: 60 });
  slide.addText('A turn-based restaurant manager in Java  ·  CT2003 group presentation', { placeholder: 'body' });
  speakers.forEach((sp, i) => {
    const x = 0.8 + i * 3.0;
    circleNum(slide, x, 4.75, 0.5, String(sp.n), SPEAKER[sp.n], 16);
    text(slide, `[${sp.name}]`, x + 0.65, 4.75, 2.25, 0.5, { fontSize: 16, color: PAPER, valign: 'middle' });
  });
  text(slide, '[Lab group]  ·  [Assignment group]', 0.8, 6.5, 8, 0.4, { fontSize: 14, color: 'A7AEBF' });
}

// 2. Agenda
{
  const slide = content('agenda', 1, 'Four speakers, seven brief segments');
  speakers.forEach((sp, i) => {
    const x = 0.6 + i * 3.07;
    const y = 1.5;
    card(slide, x, y, 2.9, 4.95);
    circleNum(slide, x + 0.3, y + 0.3, 0.7, String(sp.n), SPEAKER[sp.n], 20);
    text(slide, `[${sp.name}]`, x + 1.15, y + 0.45, 1.6, 0.4, { fontSize: 14, color: MUTED });
    text(slide, sp.part, x + 0.3, y + 1.2, 2.3, 1.0, { fontFace: HEAD, fontSize: 19, bold: true });
    text(slide, `about ${sp.minutes} min`, x + 0.3, y + 2.25, 2.3, 0.35, { fontSize: 15, bold: true, color: SPEAKER[sp.n] });
    text(slide, sp.segments, x + 0.3, y + 2.7, 2.3, 2.1, { fontSize: 14, color: MUTED });
  });
  text(slide, 'Total about 15 minutes, including live demos', 0.6, 6.55, 8, 0.35, { fontSize: 13, color: MUTED });
}

// 3. Part 1 divider
divider('part1', 1);

// 4. The game
{
  const slide = content('game', 1, 'You run the floor; customers choose the food');
  statTile(slide, 0.6, 1.5, 2.45, 1.85, '18', 'turns, always played in full');
  statTile(slide, 3.25, 1.5, 2.45, 1.85, '2', 'tables');
  statTile(slide, 5.9, 1.5, 2.45, 1.85, '6', 'customers, one every 3 turns');
  card(slide, 8.6, 1.5, 4.13, 1.85, { fill: INK, name: 'Goal card' });
  text(slide, 'To win after turn 18', 8.9, 1.68, 3.6, 0.4, { fontFace: HEAD, fontSize: 18, bold: true, color: PAPER });
  slide.addText([
    { text: '≥ 4 customers paid', options: { breakLine: true } },
    { text: '≥ $45.00 revenue', options: { breakLine: true } },
    { text: '≥ 60 average satisfaction of paid customers' },
  ], { x: 8.9, y: 2.12, w: 3.65, h: 1.15, fontFace: BODY, fontSize: 15, color: 'E8EAF0', margin: 0, valign: 'top',
    paraSpaceAfter: 3, isTextBox: true });
  const staff = [
    ['W', 'Waiter', 'One task per turn: seat, take an order or serve', TOMATO],
    ['C', 'Chef', 'One preparation unit per turn', MUSTARD],
    ['$', 'Cashier', 'Automatic: one payment per turn, oldest first', TEAL],
    ['H', 'Host (Stage 3)', 'Seats one extra customer per turn', PLUM],
  ];
  staff.forEach(([l, name, desc, col], i) => {
    const x = 0.6 + i * 3.07;
    card(slide, x, 3.65, 2.9, 2.45);
    circleNum(slide, x + 0.3, 3.9, 0.6, l, col, 18);
    text(slide, name, x + 0.3, 4.65, 2.4, 0.4, { fontFace: HEAD, fontSize: 18, bold: true });
    text(slide, desc, x + 0.3, 5.1, 2.4, 0.9, { fontSize: 15, color: MUTED });
  });
  text(slide, 'Only five customers can ever pay: the turn-16 arrival runs out of time, as the brief intends.',
    0.6, 6.35, 12, 0.35, { fontSize: 13, color: MUTED, italic: true });
}

// 5. A turn
{
  const slide = content('turn', 1, 'Every turn runs the same six steps');
  const steps = [
    ['Arrival', 'The scheduled customer joins the queue at satisfaction 100'],
    ['Choices', 'You pick each staff task, or Wait'],
    ['Kitchen and serving', 'Waiter acts before Chef; a dish READY now is served next turn'],
    ['Eating and payment', 'Eat one full turn, then the Cashier takes one payment'],
    ['Waiting', 'Unserved customers lose satisfaction; at 0 they walk out'],
    ['Result', 'After turn 18: victory only if all three targets are met'],
  ];
  steps.forEach(([t, d], i) => {
    const x = 0.6 + i * 2.04;
    card(slide, x, 1.5, 1.9, 2.75);
    circleNum(slide, x + 0.25, 1.7, 0.55, String(i + 1), INK, 16);
    text(slide, t, x + 0.25, 2.4, 1.5, 0.65, { fontFace: HEAD, fontSize: 16, bold: true });
    text(slide, d, x + 0.25, 3.05, 1.5, 1.15, { fontSize: 13, color: MUTED });
  });
  card(slide, 0.6, 4.55, 6.0, 2.0, { fill: PAPER, line: LINE });
  text(slide, 'The timing that matters', 0.9, 4.72, 5.4, 0.4, { fontFace: HEAD, fontSize: 18, bold: true });
  bullets(slide, ['Dish READY on turn t → served on turn t + 1 at the earliest',
    'Served on turn t → READY_TO_PAY on t + 1 → pays on t + 2 at the earliest',
    'Invalid choice → explained, and the staff task is not used up'], 0.9, 5.2, 5.5, 1.3, { fontSize: 14, paraSpaceAfter: 4 });
  card(slide, 6.85, 4.55, 5.88, 2.0, { fill: PAPER, line: LINE });
  text(slide, "The brief's Pasta example, tested", 7.15, 4.72, 5.4, 0.4, { fontFace: HEAD, fontSize: 18, bold: true });
  const cells = [['Turn', '1', '2', '3', '4', '5', '6'], ['Satisfaction', '92', '84', '76', '76', 'ready', 'paid $18.00']];
  slide.addTable(cells.map((row, r) => row.map((c) => ({ text: c, options: { bold: r === 0, fill: { color: r === 0 ? TINT : PAPER } } }))), {
    x: 7.15, y: 5.25, w: 5.3, colW: [1.25, 0.5, 0.5, 0.5, 0.75, 0.75, 1.05], fontFace: BODY, fontSize: 13, color: INK,
    border: { type: 'solid', pt: 0.75, color: LINE }, valign: 'middle', margin: 0.04 });
  text(slide, 'Seated turn 1, ordered and cooked turns 2-3, served turn 4: one of 40 rule checks', 7.15, 6.05, 5.4, 0.4,
    { fontSize: 12, color: MUTED });
}

// 6. Architecture
{
  const slide = content('architecture', 1, 'Rules live in control, never in the console');
  const cols = [
    ['boundary', 'Reads input, prints state', ['ConsoleView: formats the turn screen', 'ConsoleInput: reads whole numbers and y/n']],
    ['control', 'Runs the turn and applies every rule', ['GameController: the 18-turn loop and retries', 'Game: all turn rules', 'Scenario: setup, menu, arrivals', 'PriceCalculator: locked prices', 'GameStats, Objective: scoring']],
    ['entity', 'The restaurant and its objects', ['Restaurant: tables, queue, orders', 'Customer + Regular, VIP, Critic', 'Order, MenuItem, Dish, ComboMeal', 'Staff + Waiter, Chef, Cashier, Host', 'Money: integer cents']],
  ];
  cols.forEach(([pkg, role, items], i) => {
    const x = 0.6 + i * 4.25;
    card(slide, x, 1.5, 3.6, 4.6, { fill: PKG[pkg].fill, line: PKG[pkg].line, name: pkg + ' package' });
    text(slide, pkg, x + 0.3, 1.7, 3.0, 0.45, { fontFace: MONO, fontSize: 20, bold: true });
    text(slide, role, x + 0.3, 2.2, 3.0, 0.4, { fontSize: 15, italic: true, color: MUTED });
    bullets(slide, items, x + 0.3, 2.75, 3.05, 3.2, { fontSize: 15, paraSpaceAfter: 8 });
    if (i < 2) {
      slide.addShape(S.RIGHT_ARROW, { x: x + 3.7, y: 3.55, w: 0.45, h: 0.45, fill: { color: INK }, line: { color: INK },
        objectName: 'Depends on' });
    }
  });
  text(slide, 'Dependencies point one way, so the entity package compiles on its own. A rejected choice comes back as an InvalidActionException with a reason.',
    0.6, 6.3, 12.1, 0.6, { fontSize: 14, color: MUTED });
}

// 7. Demo: launch
{
  const slide = content('demo-launch', 1, 'Launching the game from the submitted project', { demo: true });
  const steps = [['./build.sh', 'or build.bat on Windows'], ['./run.sh', 'or run.bat'], ['Read the turn screen', 'queue, tables, orders, tasks']];
  steps.forEach(([cmd, note], i) => {
    const y = 1.6 + i * 1.45;
    circleNum(slide, 0.6, y, 0.55, String(i + 1), TEAL, 16);
    text(slide, cmd, 1.35, y - 0.02, 3.6, 0.45, { fontFace: i < 2 ? MONO : HEAD, fontSize: 20, bold: true });
    text(slide, note, 1.35, y + 0.45, 3.6, 0.4, { fontSize: 15, color: MUTED });
  });
  text(slide, 'Needs only JDK 17+; works offline.', 0.6, 5.95, 4.4, 0.4, { fontSize: 14, color: MUTED, italic: true });
  codeBox(slide, [
    '                    TURN 1 / 18',
    '  * C1 (Regular) arrived and joined the waiting queue (satisfaction 100).',
    'Turn 1 | Revenue $0.00 | Avg satisfaction (paid) N/A | Paid 0',
    '',
    'Waiting queue:',
    '  C1 (Regular)   sat 100  WAITING      arrived turn 1',
    'Tables:',
    '  Table 1: (free)',
    '  Table 2: (free)',
    'Orders:',
    '  (none in progress)',
    'Staff tasks available:',
    '  Host   : seat one queued customer (before the Waiter acts)',
    '  Waiter : seat C1',
    '  Chef   : nothing to cook yet',
    '  Cashier: automatic, oldest READY_TO_PAY customer first',
  ], 5.3, 1.45, 7.43, 5.1, 12);
}

// 8. Part 2 divider
divider('part2', 2);

// 9. Constraint
{
  const slide = content('constraint', 2, 'One Waiter, three jobs, one task per turn', { demo: true });
  const head = ['', 'Turn 1', 'Turn 2', 'Turn 3', 'Turn 4', 'Turn 5', 'Turn 6'];
  const rows = [
    ['Arrives', 'C1', '', '', 'C2', '', ''],
    ['Waiter', 'Seat C1', 'Take order', 'Serve #1', 'Seat C2', 'Take order', 'Serve #2'],
    ['Chef', '', 'Cook #1', '', '', 'Cook #2', ''],
    ['Cashier', '', '', '', '', 'C1 pays', ''],
  ];
  const all = [head, ...rows].map((row, r) => row.map((c, ci) => ({ text: c, options: {
    bold: r === 0 || ci === 0, color: r === 2 && ci > 0 ? PAPER : INK,
    fill: { color: r === 0 ? TINT : (r === 2 && ci > 0 ? TOMATO : PAPER) } } })));
  slide.addTable(all, { x: 0.6, y: 1.5, w: 12.13, colW: [1.63, 1.75, 1.75, 1.75, 1.75, 1.75, 1.75], rowH: 0.55,
    fontFace: BODY, fontSize: 16, border: { type: 'solid', pt: 0.75, color: LINE }, valign: 'middle', align: 'center', margin: 0.05 });
  card(slide, 0.6, 4.6, 7.4, 1.9, { fill: INK, name: 'Key message' });
  text(slide, 'With an arrival every three turns, the Waiter has no spare turn.', 0.95, 4.8, 6.8, 0.9,
    { fontFace: HEAD, fontSize: 22, bold: true, color: PAPER });
  text(slide, 'Any slip, or a 2-unit Pasta, pushes serving into the next arrival\'s turn and costs satisfaction.', 0.95, 5.7, 6.8, 0.7,
    { fontSize: 15, color: 'C9CEDA' });
  card(slide, 8.25, 4.6, 4.48, 1.9);
  text(slide, 'Live: turns 1-2', 8.55, 4.78, 3.9, 0.4, { fontFace: HEAD, fontSize: 18, bold: true });
  text(slide, 'Turn 1  Waiter 1,1,1  Chef 0\nTurn 2  Waiter 2,1    Chef 1,1', 8.55, 5.25, 3.95, 1.1,
    { fontFace: MONO, fontSize: 13, color: INK });
}

// 10. Lifecycle
{
  const slide = content('lifecycle', 2, 'A dish from order to payment', { demo: true });
  const nodes = [
    ['Turn 2', 'ORDERED → READY', 'Waiter takes the Burger order; the Chef cooks its one unit'],
    ['Turn 3', 'SERVED', "Can't be served on the turn it's cooked; served now at 84"],
    ['Turn 4', 'READY_TO_PAY', 'Ate for one full turn'],
    ['Turn 5', 'PAID', 'Cashier collects $15.00 and frees the table'],
  ];
  slide.addShape(S.LINE, { x: 2.1, y: 2.05, w: 9.15, h: 0, line: { color: LINE, width: 3 }, objectName: 'Timeline' });
  nodes.forEach(([turn, status, desc], i) => {
    const cx = 2.1 + i * 3.05;
    circleNum(slide, cx - 0.3, 1.75, 0.6, String(i + 1), i === 3 ? TEAL : TOMATO, 16);
    text(slide, turn, cx - 1.4, 1.3, 2.8, 0.35, { fontSize: 14, color: MUTED, align: 'center' });
    text(slide, status, cx - 1.45, 2.5, 2.9, 0.45, { fontFace: MONO, fontSize: 17, bold: true, align: 'center' });
    text(slide, desc, cx - 1.4, 3.0, 2.8, 0.9, { fontSize: 14, color: MUTED, align: 'center' });
  });
  text(slide, 'Turn 3 in the demo: two mistakes, both explained, then the real choice', 0.6, 4.15, 12, 0.4,
    { fontFace: HEAD, fontSize: 17, bold: true });
  codeBox(slide, [
    'Waiter: 1) Seat  2) Take an order  3) Serve a READY order  0) Wait > abc',
    '  ! "abc" is not a whole number. Please try again.',
    'Waiter: ... > 3     Order number to serve > 9',
    '  ! Not allowed: There is no order #9.  ! Please choose again.',
    'Waiter: ... > 3     Order number to serve > 1',
    '  * Waiter served order #1 Burger for C1. C1 (Regular) is now eating (satisfaction 84).',
  ], 0.6, 4.65, 12.13, 1.95, 13);
}

// 11. Encapsulation
{
  const slide = content('encapsulation', 2, 'Validate, act, then use up the task');
  codeBox(slide, [
    '// Waiter.java: every staff action has this shape',
    'public void seat(Restaurant r, Customer c, Table t)',
    '        throws InvalidActionException {',
    '    ensureAvailable();   // already acted this turn?',
    '    r.seat(c, t);        // queued? table free?',
    '    completeTask();      // only reached on success',
    '}',
  ], 0.6, 1.5, 6.5, 3.2, 15);
  text(slide, 'A failed check throws before completeTask(), so the controller simply asks again.', 0.6, 4.9, 6.5, 0.8,
    { fontSize: 15, color: MUTED });
  const items = [
    ['Package-private state changes', 'Only Restaurant and Staff can move a customer through the visit: seatAt, serve, pay, leave.'],
    ['Satisfaction stays 0 to 100', 'Changes only through loseSatisfaction() and recover(), which clamp the value.'],
    ['Money is immutable', 'Whole cents with half-up rounding: $24.30 and $10.80 come out exact.'],
  ];
  items.forEach(([t, d], i) => {
    const y = 1.5 + i * 1.72;
    card(slide, 7.4, y, 5.33, 1.55);
    text(slide, t, 7.7, y + 0.18, 4.8, 0.4, { fontFace: HEAD, fontSize: 17, bold: true });
    text(slide, d, 7.7, y + 0.62, 4.8, 0.85, { fontSize: 14, color: MUTED });
  });
}

// 12. Stage 1 diagram
{
  const slide = content('diagram1', 2, 'Stage 1 design (tag stage-1)');
  slide.addImage({ path: path.join(root, 'docs', 'uml', 'stage1-class-diagram.png'), x: 0.6, y: 1.35, w: 12.13, h: 5.45,
    sizing: { type: 'contain', w: 12.13, h: 5.45 }, altText: 'Stage 1 UML class diagram' });
}

// 13. Part 3 divider
divider('part3', 3);

// 14. Customers
{
  const slide = content('customers', 3, 'Three customers, one set of rules');
  const types = [
    ['R', 'Regular', '−8', 'Pays full price', 'No special behaviour', TEAL, false],
    ['V', 'VIP', '−5', '10% off the bill', 'More patient', MUSTARD, false],
    ['C', 'Critic', '−12', 'Pays full price', 'Orders the most expensive item. Served on the earliest possible turn: +10. Any delay: −10.', TOMATO, true],
  ];
  types.forEach(([l, name, loss, bill, special, col, dark], i) => {
    const x = 0.6 + i * 4.14;
    card(slide, x, 1.5, 3.85, 4.75, { fill: dark ? INK : TINT, name: name + ' card' });
    circleNum(slide, x + 0.35, 1.8, 0.65, l, col, 20);
    text(slide, name, x + 1.2, 1.88, 2.4, 0.5, { fontFace: HEAD, fontSize: 24, bold: true, color: dark ? PAPER : INK });
    text(slide, loss, x + 0.35, 2.75, 3.2, 0.9, { fontFace: HEAD, fontSize: 48, bold: true, color: col });
    text(slide, 'satisfaction per waiting turn', x + 0.35, 3.65, 3.2, 0.35, { fontSize: 14, color: dark ? 'C9CEDA' : MUTED });
    text(slide, bill, x + 0.35, 4.2, 3.2, 0.4, { fontSize: 17, bold: true, color: dark ? PAPER : INK });
    text(slide, special, x + 0.35, 4.65, 3.2, 1.5, { fontSize: 15, color: dark ? 'E8EAF0' : MUTED });
  });
  text(slide, 'Base game: the VIP arrives on turn 4 and the Critic on turn 10; there are still six arrivals.', 0.6, 6.45, 12, 0.35,
    { fontSize: 13, color: MUTED, italic: true });
}

// 15. Polymorphism
{
  const slide = content('polymorphism', 3, 'No type checks: each customer answers for itself');
  codeBox(slide, [
    '// Game: one loop for every type',
    'for (Customer c : restaurant.getActiveCustomers()) {',
    '    if (!c.isAwaitingService()) continue;',
    '    c.loseSatisfaction();   // 8, 5 or 12',
    '    if (c.getSatisfaction() == 0)',
    '        restaurant.handleDeparture(c);',
    '}',
  ], 0.6, 1.5, 5.9, 3.1, 13);
  const head = ['Method', 'Regular', 'VIP', 'Critic'];
  const rows = [
    ['getSatisfactionLoss()', '8', '5', '12'],
    ['applyDiscount()', '–', '90%', '–'],
    ['chooseItem()', 'random', 'random', 'most expensive'],
    ['onServed()', '–', '–', '+10 / −10'],
  ];
  slide.addTable([head, ...rows].map((row, r) => row.map((c, ci) => ({ text: c, options: {
    bold: r === 0, fontFace: ci === 0 && r > 0 ? MONO : BODY, fontSize: ci === 0 && r > 0 ? 13 : 15,
    fill: { color: r === 0 ? TINT : PAPER } } }))), {
    x: 6.8, y: 1.5, w: 5.93, colW: [2.33, 1.05, 1.0, 1.55], rowH: 0.6, color: INK,
    border: { type: 'solid', pt: 0.75, color: LINE }, valign: 'middle', margin: 0.08 });
  text(slide, 'Overrides per subclass; Game, Waiter and Cashier never ask the type.', 6.8, 4.65, 5.9, 0.4,
    { fontSize: 13, color: MUTED, italic: true });
  card(slide, 0.6, 5.1, 12.13, 1.45, { fill: PAPER, line: LINE });
  text(slide, 'Alternative we rejected', 0.9, 5.25, 4, 0.4, { fontFace: HEAD, fontSize: 17, bold: true });
  text(slide, 'A CustomerType enum with switch statements in Game is shorter for three types, but every new type would mean editing the turn rules again, breaking the open/closed principle.',
    0.9, 5.68, 11.5, 0.8, { fontSize: 15, color: MUTED });
}

// 16. Critic demo
{
  const slide = content('demo-critic', 3, 'The Critic judges the kitchen', { demo: true });
  const steps = [['Turn 10', 'Host seats C4; Waiter takes the order: Burger + Pasta Combo, 3 units'], ['Turns 10-12', 'Chef cooks one unit each turn'],
    ['Turn 13', 'Served on 10 + 3 = turn 13, the earliest possible'], ['Reaction', '+10: satisfaction 64 → 74']];
  steps.forEach(([t, d], i) => {
    const x = 0.6 + i * 3.07;
    card(slide, x, 1.5, 2.9, 2.2, { fill: i === 3 ? INK : TINT });
    text(slide, t, x + 0.3, 1.7, 2.3, 0.45, { fontFace: HEAD, fontSize: 19, bold: true, color: i === 3 ? MUSTARD : INK });
    text(slide, d, x + 0.3, 2.2, 2.3, 1.35, { fontSize: 15, color: i === 3 ? PAPER : MUTED });
  });
  text(slide, 'Jump in at turn 10 (Git Bash), then play live:', 0.6, 4.0, 12, 0.4, { fontFace: HEAD, fontSize: 17, bold: true });
  codeBox(slide, [
    '$ cat runs/demo/stage3-before-turn10.txt - | java -cp out restaurantrush.Main --echo',
    '  * Waiter took order #4: C4 (Critic) ordered Burger + Pasta Combo (3 prep units) for $29.70.',
    '  * Waiter served order #4 Burger + Pasta Combo for C4. C4 (Critic) is now eating',
    '    (satisfaction 64 -> 74 (reaction to service)).',
  ], 0.6, 4.5, 12.13, 1.55, 13);
  text(slide, 'One turn late, the same dish gives −10. The rule checks test both cases.', 0.6, 6.25, 12, 0.35,
    { fontSize: 13, color: MUTED, italic: true });
}

// 17 and 23. Stage comparisons
function diffSlide(id, speaker, title, stat, statLabel, groups, link, caption) {
  const slide = content(id, speaker, title);
  card(slide, 0.6, 1.5, 3.6, 3.85, { fill: INK });
  text(slide, stat, 0.9, 1.85, 3.1, 0.9, { fontFace: HEAD, fontSize: 40, bold: true, color: MUSTARD });
  text(slide, statLabel, 0.9, 2.8, 3.0, 0.8, { fontSize: 16, color: 'E8EAF0' });
  text(slide, link, 0.9, 4.15, 3.0, 0.9, { fontFace: MONO, fontSize: 12, color: 'A7AEBF' });
  groups.forEach(([head, items, col], i) => {
    const x = 4.45 + i * 2.8;
    card(slide, x, 1.5, 2.63, 3.85);
    text(slide, head, x + 0.25, 1.7, 2.2, 0.4, { fontFace: HEAD, fontSize: 18, bold: true, color: col });
    bullets(slide, items, x + 0.25, 2.25, 2.2, 2.95, { fontSize: 15, paraSpaceAfter: 6 });
  });
  card(slide, 0.6, 5.6, 12.13, 0.95, { fill: PAPER, line: LINE });
  text(slide, caption, 0.9, 5.6, 11.6, 0.95, { fontSize: 16, valign: 'middle' });
  return slide;
}
diffSlide('diff12', 3, 'Stage 1 → 2: two new files, one setup change', '+148 / −3', 'lines changed in 4 source files', [
  ['New', ['VIPCustomer', 'CriticCustomer'], TEAL],
  ['Changed', ['Scenario: VIP on turn 4, Critic on turn 10', 'Game: clearer serve message only'], TOMATO],
  ['Unchanged', ['Customer', 'Order', 'Waiter, Chef, Cashier', 'Restaurant', 'GameController'], MUTED],
], 'github.com/<OWNER>/<REPO>/\ncompare/stage-1...stage-2',
'Open/closed in practice: the Stage 1 rules were open to new customer types without being modified.');

// 18. Part 4 divider
divider('part4', 4);

// 19. Stage 3 features
{
  const slide = content('stage3', 4, 'A new role, a combo menu and a promotion');
  const feats = [
    ['H', 'Host', '+1 seat', 'per turn, before the Waiter acts, so the order can be taken the same turn', PLUM],
    ['M', 'ComboMeal', '$24.30', 'Salad + Pasta: (9 + 18) × 0.9, and 1 + 2 = 3 preparation units', MUSTARD],
    ['%', 'Happy Hour', '20% off', 'Once per game for 2 turns, after the VIP discount (VIP Burger: $10.80); waiting customers recover 15', TOMATO],
  ];
  feats.forEach(([l, name, big, desc, col], i) => {
    const x = 0.6 + i * 4.14;
    card(slide, x, 1.5, 3.85, 4.15);
    circleNum(slide, x + 0.35, 1.8, 0.65, l, col, 20);
    text(slide, name, x + 1.2, 1.88, 2.5, 0.5, { fontFace: HEAD, fontSize: 24, bold: true });
    text(slide, big, x + 0.35, 2.75, 3.2, 0.9, { fontFace: HEAD, fontSize: 44, bold: true, color: col });
    text(slide, desc, x + 0.35, 3.75, 3.2, 1.75, { fontSize: 15, color: MUTED });
  });
  text(slide, 'ComboMeal is a MenuItem built from two MenuItems; HappyHour is a PriceModifier plugged into PriceCalculator. Orders, the Chef and the Waiter did not change.',
    0.6, 5.9, 12.1, 0.7, { fontSize: 14, color: MUTED });
}

// 20. Turn 13 decision
{
  const slide = content('decision', 4, 'Turn 13: one Waiter, two urgent jobs', { demo: true });
  card(slide, 0.6, 1.45, 12.13, 1.0, { fill: TINT });
  text(slide, "The Critic's 3-unit combo is READY, and C5 has just arrived wanting a 3-unit combo. Only 5 turns remain.",
    0.9, 1.6, 11.6, 0.7, { fontSize: 17, valign: 'middle' });
  // Option A
  card(slide, 0.6, 2.7, 5.9, 3.85, { fill: PAPER, line: LINE });
  text(slide, 'A · Serve the Critic now', 0.9, 2.88, 5.3, 0.45, { fontFace: HEAD, fontSize: 20, bold: true });
  bullets(slide, ['Critic on time: +10', "C5's order slips to turn 14", 'C5 is still eating when the game ends'], 0.9, 3.45, 5.3, 1.5,
    { fontSize: 15, color: MUTED });
  text(slide, '4 paid  ·  $73.14  ·  avg 87.0', 0.9, 5.4, 5.3, 0.5, { fontFace: HEAD, fontSize: 20, bold: true, color: MUTED });
  text(slide, 'Victory, but C5 never pays', 0.9, 5.9, 5.3, 0.4, { fontSize: 14, color: MUTED, italic: true });
  // Option B
  card(slide, 6.83, 2.7, 5.9, 3.85, { fill: INK, name: 'Chosen option' });
  text(slide, 'B · Happy Hour + Host + take the order', 7.13, 2.88, 5.4, 0.45, { fontFace: HEAD, fontSize: 20, bold: true, color: PAPER });
  bullets(slide, ['Host seats C5; Waiter takes the order at 20% off', 'Critic served on turn 14: −10, but +15 twice from Happy Hour', 'C5 pays on turn 18'],
    7.13, 3.45, 5.3, 1.5, { fontSize: 15, color: 'E8EAF0' });
  text(slide, '5 paid  ·  $92.58  ·  avg 86.0', 7.13, 5.4, 5.3, 0.5, { fontFace: HEAD, fontSize: 20, bold: true, color: MUSTARD });
  text(slide, 'Victory with every possible customer paid', 7.13, 5.9, 5.3, 0.4, { fontSize: 14, color: 'C9CEDA', italic: true });
}

// 21. Results
{
  const slide = content('results', 4, 'Same game, two managers', { demo: true });
  const res = [
    ['VICTORY', ['5', 'paid'], ['$92.58', 'revenue'], ['86.0', 'avg satisfaction'], ['0', 'walk-outs'],
      'Seat on arrival, order while the Chef cooks, Happy Hour on turn 13', true],
    ['DEFEAT', ['0', 'paid'], ['$0.00', 'revenue'], ['N/A', 'avg satisfaction'], ['2', 'walk-outs'],
      'Happy Hour wasted on turn 1; the Chef never cooks', false],
  ];
  res.forEach(([label, ...rest], i) => {
    const desc = rest[4];
    const dark = rest[5];
    const x = 0.6 + i * 6.23;
    card(slide, x, 1.5, 5.9, 4.3, { fill: dark ? INK : TINT });
    text(slide, label, x + 0.35, 1.7, 5.2, 0.5, { fontFace: HEAD, fontSize: 24, bold: true, color: dark ? MUSTARD : TOMATO });
    rest.slice(0, 4).forEach(([v, l], j) => {
      const cx = x + 0.35 + (j % 2) * 2.7;
      const cy = 2.4 + Math.floor(j / 2) * 1.35;
      text(slide, v, cx, cy, 2.5, 0.75, { fontFace: HEAD, fontSize: 36, bold: true, color: dark ? PAPER : INK });
      text(slide, l, cx, cy + 0.72, 2.5, 0.35, { fontSize: 14, color: dark ? 'C9CEDA' : MUTED });
    });
    text(slide, desc, x + 0.35, 5.15, 5.2, 0.6, { fontSize: 14, color: dark ? 'E8EAF0' : MUTED, italic: true });
  });
  text(slide, 'java -cp out restaurantrush.Main < runs/stage3-victory.txt | tail -8     (and stage3-defeat.txt)',
    0.6, 6.05, 12.1, 0.35, { fontFace: MONO, fontSize: 13 });
  text(slide, 'Every stage has a victory and a defeat script: Stage 1 $57.00, Stage 2 $65.10, Stage 3 $92.58. Seed 2003 makes them repeatable.',
    0.6, 6.45, 12.1, 0.35, { fontSize: 13, color: MUTED });
}

// 22. Final diagram
{
  const slide = content('diagram3', 4, 'Final design (tag stage-3)');
  slide.addImage({ path: path.join(root, 'docs', 'uml', 'stage3-class-diagram.png'), x: 0.6, y: 1.3, w: 12.13, h: 5.55,
    sizing: { type: 'contain', w: 12.13, h: 5.55 }, altText: 'Stage 3 UML class diagram, the final design' });
}

// 23. Stage 2 -> 3
diffSlide('diff23', 4, 'Stage 2 → 3: new behaviour, core rules untouched', '+392 / −12', 'lines changed in 9 source files', [
  ['New', ['Host', 'ComboMeal', 'PriceModifier', 'HappyHour'], TEAL],
  ['Changed', ['Scenario: combos', 'PriceCalculator: modifier list', 'Game, GameController: Host and Happy Hour', 'ConsoleView: status'], TOMATO],
  ['Unchanged', ['Customer', 'Order', 'Waiter, Chef, Cashier', 'Restaurant'], MUTED],
], 'github.com/<OWNER>/<REPO>/\ncompare/stage-2...stage-3',
'The core rule classes are unchanged since Stage 1, and the same 40 rule checks pass at every tag.');

// 24. Close
{
  const slide = newSlide('close', 'CLOSE', 4);
  slide.addText('What we take away', { placeholder: 'title' });
  const take = [
    ['Behaviour lives in the objects', 'Customers and menu items answer for themselves, so each stage mostly added classes.'],
    ['Rules stay out of the UI', 'Boundary, control and entity are separate, and every rule is in one place.'],
    ['Everything is reproducible', 'Tagged stages, seeded runs and 40 rule checks back every claim we made.'],
  ];
  take.forEach(([t, d], i) => {
    const x = 0.8 + i * 4.0;
    circleNum(slide, x, 2.1, 0.65, String(i + 1), [TEAL, TOMATO, MUSTARD][i], 20);
    text(slide, t, x, 2.95, 3.6, 0.85, { fontFace: HEAD, fontSize: 20, bold: true, color: PAPER });
    text(slide, d, x, 3.8, 3.6, 1.2, { fontSize: 15, color: 'C9CEDA' });
  });
  text(slide, 'Thank you. Questions?', 0.8, 5.6, 11.7, 0.9, { fontFace: HEAD, fontSize: 40, bold: true, color: MUSTARD });
}

pres.writeFile({ fileName: OUT }).then(async () => {
  await applyTheme(OUT, THEME);
  console.log('Wrote ' + OUT + ' (' + script.length + ' slides)');
});
