// Builds RestaurantRush_Report.docx, an editable Word version of the report.
// Needs the "docx" npm package. Usage: node build-report-docx.js [path-to-node_modules-with-docx]
'use strict';
const fs = require('fs');
const path = require('path');
const extra = process.argv[2];
const docx = require(extra ? path.join(extra, 'docx') : 'docx');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, ShadingType,
  BorderStyle, AlignmentType, ImageRun, PageOrientation, LevelFormat, Footer, PageNumber, PageBreak,
} = docx;

const root = path.resolve(__dirname, '..', '..');
const FONT = 'Calibri';
const MONO = 'Consolas';
const BLUE = '1F3B66';
const RED = 'B03A2E';

// ---------- inline markup: **bold**, `code`, _italic_, [[placeholder]] ----------
function runs(text, base = {}) {
  const out = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|_[^_]+_|\[\[[^\]]+\]\])/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(new TextRun({ text: text.slice(last, m.index), ...base }));
    const t = m[0];
    if (t.startsWith('**')) out.push(new TextRun({ text: t.slice(2, -2), bold: true, ...base }));
    else if (t.startsWith('`')) out.push(new TextRun({ text: t.slice(1, -1), font: MONO, size: 18, ...base }));
    else if (t.startsWith('[[')) out.push(new TextRun({ text: '[' + t.slice(2, -2) + ']', italics: true, color: RED, ...base }));
    else out.push(new TextRun({ text: t.slice(1, -1), italics: true, ...base }));
    last = m.index + t.length;
  }
  if (last < text.length) out.push(new TextRun({ text: text.slice(last), ...base }));
  return out;
}

const P = (text, opts = {}) => new Paragraph({ children: runs(text, opts.run), spacing: { after: 100 }, ...opts.para });
const H1 = (text) => new Paragraph({ text, heading: HeadingLevel.HEADING_1 });
const H2 = (text) => new Paragraph({ text, heading: HeadingLevel.HEADING_2 });
const bullet = (text) => new Paragraph({ children: runs(text), numbering: { reference: 'bullets', level: 0 }, spacing: { after: 60 } });
const numbered = (text) => new Paragraph({ children: runs(text), numbering: { reference: 'numbers', level: 0 }, spacing: { after: 40 } });
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

function code(lines) {
  const list = Array.isArray(lines) ? lines : lines.split(/\r?\n/);
  return list.map((line, i) => new Paragraph({
    children: [new TextRun({ text: line.length ? line : ' ', font: MONO, size: 16 })],
    shading: { type: ShadingType.CLEAR, fill: 'F4F6F9', color: 'auto' },
    border: { left: { style: BorderStyle.SINGLE, size: 18, color: '3A5A8C', space: 6 } },
    spacing: { before: 0, after: i === list.length - 1 ? 160 : 0, line: 240 },
    indent: { left: 120 },
    keepLines: true,
    keepNext: i < list.length - 1,
  }));
}

function note(text) {
  return new Paragraph({
    children: runs(text, { size: 20 }),
    shading: { type: ShadingType.CLEAR, fill: 'FFF8D9', color: 'auto' },
    border: {
      top: { style: BorderStyle.SINGLE, size: 6, color: 'E0C96A', space: 4 },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: 'E0C96A', space: 4 },
      left: { style: BorderStyle.SINGLE, size: 6, color: 'E0C96A', space: 4 },
      right: { style: BorderStyle.SINGLE, size: 6, color: 'E0C96A', space: 4 },
    },
    spacing: { before: 120, after: 200 },
  });
}

