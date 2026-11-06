// Stage 3 class diagram model (final design): Stage 2 plus Host, ComboMeal, PriceModifier and HappyHour.
// Render with: node render.js stage3.model.js stage3-class-diagram.svg
'use strict';
const stage2 = require('./stage2.model.js').parts;

const DY = 260; // the entity package moves down to make room for the new control classes

function shiftY(y) {
  return y >= 560 ? y + DY : y;
}

function classes() {
  const list = stage2.classes();
  for (const c of list) {
    if (c.pkg === 'entity') {
      c.y += DY;
    }
  }
  const byId = Object.fromEntries(list.map((c) => [c.id, c]));
  byId.GameController.ops.push('- offerHappyHour(): void', '- hostStep(): void');
  byId.Game.ops.splice(2, 0, '+ activateHappyHour(): void', '+ hostSeat(customerId: int, table: int): void');
  byId.Game.ops.push('+ getHappyHour(): HappyHour');
  byId.PriceCalculator.attrs = ['- modifiers: List<PriceModifier>'];
  byId.PriceCalculator.ops = ['+ addModifier(m: PriceModifier): void', '+ quote(c: Customer, item: MenuItem): Money'];
  byId.ConsoleView.ops.push('# describeHappyHour(h: HappyHour): String');
  byId.InvalidActionException.y = 1230 + DY;
  byId.Money.y = 1110 + DY;
  byId.VIPCustomer.isNew = false;
  byId.CriticCustomer.isNew = false;
  list.push(
    { id: 'Host', pkg: 'entity', name: 'Host', isNew: true, x: 80, y: 1130 + DY,
      attrs: [], ops: ['+ seat(r: Restaurant, c: Customer, t: Table): void'] },
    { id: 'ComboMeal', pkg: 'entity', name: 'ComboMeal', isNew: true, x: 1780, y: 930 + DY,
      attrs: ['$+ PRICE_PERCENT: int = 90', '- first: MenuItem', '- second: MenuItem'],
      ops: ['+ getPrice(): Money', '+ getPrepUnits(): int', '+ getFirst(): MenuItem', '+ getSecond(): MenuItem'] },
    { id: 'PriceModifier', pkg: 'control', name: 'PriceModifier', stereo: 'interface', isNew: true, x: 900, y: 590,
      attrs: [], ops: ['*+ adjust(price: Money): Money'] },
    { id: 'HappyHour', pkg: 'control', name: 'HappyHour', isNew: true, x: 1250, y: 570,
      attrs: ['$+ DURATION: int = 2', '$+ PRICE_PERCENT: int = 80', '$+ RECOVERY: int = 15', '- used: boolean', '- turnsRemaining: int'],
      ops: ['+ isAvailable(): boolean', '+ activate(): void', '+ isActive(): boolean', '+ getTurnsRemaining(): int',
        '+ applyTurnStartRecovery(r: Restaurant): int', '+ endTurn(): void', '+ adjust(price: Money): Money'] },
  );
  return list;
}

