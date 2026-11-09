# Restaurant Rush

A turn-based restaurant management game for the command line, written in Java for CT2003.
You are the manager: each turn you decide what the Host, Waiter and Chef do, while customers
lose patience as they wait. After 18 turns you win if at least 4 customers paid, revenue is at
least $45.00 and the average satisfaction of paid customers is at least 60.

**Repository:** `https://github.com/<OWNER>/<REPO>` *(replace with your group's URL after pushing)*

## Build and run

Needs JDK 17 or newer. No other libraries and no network access are required.

| | Windows | macOS / Linux / Git Bash |
|---|---|---|
| Build | `build.bat` | `./build.sh` |
| Play | `run.bat` | `./run.sh` |
| Rule checks (40 automated checks) | `test.bat` | `./test.sh` |

Or by hand from the project folder:

```
javac --release 17 -d out $(find src -name "*.java")
java -cp out restaurantrush.Main
```

For the pixel-art window, run `.\run.bat --gui` in PowerShell or `./run.sh --gui` on macOS/Linux after building. Click **Start turn** and choose each staff action in the sidebar. The sprites and room tiles load from `assets/img/`.

Options: `--seed N` changes the seed that decides what customers order (default `2003`);
`--echo` prints each answer read from a redirected script, so transcripts are readable.

Replay a recorded run (each stage has a victory and a defeat script in `runs/`):

```
java -cp out restaurantrush.Main --echo < runs/stage3-victory.txt
```

To play an earlier stage, check out its tag and build again: `git checkout stage-1`.

## How to play

Each turn the game shows the turn number, revenue, average satisfaction, the waiting queue,
both tables, every order in progress and the tasks each staff member can do. Then you choose:

1. **Happy Hour** (Stage 3, once per game): switch it on at the start of a turn.
2. **Host** (Stage 3): seat one queued customer, or wait.
3. **Waiter**: seat a customer, take an order, serve a READY order, or wait.
4. **Chef**: cook one preparation unit of one order, or wait.

The Cashier then automatically takes one payment (oldest READY_TO_PAY first), and every
customer not yet served loses satisfaction. An invalid choice explains why and lets you
choose again without using up the staff task.

### Rules worth knowing

* A dish that becomes READY this turn can be served next turn at the earliest.
* A served customer eats for one full turn, becomes READY_TO_PAY, and pays the turn after.
* The customer arriving on turn 16 cannot pay before the game ends, so at most five can pay.
* Money is stored as integer cents and rounded half-up to the nearest cent.

### Customers

| Customer | Loses per waiting turn | Bill | Special behaviour |
|---|---|---|---|
| Regular | 8 | full price | – |
| VIP | 5 | 10% off | – |
| Critic | 12 | full price | Always orders the most expensive menu item. When served, +10 satisfaction if the dish arrives on the earliest possible turn (order turn + preparation units), otherwise −10. |

Base arrivals: C1 Regular (turn 1), C2 VIP (4), C3 Regular (7), C4 Critic (10), C5 Regular (13),
C6 Regular (16).

**Food choice rule:** Regular and VIP customers pick uniformly at random from the whole menu
(dishes and, in Stage 3, combos). Each customer has its own random sequence seeded from the
game seed and the customer number, so the same seed always gives the same choices. The
choice is shown when the order is taken.

### Menu (Stage 3)

| Item | Price | Prep units |
|---|---|---|
| Salad | $9.00 | 1 |
| Burger | $15.00 | 1 |
| Pasta | $18.00 | 2 |
| Salad + Burger Combo | $21.60 | 2 |
| Salad + Pasta Combo | $24.30 | 3 |
| Burger + Pasta Combo | $29.70 | 3 |

A combo costs 90% of its two components (rounded to the nearest cent) and needs the sum of
their preparation units.

### Happy Hour (Stage 3)

Once per game, at the start of a turn, for that turn and the next (the screen shows the turns
left). Orders taken during it get 20% off, after any VIP discount (a VIP Burger is
$15 × 0.9 × 0.8 = $10.80). The price is locked when the order is taken. At the start of each
active turn, customers still waiting for a table or food recover 15 satisfaction (maximum 100).

## Stages and tags

| Tag | Stage | Adds |
|---|---|---|
| `stage-1` | Basic restaurant operation | Regular customers, menu, Waiter, Chef, Cashier, full turn sequence, victory and defeat |
| `stage-2` | Customer behaviour | `VIPCustomer`, `CriticCustomer` |
| `stage-3` | New role and menu policy | `Host`, `ComboMeal`, Happy Hour (`HappyHour`, `PriceModifier`) |

Each tag is a runnable commit with its own class diagram in `docs/uml/` and its own
reproducible runs in `runs/`.

### Stage 1 → Stage 2

Compare: `https://github.com/<OWNER>/<REPO>/compare/stage-1...stage-2`

| Change | Files | Reason |
|---|---|---|
| New | `entity/VIPCustomer.java`, `entity/CriticCustomer.java` | The new customer types. Each overrides the `Customer` hooks (`getSatisfactionLoss()`, `applyDiscount()`, `chooseItem()`, `onServed()`), so the turn rules call them without type checks. |
| Changed | `control/Scenario.java` | Setup only: turn 4 now brings a VIP and turn 10 a Critic. There are still six arrivals. |
| Changed | `control/Game.java` | The serve message now shows the satisfaction before and after serving, so the Critic's reaction is visible. No rule changed. |
| Changed | `test/restaurantrush/RuleChecks.java` | New checks for VIP and Critic behaviour. |
| New | `runs/stage2-*.txt`, `docs/uml/stage2-*` | Stage 2 runs and class diagram. |
| Deleted | – | – |

`Customer`, `Order`, `Waiter`, `Chef`, `Cashier`, `Restaurant` and `GameController` were not
modified: the Stage 1 design was already open for new customer types.

### Stage 2 → Stage 3

Compare: `https://github.com/<OWNER>/<REPO>/compare/stage-2...stage-3`

| Change | Files | Reason |
|---|---|---|
| New | `entity/Host.java` | A new `Staff` subclass that can only seat customers. |
| New | `entity/ComboMeal.java` | A `MenuItem` built from two other `MenuItem`s. Orders, the Chef and pricing handle it like any dish. |
| New | `control/PriceModifier.java`, `control/HappyHour.java` | Restaurant-wide pricing rules applied after customer discounts. Happy Hour also tracks its two turns and the +15 recovery. |
| Changed | `control/Scenario.java` | Setup only: the menu now also offers the three combos. |
| Changed | `control/PriceCalculator.java` | Holds a list of `PriceModifier`s and applies them after the customer discount. Future promotions need no further change here. |
| Changed | `control/Game.java` | Owns the Host and Happy Hour. Adds `hostSeat()` and `activateHappyHour()`, applies the recovery at turn start and counts Happy Hour down at turn end. |
| Changed | `control/GameController.java` | Asks about Happy Hour at the start of each turn while it is unused, and asks for the Host's task before the Waiter's. |
| Changed | `boundary/ConsoleView.java` | Shows Happy Hour status with turns left, the Host's available task and the new rules in the welcome text. |
| Changed | `test/restaurantrush/RuleChecks.java` | The Critic check no longer assumes Pasta, because the Burger + Pasta Combo is now the most expensive item. Added checks for combos, Happy Hour and the Host. |
| New | `runs/stage3-*.txt`, `docs/uml/stage3-*` | Stage 3 runs and the final class diagram. |
| Deleted | – | – |

`Customer` and its subclasses, `Order`, `Waiter`, `Chef`, `Cashier`, `Restaurant` and `Menu`
were not modified.

## Repository layout

| Path | Contents |
|---|---|
| `src/restaurantrush/boundary` | Console input and output only |
| `src/restaurantrush/control` | Turn loop, game rules, scenario setup, pricing, scoring |
| `src/restaurantrush/entity` | Restaurant, customers, orders, menu, staff |
| `test/` | Offline rule checks (no test library needed) |
| `runs/` | Reproducible victory and defeat scripts for every stage, with their output |
| `docs/uml/` | Class diagram for each stage (SVG and PNG) and the script that draws them |
| `docs/report/` | PDF report and its source |

## Additional features

* Scripted, reproducible runs: any input file can be redirected into the game; comment lines
  starting with `#` are skipped, and if the script ends every remaining choice is "Wait".
* `--seed` to try different customer orders, and `--echo` for readable transcripts.
* 40 offline rule checks (`test.sh` / `test.bat`), including the brief's Section 3.3 example.
* The Critic's reaction to service speed, and a live list of useful staff tasks each turn.
