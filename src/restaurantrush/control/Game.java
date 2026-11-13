package restaurantrush.control;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import restaurantrush.entity.Cashier;
import restaurantrush.entity.Chef;
import restaurantrush.entity.Customer;
import restaurantrush.entity.Host;
import restaurantrush.entity.InvalidActionException;
import restaurantrush.entity.MenuItem;
import restaurantrush.entity.Money;
import restaurantrush.entity.Order;
import restaurantrush.entity.Restaurant;
import restaurantrush.entity.Table;
import restaurantrush.entity.Waiter;

/**
 * Handles the game rules for each turn. There is no input/output code here.
 * The controller passes in the manager's choices as numbers, and this class
 * checks them, updates the restaurant and saves messages about what happened.
 */
public class Game {

    private final Scenario scenario;
    private final Restaurant restaurant;
    private final Waiter waiter = new Waiter();
    private final Chef chef = new Chef();
    private final Cashier cashier = new Cashier();
    private final Host host = new Host();
    private final HappyHour happyHour = new HappyHour();
    private final GameStats stats = new GameStats();
    private final Objective objective = Objective.base();
    private final PriceCalculator pricing = new PriceCalculator();
    private final List<String> events = new ArrayList<>();
    private int currentTurn;
    private int nextCustomerId = 1;

    /**
     * Creates a game from a scenario.
     *
     * @param scenario the setup to play
     */
    public Game(Scenario scenario) {
        this.scenario = scenario;
        this.restaurant = new Restaurant(scenario.createMenu(), scenario.getTableCount());
        pricing.addModifier(happyHour);
    }

    /**
     * Tells whether there are turns left to play.
     *
     * @return {@code true} until the final turn has been played
     */
    public boolean hasNextTurn() {
        return currentTurn < scenario.getMaxTurns();
    }

    /**
     * Switches on Happy Hour for the turn about to start and the next one.
     * Call before {@link #startTurn()}.
     *
     * @throws InvalidActionException if Happy Hour has already been used
     */
    public void activateHappyHour() throws InvalidActionException {
        if (!hasNextTurn()) {
            throw new InvalidActionException("The game is over.");
        }
        happyHour.activate();
        events.add("Happy Hour is ON for turns " + (currentTurn + 1) + " and " + (currentTurn + 2)
                + ": 20% off new orders, waiting customers recover " + HappyHour.RECOVERY + " each turn.");
    }

    /**
     * Starts the next turn: frees every staff member, applies the Happy Hour
     * recovery if it is active, then processes the scheduled arrival (step 1).
     */
    public void startTurn() {
        if (!hasNextTurn()) {
            throw new IllegalStateException("The game is already over.");
        }
        currentTurn++;
        waiter.resetForTurn();
        chef.resetForTurn();
        cashier.resetForTurn();
        host.resetForTurn();
        int recovered = happyHour.applyTurnStartRecovery(restaurant);
        if (recovered > 0) {
            events.add("Happy Hour: " + recovered + " waiting customer" + (recovered == 1 ? "" : "s")
                    + " recovered " + HappyHour.RECOVERY + " satisfaction (maximum 100).");
        }
        processArrivals();
    }

    private void processArrivals() {
        Optional<Customer> arrival = scenario.createArrival(currentTurn, nextCustomerId);
        if (arrival.isPresent()) {
            Customer customer = arrival.get();
            nextCustomerId++;
            restaurant.admit(customer);
            events.add(customer.getLabel() + " arrived and joined the waiting queue (satisfaction "
                    + customer.getSatisfaction() + ").");
        }
    }

    /**
     * Host task: seat a queued customer at a table. The Host acts before the
     * Waiter and does not use up the Waiter's task.
     *
     * @param customerId  the queued customer's number
     * @param tableNumber the table number
     * @throws InvalidActionException if the choice breaks a rule
     */
    public void hostSeat(int customerId, int tableNumber) throws InvalidActionException {
        Customer customer = restaurant.findQueuedCustomer(customerId);
        Table table = restaurant.findTable(tableNumber);
        host.seat(restaurant, customer, table);
        events.add("Host seated " + customer.getLabel() + " at Table " + table.getNumber() + ".");
    }

    /**
     * Waiter task: seat a queued customer at a table.
     *
     * @param customerId  the queued customer's number
     * @param tableNumber the table number
     * @throws InvalidActionException if the choice breaks a rule
     */
    public void waiterSeat(int customerId, int tableNumber) throws InvalidActionException {
        Customer customer = restaurant.findQueuedCustomer(customerId);
        Table table = restaurant.findTable(tableNumber);
        waiter.seat(restaurant, customer, table);
        events.add("Waiter seated " + customer.getLabel() + " at Table " + table.getNumber() + ".");
    }

