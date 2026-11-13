package restaurantrush.boundary;

import java.io.PrintStream;
import java.util.ArrayList;
import java.util.List;
import java.util.OptionalDouble;

import restaurantrush.control.Game;
import restaurantrush.control.GameResult;
import restaurantrush.control.GameStats;
import restaurantrush.control.HappyHour;
import restaurantrush.control.Objective;
import restaurantrush.entity.Customer;
import restaurantrush.entity.CustomerStatus;
import restaurantrush.entity.MenuItem;
import restaurantrush.entity.Order;
import restaurantrush.entity.OrderStatus;
import restaurantrush.entity.Restaurant;
import restaurantrush.entity.Table;

/**
 * Prints the game state to the console. It only reads the game objects to
 * display them and does not change anything.
 */
public class ConsoleView {

    private static final String LINE = "=================================================================";

    private final PrintStream out;

    /**
     * Creates the view.
     *
     * @param out where text is written
     */
    public ConsoleView(PrintStream out) {
        this.out = out;
    }

    /**
     * Shows the title, the menu and the objective.
     *
     * @param game the game about to start
     */
    public void showWelcome(Game game) {
        Objective objective = game.getObjective();
        out.println(LINE);
        out.println("                 RESTAURANT RUSH - Manager's Shift");
        out.println(LINE);
        out.println("You manage a small restaurant for " + game.getMaxTurns() + " turns with "
                + game.getRestaurant().getTables().size() + " tables, one Host, one Waiter, one Chef and one Cashier.");
        out.println("Customers: Regular (loses 8 per waiting turn), VIP (loses 5, 10% off),");
        out.println("           Critic (loses 12, orders the priciest item, +10 if served on time, else -10).");
        out.println("Happy Hour (once per game, 2 turns): 20% off new orders, waiting customers recover "
                + HappyHour.RECOVERY + " per turn.");
        out.println("Customers choose their own food. You decide what your staff do each turn.");
        out.println();
        out.println("Menu:");
        for (MenuItem item : game.getRestaurant().getMenu().getItems()) {
            out.println("  - " + item);
        }
        out.println();
        out.println("Objective after turn " + game.getMaxTurns() + ": at least "
                + objective.getMinPaidCustomers() + " paid customers, revenue at least "
                + objective.getMinRevenue() + ", average satisfaction of paid customers at least "
                + objective.getMinAverageSatisfaction() + ".");
        out.println("Seed: " + game.getScenario().getSeed());
    }

    /**
     * Shows the turn header.
     *
     * @param game the game
     */
    public void showTurnHeader(Game game) {
        out.println();
        out.println(LINE);
        out.println(center("TURN " + game.getCurrentTurn() + " / " + game.getMaxTurns()));
        out.println(LINE);
    }

    /**
     * Shows the full start-of-turn state: totals, queue, tables, orders and
     * the tasks each staff member can do.
     *
     * @param game the game
     */
    public void showState(Game game) {
        GameStats stats = game.getStats();
        Restaurant restaurant = game.getRestaurant();
        out.println("Turn " + game.getCurrentTurn() + " | Revenue " + stats.getRevenue()
                + " | Avg satisfaction (paid) " + formatAverage(stats.getAverageSatisfaction())
                + " | Paid " + stats.getPaidCount() + " | " + describeHappyHour(game.getHappyHour()));
        out.println();
        out.println("Waiting queue:");
        List<Customer> queue = restaurant.getWaitingQueue();
        if (queue.isEmpty()) {
            out.println("  (empty)");
        }
        for (Customer customer : queue) {
            out.println("  " + describeCustomer(customer));
        }
        out.println("Tables:");
        for (Table table : restaurant.getTables()) {
            Customer occupant = table.getOccupant();
            out.println("  Table " + table.getNumber() + ": "
                    + (occupant == null ? "(free)" : describeCustomer(occupant)));
        }
        out.println("Orders:");
        boolean anyOrder = false;
        for (Order order : restaurant.getOrders()) {
            if (order.getStatus() == OrderStatus.PREPARING || order.getStatus() == OrderStatus.READY
                    || order.getStatus() == OrderStatus.SERVED) {
                out.println("  " + describeOrder(order));
                anyOrder = true;
            }
        }
        if (!anyOrder) {
            out.println("  (none in progress)");
        }
        showAvailableTasks(game);
    }

    /**
     * Lists what each staff member can usefully do this turn.
     *
     * @param game the game
     */
    protected void showAvailableTasks(Game game) {
        Restaurant restaurant = game.getRestaurant();
        out.println("Staff tasks available:");
        out.println("  Host   : " + (restaurant.hasFreeTable() && !restaurant.getWaitingQueue().isEmpty()
                ? "seat one queued customer (before the Waiter acts)" : "nothing to do (wait)"));
        out.println("  Waiter : " + String.join(" | ", waiterTasks(restaurant)));
        out.println("  Chef   : " + String.join(" | ", chefTasks(restaurant)));
        out.println("  Cashier: automatic, oldest READY_TO_PAY customer first");
    }

    /**
     * Builds the list of useful Waiter tasks.
     *
     * @param restaurant the restaurant
     * @return task descriptions, or a single "wait" entry
     */
    protected List<String> waiterTasks(Restaurant restaurant) {
        List<String> tasks = new ArrayList<>();
        if (restaurant.hasFreeTable()) {
            for (Customer customer : restaurant.getWaitingQueue()) {
                tasks.add("seat C" + customer.getId());
            }
        }
        for (Customer customer : restaurant.getCustomersWithStatus(CustomerStatus.SEATED)) {
            tasks.add("take order at Table " + customer.getTable().getNumber());
        }
        for (Order order : restaurant.getOrdersWithStatus(OrderStatus.READY)) {
            tasks.add("serve #" + order.getId());
        }
        if (tasks.isEmpty()) {
            tasks.add("nothing to do (wait)");
        }
        return tasks;
    }