// Table helper: widths in DXA must sum to the table width.
function table(widths, rows, { header = true } = {}) {
  const border = { style: BorderStyle.SINGLE, size: 4, color: 'B7C0CC' };
  const borders = { top: border, bottom: border, left: border, right: border };
  return new Table({
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: widths,
    rows: rows.map((row, r) => new TableRow({
      tableHeader: header && r === 0,
      cantSplit: true,
      children: row.map((cell, c) => new TableCell({
        width: { size: widths[c], type: WidthType.DXA },
        borders,
        shading: header && r === 0 ? { type: ShadingType.CLEAR, fill: 'E6ECF5', color: 'auto' } : undefined,
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children: String(cell).split('\n').map((line) => new Paragraph({
          children: runs(line, { size: 19, bold: header && r === 0 ? true : undefined }),
          spacing: { after: 40 },
        })),
      })),
    })),
  });
}

function diagram(stage, title) {
  const png = path.join(root, 'docs', 'uml', `stage${stage}-class-diagram.png`);
  const data = fs.readFileSync(png);
  const w = data.readUInt32BE(16);
  const h = data.readUInt32BE(20);
  // A3 landscape minus margins: about 1500 x 980 px at 96 dpi, leaving room for the heading.
  const scale = Math.min(1500 / w, 960 / h);
  return {
    properties: {
      page: {
        size: { width: 16838, height: 23811, orientation: PageOrientation.LANDSCAPE },
        margin: { top: 567, bottom: 567, left: 567, right: 567 },
      },
    },
    footers: { default: footer() },
    children: [
      H2(title),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new ImageRun({ type: 'png', data, transformation: { width: Math.round(w * scale), height: Math.round(h * scale) },
          altText: { title: `Stage ${stage} class diagram`, description: `UML class diagram for Stage ${stage}`, name: `stage${stage}` } })],
      }),
    ],
  };
}

function footer() {
  return new Footer({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Restaurant Rush  |  CT2003 Group Assignment  |  Page ', size: 16, color: '777777' }),
        new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '777777' })],
    })],
  });
}

const A4 = {
  page: { size: { width: 11906, height: 16838 }, margin: { top: 1020, bottom: 1020, left: 1077, right: 1077 } },
};
const W = 11906 - 2 * 1077; // usable width in DXA (9752)

// ---------- content ----------
const cover = [
  new Paragraph({ spacing: { before: 2400 }, children: [] }),
  new Paragraph({ heading: HeadingLevel.TITLE, text: 'Restaurant Rush' }),
  P('CT2003 Group Assignment Report: Java command-line turn-based restaurant management game',
    { run: { size: 26, color: '3A5A8C' }, para: { spacing: { after: 480 } } }),
  table([3000, W - 3000], [
    ['Lab group', '[[e.g. FCS1]]'],
    ['Assignment group', 'Grp1'],
    ['Repository', 'https://github.com/JeremyChooCK/CT2003-Restaurant-Rush'],
    ['Tags', '`stage-1`, `stage-2`, `stage-3` (all runnable)'],
  ], { header: false }),
  new Paragraph({ text: 'Group members', heading: HeadingLevel.HEADING_2 }),
  table([3000, 2200, W - 5200], [
    ['Name', 'Matriculation no.', 'Main contribution'],
    ['Jeremy', '[[ ]]', '[[e.g. entity model, Stage 1]]'],
    ['Yan Qing', '[[ ]]', '[[e.g. turn rules and controller]]'],
    ['Chris', '[[ ]]', '[[e.g. Stage 2 customers, tests]]'],
    ['Jun Siang', '[[ ]]', '[[e.g. Stage 3, UML and report]]'],
  ]),
  new Paragraph({ text: 'Contents', heading: HeadingLevel.HEADING_2 }),
  ...['Overview and how to run', 'Class diagrams (Stage 1, Stage 2, Stage 3 final)',
    'Design discussion: abstractions, OO concepts, SOLID, coupling and cohesion', 'Trade-offs and an alternative design',
    "How the player's choices change the result", 'Evolution across the three stages (GitHub evidence)',
    'Functional evidence: rule checks and reproducible runs', 'Additional features', 'Reflection'].map(numbered),
];