    /**
     * Waiter task: take the order of the customer at a table. The customer
     * chooses the food and the price is locked now.
     *
     * @param tableNumber the table number
     * @throws InvalidActionException if the choice breaks a rule
     */
    public void waiterTakeOrder(int tableNumber) throws InvalidActionException {
        Table table = restaurant.findTable(tableNumber);
        Customer customer = table.getOccupant();
        if (customer == null) {
            throw new InvalidActionException("Table " + tableNumber + " is empty.");
        }
        waiter.checkCanTakeOrder(customer);
        MenuItem item = customer.chooseItem(restaurant.getMenu());
        Money price = pricing.quote(customer, item);
        Order order = waiter.takeOrder(restaurant, customer, item, price, currentTurn);
        String priceNote = price.equals(item.getPrice()) ? "" : " (menu price " + item.getPrice()
                + (happyHour.isActive() ? ", Happy Hour applied" : "") + ")";
        events.add("Waiter took order #" + order.getId() + ": " + customer.getLabel() + " ordered "
                + item.getName() + " (" + item.getPrepUnits() + " prep unit"
                + (item.getPrepUnits() == 1 ? "" : "s") + ") for " + price + priceNote + ".");
    }

    /**
     * Waiter task: serve a READY order.
     *
     * @param orderId the order number
     * @throws InvalidActionException if the choice breaks a rule
     */
    public void waiterServe(int orderId) throws InvalidActionException {
        Order order = restaurant.findOrder(orderId);
        Customer customer = order.getCustomer();
        int before = customer.getSatisfaction();
        waiter.serve(order, currentTurn);
        stats.recordServed();
        String change = before == customer.getSatisfaction() ? String.valueOf(before)
                : before + " -> " + customer.getSatisfaction() + " (reaction to service)";
        events.add("Waiter served order " + order + ". " + customer.getLabel()
                + " is now eating (satisfaction " + change + ").");
    }

    /**
     * Chef task: complete one preparation unit of an order.
     *
     * @param orderId the order number
     * @throws InvalidActionException if the choice breaks a rule
     */
    public void chefPrepare(int orderId) throws InvalidActionException {
        Order order = restaurant.findOrder(orderId);
        chef.prepare(order, currentTurn);
        String progress = "unit " + order.getUnitsDone() + " of " + order.getItem().getPrepUnits();
        if (order.getUnitsRemaining() == 0) {
            events.add("Chef finished order " + order + " (" + progress + "). It is READY and can be served next turn.");
        } else {
            events.add("Chef worked on order " + order + " (" + progress + ").");
        }
    }

    /**
     * Step 4: the Cashier takes at most one payment, then customers who were
     * served on an earlier turn finish eating and become ready to pay.
     */
    public void processEatingAndPayment() {
        Optional<Customer> payer = cashier.processPayment(restaurant, currentTurn);
        if (payer.isPresent()) {
            Customer customer = payer.get();
            Money bill = customer.getOrder().getPrice();
            stats.recordPayment(bill, customer.getSatisfaction());
            events.add("Cashier collected " + bill + " from " + customer.getLabel()
                    + ". Satisfaction " + customer.getSatisfaction() + " recorded; table freed.");
        }
        for (Customer customer : restaurant.finishEating(currentTurn)) {
            events.add(customer.getLabel() + " finished eating and is READY_TO_PAY (pays next turn at the earliest).");
        }
    }

    /**
     * Step 5: every customer not yet served loses satisfaction. Anyone who
     * reaches 0 leaves without paying.
     */
    public void processSatisfactionAndDepartures() {
        for (Customer customer : restaurant.getActiveCustomers()) {
            if (!customer.isAwaitingService()) {
                continue;
            }
            customer.loseSatisfaction();
            if (customer.getSatisfaction() == 0) {
                restaurant.handleDeparture(customer);
                stats.recordDeparture();
                events.add(customer.getLabel() + " lost all patience and left without paying.");
            }
        }
        happyHour.endTurn();
    }

    /**
     * Returns and clears the messages describing what happened since the
     * last call.
     *
     * @return the event messages in order
     */
    public List<String> drainEvents() {
        List<String> copy = new ArrayList<>(events);
        events.clear();
        return copy;
    }

    /**
     * Returns the result based on the current totals. Only meaningful after
     * the final turn.
     *
     * @return victory or defeat
     */
    public GameResult getResult() {
        return objective.evaluate(stats);
    }

    /**
     * Returns the current turn number, starting at 1.
     *
     * @return the turn, or 0 before the first turn
     */
    public int getCurrentTurn() {
        return currentTurn;
    }

    /**
     * Returns the number of turns in the game.
     *
     * @return the maximum turn
     */
    public int getMaxTurns() {
        return scenario.getMaxTurns();
    }

    /**
     * Returns the restaurant state for display.
     *
     * @return the restaurant
     */
    public Restaurant getRestaurant() {
        return restaurant;
    }

    /**
     * Returns the running totals.
     *
     * @return the stats
     */
    public GameStats getStats() {
        return stats;
    }

    /**
     * Returns the objective.
     *
     * @return the objective
     */
    public Objective getObjective() {
        return objective;
    }

    /**
     * Returns the Happy Hour promotion, for display.
     *
     * @return the Happy Hour state
     */
    public HappyHour getHappyHour() {
        return happyHour;
    }

    /**
     * Returns the scenario being played.
     *
     * @return the scenario
     */
    public Scenario getScenario() {
        return scenario;
    }
}