function edges() {
  const list = stage2.edges();
  for (const e of list) {
    if (e.points) e.points = e.points.map(([x, y]) => [x, shiftY(y)]);
    if (e.labelAt) e.labelAt = [e.labelAt[0], shiftY(e.labelAt[1])];
    if (e.fmAt) e.fmAt = [e.fmAt[0], shiftY(e.fmAt[1])];
    if (e.tmAt) e.tmAt = [e.tmAt[0], shiftY(e.tmAt[1])];
    if (e.via !== undefined && (e.fs === 'top' || e.fs === 'bottom') && e.via >= 560) e.via += DY;
  }
  const find = (from, to) => list.find((e) => e.from === from && e.to === to);
  Object.assign(find('Game', 'Staff'), { tm: '4', label: 'waiter, chef, cashier, host',
    fo: 0.85, points: [[438, 500], [438, 845], [194, 845]], labelAt: [300, 845] });
  Object.assign(find('Scenario', 'Customer'), { points: [[1200, 830], [1070, 830]], labelAt: [1200, 815] });
  Object.assign(find('Game', 'GameStats'), { points: [[763, 557], [1680, 557]] });
  Object.assign(find('Staff', 'InvalidActionException'), { points: [[455, 742 + DY], [455, 1255 + DY]], labelAt: [455, 1190 + DY] });
  Object.assign(find('Dish', 'MenuItem'), { via: 1720 });
  list.push(
    { from: 'Host', to: 'Staff', kind: 'inherit', fs: 'left', ts: 'bottom', fo: 0.5, too: 0.1, points: [[60, 1155 + DY]] },
    { from: 'ComboMeal', to: 'MenuItem', kind: 'inherit', fs: 'left', ts: 'right', fo: 0.3, too: 0.5, via: 1720 },
    { from: 'ComboMeal', to: 'MenuItem', kind: 'aggregate', fs: 'bottom', ts: 'bottom', fo: 0.3, too: 0.6, nav: true, tm: '2',
      label: 'first, second', points: [[1856, 1090 + DY], [1610, 1090 + DY]], labelAt: [1740, 1090 + DY] },
    { from: 'PriceCalculator', to: 'PriceModifier', kind: 'aggregate', fs: 'bottom', ts: 'top', fo: 0.35, too: 0.5, nav: true, tm: '0..*', label: 'modifiers' },
    { from: 'HappyHour', to: 'PriceModifier', kind: 'realize', fs: 'left', ts: 'right', fo: 0.2, too: 0.5 },
    { from: 'Game', to: 'HappyHour', kind: 'compose', fs: 'bottom', ts: 'bottom', fo: 0.75, too: 0.5, tm: '1',
      points: [[714, 795], [1400, 795]], labelAt: [1000, 795], label: 'happyHour' },
    { from: 'HappyHour', to: 'Customer', kind: 'dep', fs: 'right', ts: 'right', fo: 0.85, too: 0.02, label: 'recover(15)',
      points: [[1640, 742], [1640, 860], [1160, 860], [1160, 909]], labelAt: [1640, 800] },
  );
  // The HappyHour -> Customer dependency is drawn to the Customer's top-right corner area.
  const dep = list[list.length - 1];
  Object.assign(dep, { ts: 'top', too: 0.95 });
  return list;
}

function notes() {
  const list = stage2.notes();
  for (const n of list) {
    if (n.y >= 600) n.y += DY;
  }
  list.find((n) => n.lines[1] === 'Immutable value object;').y = 1385;
  const poly = list.find((n) => n.lines[0] === 'Polymorphism');
  Object.assign(poly, { x: 1560, y: 1180 + DY, w: 200 });
  list.push(
    { lines: ['Composite / composition', 'A ComboMeal is a MenuItem built', 'from two MenuItems: price = 90%', 'of their sum, units = their sum.'],
      x: 1950, y: 1060, w: 190, to: 'ComboMeal', ns: 'left', cs: 'right', co: 0.2 },
    { lines: ['Open/closed pricing', 'Customer discount first, then each', 'PriceModifier. Happy Hour was added', 'without touching Waiter or Order.'],
      x: 1640, y: 580, w: 210, to: 'HappyHour', ns: 'left', cs: 'right', co: 0.05 },
  );
  return list;
}

module.exports = {
  title: 'Restaurant Rush - Stage 3 class diagram (final design: Host, ComboMeal, Happy Hour)',
  subtitle: 'Red outline = new in Stage 3. This diagram matches the final submitted code.',
  width: 2220, height: 1760,
  packages: [
    { id: 'boundary', name: 'restaurantrush.boundary' },
    { id: 'control', name: 'restaurantrush.control', extraBottom: 26 },
    { id: 'entity', name: 'restaurantrush.entity', extraBottom: 185 },
  ],
  classes: classes(), edges: edges(), notes: notes(),
  legend: [1930, 80],
  legendNew: 'new in Stage 3',
};
