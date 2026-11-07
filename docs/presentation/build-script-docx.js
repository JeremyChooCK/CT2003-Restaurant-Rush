// Builds RestaurantRush_Speaker_Script.docx from script.js.
// Usage: node build-script-docx.js <folder containing node_modules with docx>
'use strict';
const fs = require('fs');
const path = require('path');
const docx = require(path.join(process.argv[2], 'node_modules', 'docx'));
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, ShadingType,
  BorderStyle, AlignmentType, LevelFormat, Footer, PageNumber, PageBreak,
} = docx;
const { speakers, slides, qa } = require('./script.js');

const TITLES = {
  title: 'Restaurant Rush (title)', agenda: 'Four speakers, seven brief segments', part1: 'Part 1 divider',
  game: 'You run the floor; customers choose the food', turn: 'Every turn runs the same six steps',
  architecture: 'Rules live in control, never in the console', 'demo-launch': 'Launching the game from the submitted project',
  part2: 'Part 2 divider', constraint: 'One Waiter, three jobs, one task per turn', lifecycle: 'A dish from order to payment',
  encapsulation: 'Validate, act, then use up the task', diagram1: 'Stage 1 design (tag stage-1)', part3: 'Part 3 divider',
  customers: 'Three customers, one set of rules', polymorphism: 'No type checks: each customer answers for itself',
  'demo-critic': 'The Critic judges the kitchen', diff12: 'Stage 1 → 2: two new files, one setup change', part4: 'Part 4 divider',
  stage3: 'A new role, a combo menu and a promotion', decision: 'Turn 13: one Waiter, two urgent jobs',
  results: 'Same game, two managers', diagram3: 'Final design (tag stage-3)',
  diff23: 'Stage 2 → 3: new behaviour, core rules untouched', close: 'What we take away / Questions',
};
const COLOR = { 1: '1F8A70', 2: 'D9482B', 3: 'B07A0C', 4: '7A4B8F' };
const FONT = 'Calibri';
const MONO = 'Consolas';
const W = 11906 - 2 * 1077;

const P = (children, opts = {}) => new Paragraph({ children: Array.isArray(children) ? children : [new TextRun(children)], spacing: { after: 100 }, ...opts });
const H1 = (t) => new Paragraph({ text: t, heading: HeadingLevel.HEADING_1 });
const H2 = (t) => new Paragraph({ text: t, heading: HeadingLevel.HEADING_2 });
const bullet = (t) => new Paragraph({ children: [new TextRun(t)], numbering: { reference: 'bullets', level: 0 }, spacing: { after: 60 } });
const numbered = (t, ref = 'numbers') => new Paragraph({ children: [new TextRun(t)], numbering: { reference: ref, level: 0 }, spacing: { after: 60 } });
const mono = (t) => new Paragraph({ children: [new TextRun({ text: t, font: MONO, size: 18 })],
  shading: { type: ShadingType.CLEAR, fill: 'F2F3F6', color: 'auto' }, spacing: { after: 80 }, indent: { left: 200 } });

const border = { style: BorderStyle.SINGLE, size: 4, color: 'C9CED8' };
const borders = { top: border, bottom: border, left: border, right: border };
function cell(content, width, { fill, bold, color } = {}) {
  const paras = (Array.isArray(content) ? content : [content]).map((t) => (t instanceof Paragraph ? t
    : new Paragraph({ children: [new TextRun({ text: t, bold, color, size: 20 })], spacing: { after: 40 } })));
  return new TableCell({ width: { size: width, type: WidthType.DXA }, borders, margins: { top: 80, bottom: 80, left: 120, right: 120 },
    shading: fill ? { type: ShadingType.CLEAR, fill, color: 'auto' } : undefined, children: paras });
}
function table(widths, rows, header = true) {
  return new Table({ width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: widths,
    rows: rows.map((r, i) => new TableRow({ tableHeader: header && i === 0, cantSplit: true,
      children: r.map((c, j) => cell(c, widths[j], header && i === 0 ? { fill: 'E6ECF5', bold: true } : {})) })) });
}