const overview = [
  pageBreak(),
  H1('1. Overview and how to run'),
  P('Restaurant Rush is a turn-based game in which the player manages a small restaurant for 18 turns. Each turn the player decides what the Host (Stage 3), Waiter and Chef do. The Cashier works automatically. Customers choose their own food and lose patience while they wait. After turn 18 the player wins only if **at least 4 customers paid**, **revenue is at least $45.00** and the **average satisfaction of paid customers is at least 60**.'),
  P('The game needs only JDK 17 or newer and works fully offline. Build with `build.bat` or `./build.sh`, play with `run.bat` or `./run.sh`, and run the 40 automated rule checks with `test.bat` or `./test.sh`. Every recorded run in this report can be replayed exactly, for example `java -cp out restaurantrush.Main --echo < runs/stage3-victory.txt`.'),
  P('The code follows the **Boundary-Control-Entity** structure. `boundary` only reads input and prints the state. `control` holds the turn loop and all game rules. `entity` holds the restaurant\'s objects and keeps them consistent. No rule lives in the user interface.'),
  H2('2. Class diagrams'),
  P('The three diagrams follow on A3 landscape pages, one per stage. Classes new in a stage are outlined in red. Italic names and operations are abstract, underlined members are static, `{leaf}` marks final methods, and `~` marks package-private operations. Full-size PNG and SVG copies are in `docs/uml/` of the repository and at each tag. The Stage 3 diagram matches the submitted final code.'),
];

