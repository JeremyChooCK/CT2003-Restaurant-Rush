# Restaurant Rush

Restaurant Rush is a turn-based Java restaurant management game for CT2003. Manage two tables over
18 turns. To win, at least four customers must pay, revenue must reach $45.00, and the average
satisfaction of paying customers must reach 60.

[Repository](https://github.com/JeremyChooCK/CT2003-Restaurant-Rush)

## Build and run

Use a JDK 17 or newer with both `java` and `javac` on your PATH. Run the commands from the project root.
The game works offline and uses the standard Java libraries, including Swing for the graphical mode.

| Task | Windows PowerShell | macOS / Linux / Git Bash |
|---|---|---|
| Build | `.\build.bat` | `./build.sh` |
| Play in the pixel-art window | `.\run.bat --gui` | `./run.sh --gui` |
| Play in the terminal | `.\run.bat` | `./run.sh` |
| Run automated rule checks | `.\test.bat` | `./test.sh` |

After opening the graphical game, click **Start turn** and use the staff action buttons. The Waiter
carries new tickets to the Chef. The **ORDER** box shows tickets awaiting prep and **PICKUP** shows
finished dishes. When you choose **Serve**, the Waiter carries the dish from the counter to the table.
The sprites and restaurant tiles are in [assets/img](assets/img).

The shift log also shows how much satisfaction each waiting customer lost that turn, and whether each
served order was at full price or discounted from its menu price.

**Demo jumps.** For live demonstrations, choose a point in the **Demo jump** menu at the top of the window
and click **Jump**. Every jump starts a fresh game and replays the recorded run with seed `2003` up to that
point, so you can go forwards or back at any time and always land on the same state:

| Jump | What has been played | Used for |
|---|---|---|
| Turn 1: new game | Nothing | Launching the game; Stage 1 walkthrough |
| Turn 4: VIP arrives | Turns 1–3 of the victory run | VIP discount and patience |
| Turn 10: Critic arrives | Turns 1–9 of the victory run | Critic's order and reaction |
| Turn 13: Happy Hour decision | Turns 1–12 of the victory run | The turn-13 choice |
| End: victory | All 18 turns of [stage3-victory.txt](runs/stage3-victory.txt) | Victory result |
| End: defeat | All 18 turns of [stage3-defeat.txt](runs/stage3-defeat.txt) | Defeat result |

The jumps call the same public `Game` actions as the buttons, so the game rules are unchanged.

Use `--seed N` to change the seed that determines customers' food choices (default `2003`). In terminal
mode, `--echo` prints each answer supplied by a replay file.

### Presentation and replays

- [Current PowerPoint and embedded speaker notes](docs/presentation/RestaurantRush_Presentation.pptx).
  Slide 6 maps classes to methods. Slide 7 shows the graphical launch. Slide 15 is a live VIP and Critic
  demo using the demo jumps to turns 4 and 10.
- [Stage 1 saved run](runs/stage1-victory-output.txt) and [Stage 2 saved run](runs/stage2-victory-output.txt)
  support the earlier-stage examples in the deck.
- [Stage 3 victory](runs/stage3-victory-output.txt) and [Stage 3 defeat](runs/stage3-defeat-output.txt)
  show the two outcomes from the current build. Turn 13 of the victory run shows the Happy Hour choice.

To replay the current Stage 3 build after compiling, use one of these commands. Substitute
`stage3-defeat.txt` for the defeat run.

**Windows PowerShell**

```powershell
Get-Content runs/stage3-victory.txt | .\run.bat --echo
```

**macOS / Linux / Git Bash**

```sh
./run.sh --echo < runs/stage3-victory.txt
```


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

## Stage design

| Planned tag | Stage | Adds |
|---|---|---|
| `stage-1` | Basic restaurant operation | Regular customers, menu, Waiter, Chef, Cashier, full turn sequence, victory and defeat |
| `stage-2` | Customer behaviour | `VIPCustomer`, `CriticCustomer` |
| `stage-3` | New role and menu policy | `Host`, `ComboMeal`, Happy Hour (`HappyHour`, `PriceModifier`) |

The three stage tags are pending publication. The tables below document the design changes. The saved earlier-stage diagrams and transcripts are in [docs/uml](docs/uml) and [runs](runs).

### Stage 1 → Stage 2

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
| `src/restaurantrush/boundary` | Terminal input and output, graphical controls and animation |
| `src/restaurantrush/control` | Turn loop, game rules, scenario setup, pricing, scoring |
| `src/restaurantrush/entity` | Restaurant, customers, orders, menu, staff |
| `test/` | Offline rule checks (no test library needed) |
| `runs/` | Stage 3 replay scripts and saved evidence for all three stages |
| `docs/uml/` | Class diagram for each stage (SVG and PNG) and the script that draws them |
| `docs/report/` | PDF report and its source |
| `docs/presentation/` | Current PowerPoint with speaker notes and original terminal-demo materials |
| `assets/img/` | Pixel-art sprites, food icons and restaurant tiles |

## Additional features

* Scripted, reproducible runs: any input file can be redirected into the game; comment lines
  starting with `#` are skipped, and if the script ends every remaining choice is "Wait".
* `--seed` to try different customer orders, and `--echo` for readable transcripts.
* Offline rule checks (`test.sh` / `test.bat`), including the brief's Section 3.3 example.
* The Critic's reaction to service speed, and a live list of useful staff tasks each turn.
* A pixel-art window (`--gui`) that drives the same `Game` as the terminal, with animated staff and
  customers. Only boundary classes were added (`PixelGame`, `PixelRoom`, `DemoJump`); no rule changed.
* Demo jumps in the pixel-art window, which replay the recorded runs to any key turn for presentations.