// Slide-by-slide block: a two-column table, label | content
function slideBlock(entry, number) {
  const label = (t) => cell(t, 1500, { fill: 'F2F3F6', bold: true });
  const rows = [
    new TableRow({ cantSplit: true, children: [label('Say'), cell(new Paragraph({ children: [new TextRun({ text: entry.say, size: 21 })], spacing: { after: 40 } }), W - 1500)] }),
  ];
  if (entry.do) rows.push(new TableRow({ cantSplit: true, children: [label('Do (demo)'), cell(entry.do, W - 1500)] }));
  if (entry.explain) rows.push(new TableRow({ cantSplit: true, children: [label('Background'), cell(entry.explain, W - 1500, { color: '444444' })] }));
  return [
    new Paragraph({ keepNext: true, spacing: { before: 200, after: 80 }, children: [
      new TextRun({ text: `Slide ${number}  ·  ${TITLES[entry.id]}`, bold: true, size: 24, color: COLOR[entry.speaker] }),
      new TextRun({ text: `   about ${entry.time} s${entry.demo ? '  ·  LIVE DEMO' : ''}`, size: 20, color: '666666' })] }),
    new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [1500, W - 1500], rows }),
  ];
}

const body = [];
body.push(new Paragraph({ heading: HeadingLevel.TITLE, text: 'Restaurant Rush: presentation speaker script' }));
body.push(P([new TextRun({ text: 'CT2003 group oral presentation, about 15 minutes, 4 speakers. Slides: RestaurantRush_Presentation.pptx (the same script is in each slide\'s speaker notes).', color: '444444' })]));
body.push(P([new TextRun({ text: 'Replace every [Speaker N] with the member\'s name, and rehearse with a timer. Each member must understand and be able to explain their own part.', italics: true, color: 'B03A2E' })]));

body.push(H1('1. Who presents what'));
const totals = {};
for (const s of slides) totals[s.speaker] = (totals[s.speaker] || 0) + s.time;
let clock = 0;
const timingRows = [['Speaker', 'Part', 'Slides', 'Time', 'Starts at', 'Brief segments covered']];
speakers.forEach((sp) => {
  const nums = slides.map((s, i) => (s.speaker === sp.n ? i + 1 : null)).filter(Boolean);
  const start = `${Math.floor(clock / 60)}:${String(clock % 60).padStart(2, '0')}`;
  clock += totals[sp.n];
  timingRows.push([`[${sp.name}]`, sp.part, `${nums[0]}-${nums[nums.length - 1]}`, `${Math.round(totals[sp.n] / 6) / 10} min`, start, sp.segments]);
});
body.push(table([1300, 2100, 800, 900, 900, W - 6000], timingRows));
body.push(P(`Total: about ${Math.round(clock / 6) / 10} minutes. All seven segments the brief requires are covered: (1) launching the game, (2) constrained staff choices, (3) a dish going READY → SERVED → payment, (4) VIP/Critic behaviour, (5) a Stage 3 feature, (6) one victory and one defeat, (7) stage-tag comparisons and the class diagram.`));

body.push(H1('2. Demo setup (do this before the presentation)'));
[
  'Use the laptop that will be connected to the projector. Check Java: java -version must show 17 or newer.',
  'Open Git Bash (installed with Git) in the RestaurantRush folder. Build and test: ./build.sh then ./test.sh, which must end with ALL CHECKS PASSED.',
  'Make a Stage 1 copy for Speaker 2, in a second Git Bash window: git worktree add ../RestaurantRush-stage1 stage-1, then cd ../RestaurantRush-stage1 and ./build.sh.',
  'Make the terminal readable from the back of the room: maximise it and enlarge the font (Ctrl and +). Run clear before each demo.',
  'Keep this document or the demo command card below open next to the slides, so commands can be copied, not typed from memory.',
  'Backup if a live demo fails: open the matching transcript in runs/ (for example runs/stage3-victory-output.txt) and scroll to the same turn.',
  'Rehearse the full talk at least once with a timer, switching between slides and the terminal (Alt+Tab).',
].forEach((t) => body.push(numbered(t, 'setup')));