const design = [
  H1('3. Design discussion'),
  H2('3.1 Key abstractions and their responsibilities'),
  table([2500, 1100, W - 3600], [
    ['Class', 'Kind', 'Responsibility'],
    ['`Game`', 'control', 'Applies the turn rules: arrivals, staff actions, eating and payment, satisfaction loss and departures, Happy Hour timing. Turns the player\'s numeric choices into objects and reports what happened as event messages. No input or output.'],
    ['`GameController`', 'control', 'Runs the 18-turn loop in the brief\'s order. Asks the view and input for each decision and retries when `Game` rejects a choice.'],
    ['`Scenario`', 'control', 'All setup in one place: turns, tables, menu, arrival schedule and seed. Later stages register new customers and menu items here.'],
    ['`PriceCalculator`, `PriceModifier`, `HappyHour`', 'control', 'Locks an order\'s price: customer discount first, then each restaurant-wide modifier. `HappyHour` is one modifier and also manages its two-turn duration and the +15 recovery.'],
    ['`GameStats`, `Objective`', 'control', 'Running totals (revenue only from paid bills) and the victory check.'],
    ['`Restaurant`', 'entity', 'Owns the tables, the waiting queue, customers and orders, and keeps them consistent when customers are seated, pay or leave.'],
    ['`Customer` + subclasses', 'entity', 'The visit state machine and satisfaction. Subclasses supply patience, discount, food choice and reaction to service.'],
    ['`Order`', 'entity', 'Locked price, preparation progress and status.'],
    ['`MenuItem`, `Dish`, `ComboMeal`, `Menu`', 'entity', 'What can be ordered, its price and its preparation units.'],
    ['`Staff` + `Waiter`, `Chef`, `Cashier`, `Host`', 'entity', 'Each enforces "at most one task per turn" and validates its own actions.'],
    ['`Money`', 'entity', 'Immutable amount in integer cents with half-up rounding.'],
    ['`ConsoleView`, `ConsoleInput`', 'boundary', 'Display the state, and read and format-check numbers and yes/no answers.'],
  ]),
  H2('3.2 Object-oriented concepts in the code'),
  P('**Encapsulation.** `Customer`, `Order` and `Table` expose read-only getters. Their state changes (`seatAt`, `placeOrder`, `serve`, `pay`, `leave`, `prepareOneUnit`) are package-private, so only the restaurant and its staff can move a customer through the visit, and the UI cannot. Satisfaction can only change through `loseSatisfaction()`, `recover()` and the protected `changeSatisfaction()`, which keep it between 0 and 100. `Money` is immutable and hides its cents, so a locked price cannot be altered later. `Staff` hides the "already acted" flag behind `ensureAvailable()` and `completeTask()`.'),
  ...code([
    '// Staff subclasses validate first and only then use up the task (Waiter.seat)',
    'public void seat(Restaurant restaurant, Customer customer, Table table) throws InvalidActionException {',
    '    ensureAvailable();                 // throws if the Waiter already acted this turn',
    '    restaurant.seat(customer, table);  // throws if the customer is not queued or the table is taken',
    '    completeTask();                    // reached only when the action succeeded',
    '}',
  ]),
  P('**Inheritance.** `RegularCustomer`, `VIPCustomer` and `CriticCustomer` extend `Customer`. `Dish` and `ComboMeal` extend `MenuItem`. `Waiter`, `Chef`, `Cashier` and `Host` extend `Staff`, sharing the one-task-per-turn mechanism.'),
  P('**Polymorphism.** The rules never check a customer\'s type. `Game` calls `customer.loseSatisfaction()`, which uses the subclass\'s `getSatisfactionLoss()`. `PriceCalculator` calls `applyDiscount()`. `Waiter.serve()` triggers `onServed()`, which only the Critic overrides. `Game` asks for `chooseItem(menu)`, which the Critic overrides to pick the most expensive item. Similarly, the Chef and `Order` only call `getPrepUnits()` and `getPrice()` on a `MenuItem`, whether it is a dish or a combo.'),
  ...code([
    '// Game.processSatisfactionAndDepartures(): one loop for every customer type',
    'for (Customer customer : restaurant.getActiveCustomers()) {',
    '    if (!customer.isAwaitingService()) { continue; }',
    '    customer.loseSatisfaction();               // 8, 5 or 12 depending on the object',
    '    if (customer.getSatisfaction() == 0) { restaurant.handleDeparture(customer); ... }',
    '}',
  ]),
  P('**Composition and aggregation.** `Restaurant` creates and owns its `Table`s (composition). `Game` owns its staff, statistics, objective, price calculator and Happy Hour. `ComboMeal` is built from two existing `MenuItem`s (aggregation: the dishes also exist on their own). It is itself a `MenuItem`, a small Composite pattern, which is why combos needed no change to `Order` or `Chef`.'),
  H2('3.3 SOLID principles (only where they are really in the code)'),
  table([1900, W - 1900], [
    ['Principle', 'Where it appears'],
    ['Single responsibility', '`ConsoleInput` only parses input, `ConsoleView` only formats output, `GameController` only sequences the turn and retries, `Game` only applies rules, `GameStats`/`Objective` only score, and `PriceCalculator` only prices. For example, changing the victory targets touches `Objective` alone.'],
    ['Open/closed', 'Stage 2 added two customer types without modifying `Customer`, `Game`\'s rules, `Waiter` or `Cashier`; only the `Scenario` setup changed. Stage 3 added combos without modifying `Order`, `Chef` or `Menu`, and Happy Hour pricing plugs into `PriceCalculator` as a `PriceModifier`. A future promotion would be one new class.'],
    ['Liskov substitution', 'Any `Customer` subclass works wherever a `Customer` is expected. They keep the contract: loss is positive, a discount never raises a price, and satisfaction stays 0-100 because only the base class changes it. A `ComboMeal` can be ordered, cooked and priced exactly like a `Dish`. `Host` keeps `Staff`\'s one-task rule.'],
    ['Interface segregation', 'Only lightly reflected. `PriceModifier` is a single-method interface, so `HappyHour` implements only what pricing needs. We did not add interfaces where there was only one implementation.'],
    ['Dependency inversion', '`PriceCalculator` depends on the `PriceModifier` abstraction, not on `HappyHour`. Rules depend on the abstract `Customer`, `MenuItem` and `Staff`. (`GameController` still uses the concrete console classes; see trade-offs.)'],
  ]),
  H2('3.4 Coupling and cohesion'),
  P('Dependencies point one way: boundary → control → entity. The entity package does not import anything from control or boundary, so it compiles on its own. Classes are cohesive: each entity looks after its own state, and each control class has one job. The main coupling hotspot is `Game`, which coordinates many entities. We accepted this because it is the single place that knows the turn order. It acts as a façade, so the controller and view only talk to `Game` and read entity getters.'),
];