    private List<String> chefTasks(Restaurant restaurant) {
        List<String> tasks = new ArrayList<>();
        for (Order order : restaurant.getOrdersWithStatus(OrderStatus.PREPARING)) {
            tasks.add("cook #" + order.getId() + " (" + order.getUnitsRemaining() + " unit"
                    + (order.getUnitsRemaining() == 1 ? "" : "s") + " left)");
        }
        if (tasks.isEmpty()) {
            tasks.add("nothing to cook yet (orders taken this turn can still be cooked)");
        }
        return tasks;
    }

    /**
     * Describes the Happy Hour state, including the turns remaining.
     *
     * @param happyHour the promotion
     * @return a short description
     */
    protected String describeHappyHour(HappyHour happyHour) {
        if (happyHour.isActive()) {
            return "Happy Hour ON (" + happyHour.getTurnsRemaining() + " turn"
                    + (happyHour.getTurnsRemaining() == 1 ? "" : "s") + " left incl. this one)";
        }
        return happyHour.isAvailable() ? "Happy Hour available" : "Happy Hour used";
    }

    /**
     * Shows event messages produced by the game.
     *
     * @param events the messages
     */
    public void showEvents(List<String> events) {
        for (String event : events) {
            out.println("  * " + event);
        }
    }

    /**
     * Shows a section heading such as "Waiter".
     *
     * @param title the heading
     */
    public void showSection(String title) {
        out.println();
        out.println("--- " + title + " ---");
    }

    /**
     * Shows a plain message.
     *
     * @param message the text
     */
    public void showMessage(String message) {
        out.println("  " + message);
    }

    /**
     * Shows why a choice was rejected.
     *
     * @param message the reason
     */
    public void showError(String message) {
        out.println("  ! Not allowed: " + message);
        out.println("  ! Please choose again.");
    }

    /**
     * Shows the end-of-turn summary.
     *
     * @param game the game
     */
    public void showEndOfTurn(Game game) {
        GameStats stats = game.getStats();
        out.println();
        out.println("End of turn " + game.getCurrentTurn() + ": served " + stats.getServedCount()
                + " | unhappy departures " + stats.getUnhappyDepartures()
                + " | revenue " + stats.getRevenue()
                + " | avg satisfaction " + formatAverage(stats.getAverageSatisfaction())
                + " | turns used " + game.getCurrentTurn() + "/" + game.getMaxTurns());
        List<Customer> active = game.getRestaurant().getActiveCustomers();
        if (!active.isEmpty()) {
            StringBuilder line = new StringBuilder("Satisfaction now:");
            for (Customer customer : active) {
                line.append(' ').append('C').append(customer.getId()).append('=')
                        .append(customer.getSatisfaction());
            }
            out.println(line);
        }
    }

    /**
     * Shows the final result with each target marked as met or missed.
     *
     * @param game the finished game
     */
    public void showFinalResult(Game game) {
        GameStats stats = game.getStats();
        Objective objective = game.getObjective();
        out.println();
        out.println(LINE);
        out.println(center(game.getResult() == GameResult.VICTORY ? "*** VICTORY ***" : "*** DEFEAT ***"));
        out.println(LINE);
        out.println(mark(objective.isPaidTargetMet(stats)) + " Paid customers: " + stats.getPaidCount()
                + " (target " + objective.getMinPaidCustomers() + ")");
        out.println(mark(objective.isRevenueTargetMet(stats)) + " Revenue: " + stats.getRevenue()
                + " (target " + objective.getMinRevenue() + ")");
        out.println(mark(objective.isSatisfactionTargetMet(stats)) + " Average satisfaction: "
                + formatAverage(stats.getAverageSatisfaction())
                + " (target " + objective.getMinAverageSatisfaction() + ")");
        out.println("Dishes served: " + stats.getServedCount() + " | Unhappy departures: "
                + stats.getUnhappyDepartures() + " | Turns used: " + game.getCurrentTurn()
                + "/" + game.getMaxTurns());
    }

    /**
     * Describes a customer in one line.
     *
     * @param customer the customer
     * @return the description
     */
    protected String describeCustomer(Customer customer) {
        StringBuilder text = new StringBuilder();
        text.append(String.format("%-14s sat %3d  %-12s", customer.getLabel(),
                customer.getSatisfaction(), customer.getStatus()));
        if (customer.getStatus() == CustomerStatus.WAITING) {
            text.append(" arrived turn ").append(customer.getArrivalTurn());
        }
        Order order = customer.getOrder();
        if (order != null) {
            text.append(" order #").append(order.getId()).append(' ').append(order.getItem().getName())
                    .append(' ').append(order.getStatus());
        }
        return text.toString();
    }

    private String describeOrder(Order order) {
        return String.format("#%d %-10s for %-14s %-9s %d/%d units  bill %s", order.getId(),
                order.getItem().getName(), order.getCustomer().getLabel(), order.getStatus(),
                order.getUnitsDone(), order.getItem().getPrepUnits(), order.getPrice());
    }

    /**
     * Formats the average satisfaction with one decimal, or N/A.
     *
     * @param average the average
     * @return the formatted text
     */
    protected String formatAverage(OptionalDouble average) {
        return average.isPresent() ? String.format("%.1f", average.getAsDouble()) : "N/A";
    }

    private String mark(boolean met) {
        return met ? "[MET]   " : "[MISSED]";
    }

    private String center(String text) {
        int pad = Math.max(0, (LINE.length() - text.length()) / 2);
        return " ".repeat(pad) + text;
    }
}