body.push(H2('Demo command card'));
const cmds = [
  ['Speaker 1: launch (slide 7)', ['./build.sh', './run.sh']],
  ['Speaker 2: Stage 1 live turns 1-5 (slides 9-10), in RestaurantRush-stage1', ['./run.sh',
    'Turn 1: 1, 1, 1 then 0   |   Turn 2: 2, 1 then 1, 1   |   Turn 3: abc, then 3, 9, then 3, 1, then 0',
    'Turn 4: 1, 2, 2 then 0   |   Turn 5: point at "Cashier collected $15.00 from C1"']],
  ['Speaker 3: Critic from turn 10 (slide 16)', ['cat runs/demo/stage3-before-turn10.txt - | java -cp out restaurantrush.Main --echo',
    'Turn 10: n, 1, 4, 2, 2, 2, 1, 4   |   Turns 11 and 12: n, 0, 0, 1, 4   |   Turn 13: n, 0, 3, 4, 0']],
  ['Speaker 4: Happy Hour from turn 13 (slide 20)', ['cat runs/demo/stage3-before-turn13.txt - | java -cp out restaurantrush.Main --echo',
    'Turn 13: y, 1, 5, 1, 2, 1, 1, 5']],
  ['Speaker 4: victory and defeat replays (slide 21)', ['java -cp out restaurantrush.Main < runs/stage3-victory.txt | tail -8',
    'java -cp out restaurantrush.Main < runs/stage3-defeat.txt | tail -8']],
];
cmds.forEach(([t, lines]) => {
  body.push(P([new TextRun({ text: t, bold: true })], { keepNext: true, spacing: { before: 120, after: 60 } }));
  lines.forEach((l) => body.push(mono(l)));
});
body.push(P([new TextRun({ text: 'How to read the input lists: each number or letter is one answer, in the order the game asks: Happy Hour (y/n, Stage 3 only, until used), then Host, then Waiter, then Chef. For a seat action the order is: 1 (seat), customer number, table number. "cat file - |" plays the file first and then lets you type live. Press Ctrl+C to stop a demo.', size: 20, color: '444444' })]));

speakers.forEach((sp) => {
  body.push(new Paragraph({ children: [new PageBreak()] }));
  body.push(H1(`${2 + sp.n}. Speaker ${sp.n}: ${sp.part}`));
  body.push(P([new TextRun({ text: `[${sp.name}]  ·  about ${sp.minutes} minutes  ·  ${sp.segments}`, color: COLOR[sp.n], bold: true })]));
  slides.forEach((s, i) => {
    if (s.speaker === sp.n) body.push(...slideBlock(s, i + 1));
  });
});

body.push(new Paragraph({ children: [new PageBreak()] }));
body.push(H1('7. Likely questions and suggested answers'));
body.push(P('Markers usually ask the person who presented that part. Practise answering these in your own words.'));
body.push(table([3800, W - 3800], [['Question', 'Suggested answer'], ...qa]));

body.push(H1('8. Presentation tips'));
[
  'Speak to the room, not the screen. Each slide has one message; say it in the first sentence.',
  'During live demos, say what you are about to type before you type it, then point at the result.',
  'Hand over by name at the end of your part ("Over to [Speaker 2] for Stage 1").',
  'If something breaks, switch to the transcript in runs/ and keep going. The output is identical.',
  'Keep to time: the speaker after you depends on it. Dividers take a few seconds; demos take the longest.',
].forEach((t) => body.push(bullet(t)));

const doc = new Document({
  creator: 'CT2003 group',
  title: 'Restaurant Rush speaker script',
  styles: {
    default: { document: { run: { font: FONT, size: 21 }, paragraph: { spacing: { line: 276 } } } },
    paragraphStyles: [
      { id: 'Title', name: 'Title', basedOn: 'Normal', next: 'Normal', run: { font: 'Cambria', size: 44, bold: true, color: '1F2433' },
        paragraph: { spacing: { before: 0, after: 160 } } },
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: 'Cambria', size: 30, bold: true, color: '1F2433' },
        paragraph: { spacing: { before: 320, after: 140 }, keepNext: true, keepLines: true, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: 'Cambria', size: 24, bold: true, color: '1F2433' },
        paragraph: { spacing: { before: 240, after: 100 }, keepNext: true, keepLines: true, outlineLevel: 1 } },
    ],
  },
  numbering: { config: [
    { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] },
    { reference: 'numbers', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 540, hanging: 300 } } } }] },
    { reference: 'setup', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 540, hanging: 300 } } } }] },
  ] },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1020, bottom: 1020, left: 1077, right: 1077 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
      new TextRun({ text: 'Restaurant Rush speaker script  |  Page ', size: 16, color: '777777' }),
      new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '777777' })] })] }) },
    children: body,
  }],
});

const out = path.join(__dirname, 'RestaurantRush_Speaker_Script.docx');
Packer.toBuffer(doc).then((b) => { fs.writeFileSync(out, b); console.log('Wrote ' + out); });