const tradeoffs = [
  H1('4. Trade-offs and an alternative design'),
  table([3000, 3376, W - 6376], [
    ['Decision', 'Benefit', 'Cost'],
    ['Package-private state changes in the entity package', 'Strong encapsulation: only staff and the restaurant can change a customer\'s state.', 'All entity classes must live in one package.'],
    ['Extension hooks in `Customer` from Stage 1 (`applyDiscount`, `chooseItem`, `onServed`)', 'Stage 2 needed no change to `Customer` or the rules.', 'Stage 1 contains two hooks that Regular customers do not override.'],
    ['`Game` returns event messages as strings', 'Simple, and the view just prints them.', '`Game` holds English text; a GUI would prefer event objects.'],
    ['Happy Hour wired into `Game` and `GameController` directly', 'Simple and easy to follow.', 'Stage 3 had to modify those two classes. A generic "turn listener" mechanism would avoid that but was more than this game needs.'],
    ['Each customer has its own seeded random sequence', 'Choices are reproducible, even if the player makes and corrects mistakes.', 'Food choice is not influenced by game state.'],
    ['Concrete console classes in `GameController`', 'Less code and no unnecessary interfaces.', 'A GUI would need a small view interface to be extracted.'],
  ]),
  P('**Alternative considered: a `CustomerType` enum with `switch` statements.** A single `Customer` class with a type field, where `Game` and `PriceCalculator` switch on the type to decide the loss, discount and special behaviour. It is shorter for three types, but every new type would require editing the turn rules in several places and testing them again. That breaks the open/closed principle and the brief\'s requirement that behaviour be dispatched through the customer objects. We chose subclasses, so Stage 2 only added two files.'),
  P('We also considered the Command pattern for staff actions (one class per action). It would allow undo and logging, but the game has only a few actions and needs no undo, so plain methods on `Game` were clearer.'),
];

const choices = [
  H1('5. How the player\'s choices change the result'),
  P('Every customer gets the same 18 turns, but the staff are the bottleneck. With one Waiter and an arrival every three turns, seating, taking the order and serving already fill the Waiter\'s turns. Any delay costs satisfaction, and a late customer may not pay before turn 18.'),
  bullet('**Order of tasks.** In Stage 1, seating each customer on arrival, taking the order next turn while the Chef cooks it, and serving the turn after gives five paid customers at 84 satisfaction each (victory, $57.00). A manager who stops after the first customer ends with one payment and a walk-out (defeat).'),
  bullet('**Critic timing (Stage 2).** The Critic rewards a dish served on the earliest possible turn (+10) and punishes any delay (-10). In the Stage 2 victory, on turn 13 the Waiter serves the Critic on time (64 → 74) and lets the newly arrived C5 wait one turn. In the defeat run the Critic, losing 12 per turn, walks out.'),
  bullet('**Happy Hour versus serving (Stage 3).** On turn 13 the Critic\'s 3-unit combo is ready just as C5 arrives with a 3-unit combo. Serving the Critic first would leave C5 unable to pay before turn 18. The player switches on Happy Hour, lets the Host seat C5, takes C5\'s order at 20% off and serves the Critic one turn late. The +15 recovery on turns 13 and 14 outweighs the Critic\'s -10 (recorded satisfaction 72), and all five customers pay: victory with $92.58 and an average of 86.0. Wasting Happy Hour on turn 1 and neglecting the kitchen leads to defeat with no payments.'),
  bullet('**Revenue against satisfaction.** Happy Hour cuts prices by 20%, so using it on expensive orders lowers revenue. Its value is keeping waiting customers above the walk-out line.'),
];

