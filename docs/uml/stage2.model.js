// Stage 2 class diagram model: Stage 1 plus VIPCustomer and CriticCustomer.
// Render with: node render.js stage2.model.js stage2-class-diagram.svg
'use strict';
const stage1 = require('./stage1.model.js').parts;

function classes() {
  const list = stage1.classes();
  const regular = list.find((c) => c.id === 'RegularCustomer');
  regular.y = 870;
  list.push(
    { id: 'VIPCustomer', pkg: 'entity', name: 'VIPCustomer', isNew: true, x: 1210, y: 975,
      attrs: ['$+ SATISFACTION_LOSS: int = 5', '$+ PRICE_PERCENT: int = 90'],
      ops: ['+ getSatisfactionLoss(): int', '+ applyDiscount(basePrice: Money): Money', '+ getTypeLabel(): String'] },
    { id: 'CriticCustomer', pkg: 'entity', name: 'CriticCustomer', isNew: true, x: 1210, y: 1110,
      attrs: ['$+ SATISFACTION_LOSS: int = 12', '$+ PERFECT_SERVICE_BONUS: int = 10', '$+ SLOW_SERVICE_PENALTY: int = 10'],
      ops: ['+ getSatisfactionLoss(): int', '+ chooseItem(menu: Menu): MenuItem', '+ isPerfectService(turn: int): boolean',
        '# onServed(turn: int): void', '+ getTypeLabel(): String'] },
  );
  return list;
}

function edges() {
  const list = stage1.edges();
  const regular = list.find((e) => e.from === 'RegularCustomer');
  Object.assign(regular, { fo: 0.5, too: 0.95, via: 1180 });
  const items = list.find((e) => e.from === 'Menu' && e.to === 'MenuItem');
  items.points = [[587, 1420], [1550, 1420]];
  list.push(
    { from: 'VIPCustomer', to: 'Customer', kind: 'inherit', fs: 'left', ts: 'right', fo: 0.5, too: 0.95, via: 1180 },
    { from: 'CriticCustomer', to: 'Customer', kind: 'inherit', fs: 'left', ts: 'right', fo: 0.5, too: 0.95, via: 1180 },
  );
  return list;
}

function notes() {
  const list = stage1.notes().filter((n) => n.lines[0] !== 'Polymorphism' && !n.lines[1].startsWith('State changes'));
  list.push(
    { lines: ['Polymorphism', 'Game and PriceCalculator call', 'getSatisfactionLoss(), applyDiscount(),', 'chooseItem() and onServed() on any', 'Customer; no instanceof checks.'],
      x: 1580, y: 1180, w: 215, to: 'VIPCustomer', ns: 'left', cs: 'right', co: 0.5 },
    { lines: ['Encapsulation', 'State changes are', 'package-private (~);', 'satisfaction stays 0-100', 'via loseSatisfaction()/', 'recover()/changeSatisfaction().'],
      x: 700, y: 1215, w: 170, to: 'Customer', ns: 'top', cs: 'bottom', co: 0.05 },
    { lines: ['Critic special behaviour', 'Orders menu.mostExpensive().', 'onServed(): +10 if served by', 'orderedTurn + prepUnits,', 'otherwise -10 (harsh review).'],
      x: 1210, y: 1300, w: 190, to: 'CriticCustomer', ns: 'top', cs: 'bottom', co: 0.4 },
  );
  return list;
}

module.exports = {
  title: 'Restaurant Rush - Stage 2 class diagram (customer behaviour extension)',
  subtitle: 'Red outline = new in Stage 2. Only Scenario (setup) changed among Stage 1 classes; Game only gained a clearer serve message.',
  width: 2220, height: 1490,
  packages: [
    { id: 'boundary', name: 'restaurantrush.boundary' },
    { id: 'control', name: 'restaurantrush.control', extraBottom: 16 },
    { id: 'entity', name: 'restaurantrush.entity', extraBottom: 185 },
  ],
  classes: classes(), edges: edges(), notes: notes(),
  legend: [1930, 80],
  legendNew: 'new in Stage 2',
};
module.exports.parts = { classes, edges, notes };
