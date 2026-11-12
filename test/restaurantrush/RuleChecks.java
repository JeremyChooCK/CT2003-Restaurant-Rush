package restaurantrush;

import java.util.Optional;
import java.util.function.IntFunction;

import restaurantrush.control.Game;
import restaurantrush.control.GameResult;
import restaurantrush.control.Scenario;
import restaurantrush.entity.Customer;
import restaurantrush.entity.CustomerStatus;
import restaurantrush.entity.InvalidActionException;
import restaurantrush.entity.Menu;
import restaurantrush.entity.MenuItem;
import restaurantrush.entity.Money;
import restaurantrush.entity.OrderStatus;
import restaurantrush.entity.RegularCustomer;

/**
 * Self-contained rule checks that need no test library, so they run offline.
 * Run with {@code ./test.sh} or {@code test.bat}. Each check prints PASS or
 * FAIL and the program exits with code 1 if any check fails.
 */
public final class RuleChecks {

    private static int failures;

    private RuleChecks() {
    }

    /**
     * Runs every check.
     *
     * @param args not used
     * @throws InvalidActionException if a valid action is unexpectedly rejected
     */
    public static void main(String[] args) throws InvalidActionException {
        moneyRounding();
        pastaExampleFromBrief();
        invalidChoiceDoesNotUseTask();
        dishFinishedThisTurnCannotBeServed();
        unhappyCustomerLeavesWithoutPaying();
        allWaitRunIsDefeat();
        System.out.println(failures == 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED");
        if (failures > 0) {
            System.exit(1);
        }
    }

    /** Money rounds half-up to the nearest cent and displays two decimals. */
    private static void moneyRounding() {
        check("Money: 90% of $27.00 is $24.30", Money.ofDollars(27).percent(90).toString().equals("$24.30"));
        check("Money: $15 x 90% x 80% is $10.80",
                Money.ofDollars(15).percent(90).percent(80).equals(Money.ofCents(1080)));
        check("Money: $9.00 + $15.00 = $24.00", Money.ofDollars(9).plus(Money.ofDollars(15)).toString().equals("$24.00"));
    }

    /** Replays the brief's Section 3.3 example: one Pasta customer. */
    private static void pastaExampleFromBrief() throws InvalidActionException {
        Game game = new Game(new SingleCustomerScenario("Pasta"));
        game.startTurn();                         // turn 1
        game.waiterSeat(1, 1);
        endTurn(game);
        Customer c1 = game.getRestaurant().getCustomers().get(0);
        check("3.3 turn 1: seated, satisfaction 92", c1.getSatisfaction() == 92 && c1.getStatus() == CustomerStatus.SEATED);

        game.startTurn();                         // turn 2
        game.waiterTakeOrder(1);
        game.chefPrepare(1);
        endTurn(game);
        check("3.3 turn 2: Pasta ordered, 1 of 2 units, satisfaction 84",
                c1.getOrder().getItem().getName().equals("Pasta") && c1.getOrder().getUnitsDone() == 1
                        && c1.getSatisfaction() == 84);

        game.startTurn();                         // turn 3
        game.chefPrepare(1);
        endTurn(game);
        check("3.3 turn 3: READY, satisfaction 76",
                c1.getOrder().getStatus() == OrderStatus.READY && c1.getSatisfaction() == 76);

        game.startTurn();                         // turn 4
        game.waiterServe(1);
        endTurn(game);
        check("3.3 turn 4: SERVED, satisfaction stays 76",
                c1.getOrder().getStatus() == OrderStatus.SERVED && c1.getSatisfaction() == 76);

        game.startTurn();                         // turn 5
        endTurn(game);
        check("3.3 turn 5: READY_TO_PAY", c1.getStatus() == CustomerStatus.READY_TO_PAY);

        game.startTurn();                         // turn 6
        endTurn(game);
        check("3.3 turn 6: PAID $18.00 with satisfaction 76, table freed",
                c1.getStatus() == CustomerStatus.PAID
                        && game.getStats().getRevenue().equals(Money.ofDollars(18))
                        && game.getStats().getAverageSatisfaction().getAsDouble() == 76.0
                        && game.getRestaurant().getTables().get(0).isFree());
    }

    /** A rejected choice explains why and leaves the staff task unused. */
    private static void invalidChoiceDoesNotUseTask() throws InvalidActionException {
        Game game = new Game(new SingleCustomerScenario("Salad"));
        game.startTurn();
        expectRejected("Take order at an empty table is rejected", () -> game.waiterTakeOrder(2));
        expectRejected("Seating at Table 9 is rejected", () -> game.waiterSeat(1, 9));
        expectRejected("Cooking a missing order is rejected", () -> game.chefPrepare(5));
        game.waiterSeat(1, 1);
        check("Waiter can still act after rejected choices",
                game.getRestaurant().getCustomers().get(0).getStatus() == CustomerStatus.SEATED);
        expectRejected("Waiter cannot do a second task", () -> game.waiterTakeOrder(1));
    }

    /** A dish finished this turn can only be served next turn. */
    private static void dishFinishedThisTurnCannotBeServed() throws InvalidActionException {
        Game game = new Game(new SingleCustomerScenario("Pasta"));
        game.startTurn();                         // turn 1
        game.waiterSeat(1, 1);
        endTurn(game);
        game.startTurn();                         // turn 2
        game.waiterTakeOrder(1);
        game.chefPrepare(1);
        endTurn(game);
        game.startTurn();                         // turn 3: Chef finishes before the Waiter tries
        game.chefPrepare(1);
        expectRejected("Serving a dish finished this turn is rejected", () -> game.waiterServe(1));
        endTurn(game);
        game.startTurn();                         // turn 4
        game.waiterServe(1);
        check("The same dish can be served next turn",
                game.getRestaurant().getOrders().get(0).getStatus() == OrderStatus.SERVED);
    }

    /** A neglected customer leaves at 0 and never adds revenue. */
    private static void unhappyCustomerLeavesWithoutPaying() {
        Game game = new Game(new SingleCustomerScenario("Salad"));
        int leftOnTurn = -1;
        while (game.hasNextTurn() && leftOnTurn < 0) {
            game.startTurn();
            endTurn(game);
            if (game.getRestaurant().getCustomers().get(0).getStatus() == CustomerStatus.LEFT) {
                leftOnTurn = game.getCurrentTurn();
            }
        }
        check("Regular left at end of turn 13 (100 - 13 x 8 < 0)", leftOnTurn == 13);
        check("Departure counted, no revenue",
                game.getStats().getUnhappyDepartures() == 1 && game.getStats().getRevenue().equals(Money.ZERO));
    }

    /** A manager who does nothing loses. */
    private static void allWaitRunIsDefeat() {
        Game game = new Game(new Scenario(Scenario.DEFAULT_SEED));
        while (game.hasNextTurn()) {
            game.startTurn();
            endTurn(game);
        }
        check("All-wait base game ends in DEFEAT after 18 turns",
                game.getResult() == GameResult.DEFEAT && game.getCurrentTurn() == 18);
    }

    private static void endTurn(Game game) {
        game.processEatingAndPayment();
        game.processSatisfactionAndDepartures();
        game.drainEvents();
    }

    private static void expectRejected(String name, Action action) {
        try {
            action.run();
            check(name, false);
        } catch (InvalidActionException e) {
            check(name + " (\"" + e.getMessage() + "\")", true);
        }
    }

    private static void check(String name, boolean passed) {
        System.out.println((passed ? "PASS  " : "FAIL  ") + name);
        if (!passed) {
            failures++;
        }
    }

    /** An action that may be rejected. */
    private interface Action {
        void run() throws InvalidActionException;
    }

    /** The base scenario except that a single given customer arrives on turn 1. */
    private static class FixedArrivalScenario extends Scenario {
        private final IntFunction<Customer> factory;

        FixedArrivalScenario(IntFunction<Customer> factory) {
            super(DEFAULT_SEED);
            this.factory = factory;
        }

        @Override
        public Optional<Customer> createArrival(int turn, int customerId) {
            return turn == 1 ? Optional.of(factory.apply(customerId)) : Optional.empty();
        }
    }

    /** One Regular customer on turn 1 who always orders a named dish. */
    private static final class SingleCustomerScenario extends FixedArrivalScenario {
        SingleCustomerScenario(String dishName) {
            super(id -> new RegularCustomer(id, 1, DEFAULT_SEED) {
                @Override
                public MenuItem chooseItem(Menu menu) {
                    for (MenuItem item : menu.getItems()) {
                        if (item.getName().equals(dishName)) {
                            return item;
                        }
                    }
                    throw new IllegalStateException(dishName + " is not on the menu");
                }
            });
        }
    }
}