const evolution = [
  H1('6. Evolution across the three stages (GitHub evidence)'),
  P('Each stage is a separate tagged, runnable commit. Each stage\'s code builds, passes the rule checks that existed at that stage, and reproduces its own victory and defeat. We checked this by checking out each tag into a clean folder. The README lists the new and changed files for each transition with reasons and compare links. The optional pixel-art window was added after the `stage-3` tag, so the tags contain only the console game.'),
  table([1300, 2800, W - 4100], [
    ['Transition', 'New source files', 'Changed source files (reason)'],
    ['1 → 2', '`VIPCustomer`, `CriticCustomer`', '`Scenario`: setup registers a VIP on turn 4 and a Critic on turn 10. `Game`: the serve message shows satisfaction before → after, so the Critic\'s reaction is visible (no rule change).\nSource diff: 4 files, +147 / -3 lines.'],
    ['2 → 3', '`Host`, `ComboMeal`, `PriceModifier`, `HappyHour`', '`Scenario`: adds three combos to the menu. `PriceCalculator`: applies a list of modifiers. `Game`: Host action, Happy Hour activation, recovery and countdown. `GameController`: Happy Hour prompt and Host step. `ConsoleView`: Happy Hour status and Host task.\nSource diff: 9 files, +384 / -10 lines.'],
  ]),
  P('No earlier rules were rewritten. `Customer`, `Order`, `Waiter`, `Chef`, `Cashier` and `Restaurant` are unchanged since Stage 1, and Stage 1 and 2 behaviour is still covered by the same rule checks at Stage 3.'),
];

const checks = fs.readFileSync(path.join(root, 'runs', 'rule-checks-output.txt'), 'utf8').trim();
const evidence = [
  H1('7. Functional evidence'),
  H2('7.1 Automated rule checks (Stage 3, 40 checks)'),
  ...code(checks),
  H2('7.2 Reproducible runs (seed 2003)'),
  table([1400, 2650, 700, 1100, 1200, 1000, W - 8050], [
    ['Run', 'Script', 'Paid', 'Revenue', 'Avg satisfaction', 'Departures', 'Result'],
    ['Stage 1 victory', '`runs/stage1-victory.txt`', '5', '$57.00', '84.0', '0', '**VICTORY**'],
    ['Stage 1 defeat', '`runs/stage1-defeat.txt`', '1', '$15.00', '84.0', '1', 'DEFEAT'],
    ['Stage 2 victory', '`runs/stage2-victory.txt`', '5', '$65.10', '81.6', '0', '**VICTORY**'],
    ['Stage 2 defeat', '`runs/stage2-defeat.txt`', '2', '$23.10', '87.0', '1', 'DEFEAT'],
    ['Stage 3 victory', '`runs/stage3-victory.txt`', '5', '$92.58', '86.0', '0', '**VICTORY**'],
    ['Stage 3 defeat', '`runs/stage3-defeat.txt`', '0', '$0.00', 'N/A', '2', 'DEFEAT'],
  ]),
  P('Full transcripts are in `runs/*-output.txt`. Selected excerpts follow.'),
  H2('7.3 Invalid input is explained and the task is not used up (Stage 1, turn 3)'),
  ...code([
    'Waiter: 1) Seat a customer  2) Take an order  3) Serve a READY order  0) Wait > abc',
    '  ! "abc" is not a whole number. Please try again.',
    'Waiter: 1) Seat a customer  2) Take an order  3) Serve a READY order  0) Wait > 3',
    '  Order number to serve > 9',
    '  ! Not allowed: There is no order #9.',
    '  ! Please choose again.',
    'Waiter: 1) Seat a customer  2) Take an order  3) Serve a READY order  0) Wait > 3',
    '  Order number to serve > 1',
    '  * Waiter served order #1 Burger for C1. C1 (Regular) is now eating (satisfaction 84).',
  ]),
  H2('7.4 A dish going READY → SERVED → paid (Stage 1, customer C1)'),
  ...code([
    'Turn 2  * Waiter took order #1: C1 (Regular) ordered Burger (1 prep unit) for $15.00.',
    '        * Chef finished order #1 Burger for C1 (unit 1 of 1). It is READY and can be served next turn.',
    'Turn 3  * Waiter served order #1 Burger for C1. C1 (Regular) is now eating (satisfaction 84).',
    'Turn 4  * C1 (Regular) finished eating and is READY_TO_PAY (pays next turn at the earliest).',
    'Turn 5  * Cashier collected $15.00 from C1 (Regular). Satisfaction 84 recorded; table freed.',
  ]),
  H2('7.5 VIP discount and Critic behaviour (Stage 2)'),
  ...code([
    '* Waiter took order #2: C2 (VIP) ordered Salad (1 prep unit) for $8.10.',
    '* Waiter took order #4: C4 (Critic) ordered Pasta (2 prep units) for $18.00.',
    '* Waiter served order #4 Pasta for C4. C4 (Critic) is now eating (satisfaction 64 -> 74 (reaction to service)).',
  ]),
  H2('7.6 Stage 3 features: Host, combo, Happy Hour (Stage 3, turns 13-16)'),
  ...code([
    '* Happy Hour is ON for turns 13 and 14: 20% off new orders, waiting customers recover 15 each turn.',
    '* Happy Hour: 1 waiting customer recovered 15 satisfaction (maximum 100).',
    'Turn 13 | Revenue $43.44 | Avg satisfaction (paid) 91.3 | Paid 3 | Happy Hour ON (2 turns left incl. this one)',
    '  Table 2: C4 (Critic)    sat  79  ORDERED      order #4 Burger + Pasta Combo READY',
    '* Host seated C5 (Regular) at Table 1.',
    '* Waiter took order #5: C5 (Regular) ordered Salad + Pasta Combo (3 prep units) for $19.44',
    '  (menu price $24.30, Happy Hour applied).',
    'Turn 14 | ... | Happy Hour ON (1 turn left incl. this one)',
    '* Waiter served order #4 Burger + Pasta Combo for C4. C4 (Critic) is now eating',
    '  (satisfaction 82 -> 72 (reaction to service)).',
    'Turn 16',
    'Host: 1) Seat a customer  0) Wait > 1',
    '  ! Not allowed: Table 2 is occupied by C4 (Critic).',
  ]),
  H2('7.7 Final results (Stage 3)'),
  ...code([
    '        *** VICTORY ***',
    '[MET]    Paid customers: 5 (target 4)',
    '[MET]    Revenue: $92.58 (target $45.00)',
    '[MET]    Average satisfaction: 86.0 (target 60)',
    'Dishes served: 5 | Unhappy departures: 0 | Turns used: 18/18',
  ]),
  ...code([
    '        *** DEFEAT ***',
    '[MISSED] Paid customers: 0 (target 4)',
    '[MISSED] Revenue: $0.00 (target $45.00)',
    '[MISSED] Average satisfaction: N/A (target 60)',
    'Dishes served: 0 | Unhappy departures: 2 | Turns used: 18/18',
  ]),
];

const features = [
  H1('8. Additional features'),
  bullet('**Reproducible scripted play.** Any text file can be redirected into the game. Lines starting with `#` are comments, and when a script ends every remaining choice safely defaults to "Wait". `--echo` prints each answer so transcripts read like a live session. This makes the victory and defeat demonstrations repeatable.'),
  bullet('**Configurable seed** (`--seed N`) to try different customer orders. The default 2003 is used for all evidence.'),
  bullet('**Offline rule checks** (40 checks, no test library), including a turn-by-turn replay of the brief\'s Section 3.3 example and the brief\'s price examples ($24.30 combo, $10.80 VIP Happy Hour burger).'),
  bullet('**Helpful display**: each turn lists the useful task for every staff member, the turns left in Happy Hour, and the menu price whenever a discount applies.'),
  bullet('**Pixel-art window** (`run.bat --gui`): an animated graphical version of the same game, added after `stage-3`. It is a second boundary: `PixelGame` calls the same public `Game` actions as the console and `PixelRoom` only draws the current state, so no rule was changed or duplicated. Its shift log also shows each waiting customer\'s satisfaction loss and whether each served order was discounted.'),
  bullet('**Demo jumps** in the pixel-art window: `DemoJump` starts a fresh game and replays the recorded victory or defeat run to a chosen point (turn 4 VIP, turn 10 Critic, turn 13 Happy Hour decision, or either ending), so a presenter can move forwards or back and always reach the same state.'),
];

const reflection = [
  H1('9. Reflection'),
  P('**What went well.** Planning the customer and menu hierarchies before Stage 1 paid off. Stage 2 needed two new classes and a two-line setup change, and combos in Stage 3 needed no change to orders or the kitchen. Writing the rule checks early, starting with the brief\'s Pasta example, caught timing mistakes. Examples were "served this turn" versus "next turn" and when a customer becomes ready to pay.'),
  P('**What was harder than expected.** The order of events within a turn (Host, then Waiter, then Chef, then payment, then satisfaction loss) has many edge cases. One example: whether Happy Hour recovery happens before or after the new arrival. Making every invalid choice "free" required a strict validate-first, act-second pattern in every staff class.'),
  P('**What we would do differently.** We would introduce Happy Hour through a general turn-event mechanism, so that Stage 3 changed `Game` and `GameController` less. We would also return event objects instead of text. The pixel-art window did reuse `Game` unchanged, but it can only print the English messages from `Game`; with event objects it could react to each event directly.'),
  P('**What we learned.** Good object-oriented design shows up when requirements change. The stage tags let us measure this directly by how few existing lines each new stage had to touch.'),
];

const heading = (size, before, after) => ({
  run: { font: FONT, size, bold: true, color: BLUE },
  paragraph: { spacing: { before, after }, keepNext: true, keepLines: true },
});

const doc = new Document({
  creator: 'CT2003 group',
  title: 'Restaurant Rush - CT2003 Group Assignment Report',
  styles: {
    default: { document: { run: { font: FONT, size: 21 }, paragraph: { spacing: { line: 276 } } } },
    paragraphStyles: [
      { id: 'Title', name: 'Title', basedOn: 'Normal', next: 'Normal',
        run: { font: FONT, size: 56, bold: true, color: '1D1D1D' }, paragraph: { spacing: { before: 0, after: 120 } } },
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        ...heading(32, 360, 160),
        paragraph: { spacing: { before: 360, after: 160 }, keepNext: true, keepLines: true, outlineLevel: 0,
          border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: '3A5A8C', space: 2 } } } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        ...heading(25, 240, 100), paragraph: { spacing: { before: 240, after: 100 }, keepNext: true, keepLines: true, outlineLevel: 1 } },
    ],
  },
  numbering: {
    config: [
      { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] },
      { reference: 'numbers', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 540, hanging: 300 } } } }] },
    ],
  },
  sections: [
    { properties: A4, footers: { default: footer() }, children: [...cover, ...overview] },
    diagram(1, '2.1 Stage 1 class diagram: basic restaurant operation'),
    diagram(2, '2.2 Stage 2 class diagram: customer behaviour (new classes outlined in red)'),
    diagram(3, '2.3 Stage 3 class diagram: final design, matches the submitted code (new classes outlined in red)'),
    { properties: A4, footers: { default: footer() },
      children: [...design, ...tradeoffs, ...choices, ...evolution, ...evidence, ...features, ...reflection] },
  ],
});

const out = path.join(__dirname, 'RestaurantRush_Report.docx');
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(out, buf);
  console.log('Wrote ' + out);
});
