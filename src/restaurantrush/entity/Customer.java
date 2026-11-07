package restaurantrush.entity;

import java.util.Random;

/**
 * A restaurant customer. Every customer follows the same visit flow:
 * WAITING, SEATED, ORDERED, EATING, READY_TO_PAY and finally PAID or LEFT.
 * <p>
 * Subclasses decide how quickly the customer loses patience, whether they get
 * a discount, how they choose food and how they react to being served. The
 * game rules call these methods without checking the customer's type.
 * <p>
 * State changes are package-private, so only the restaurant and its staff
 * can move a customer through the visit.
 */
public abstract class Customer {

    /** The highest possible satisfaction, also the value on arrival. */
    public static final int MAX_SATISFACTION = 100;

    private final int id;
    private final int arrivalTurn;
    private final Random random;
    private int satisfaction = MAX_SATISFACTION;
    private CustomerStatus status = CustomerStatus.WAITING;
    private Table table;
    private Order order;
    private int servedTurn = -1;
    private int readyToPayTurn = -1;

    /**
     * Creates a customer who has just arrived.
     *
     * @param id          unique customer number, shown as C1, C2 and so on
     * @param arrivalTurn the turn the customer arrived
     * @param seed        the game seed; each customer gets its own
     *                    reproducible random sequence derived from it
     */
    protected Customer(int id, int arrivalTurn, long seed) {
        this.id = id;
        this.arrivalTurn = arrivalTurn;
        this.random = new Random(seed * 1000 + id);
    }

    /**
     * Returns how many satisfaction points this customer loses at the end of
     * each turn while still waiting to be served.
     *
     * @return points lost per waiting turn
     */
    public abstract int getSatisfactionLoss();

    /**
     * Returns a short name for the customer type, such as "Regular".
     *
     * @return the type label
     */
    public abstract String getTypeLabel();

    /**
     * Applies this customer's personal discount to a menu price.
     * The default is no discount.
     *
     * @param basePrice the full menu price
     * @return the price this customer pays
     */
    public Money applyDiscount(Money basePrice) {
        return basePrice;
    }

    /**
     * Chooses what to order. The default picks uniformly at random from the
     * whole menu using this customer's seeded random sequence, so the same
     * seed always produces the same choices.
     *
     * @param menu the restaurant menu
     * @return the chosen item
     */
    public MenuItem chooseItem(Menu menu) {
        return menu.getItem(random.nextInt(menu.size()));
    }

    /**
     * Called once when the customer's food is served. The default does
     * nothing; subclasses can override it to react to the service.
     *
     * @param turn the turn the food was served
     */
    protected void onServed(int turn) {
        // Regular customers have no special reaction.
    }

    /**
     * Reduces satisfaction by this customer's waiting penalty, never going
     * below 0.
     */
    public final void loseSatisfaction() {
        changeSatisfaction(-getSatisfactionLoss());
    }

    /**
     * Increases satisfaction, never going above {@link #MAX_SATISFACTION}.
     *
     * @param points the points to add, must not be negative
     */
    public final void recover(int points) {
        if (points < 0) {
            throw new IllegalArgumentException("Recovery cannot be negative.");
        }
        changeSatisfaction(points);
    }

    /**
     * Changes satisfaction by a positive or negative amount, keeping it
     * between 0 and {@link #MAX_SATISFACTION}.
     *
     * @param delta the change in points
     */
    protected final void changeSatisfaction(int delta) {
        satisfaction = Math.max(0, Math.min(MAX_SATISFACTION, satisfaction + delta));
    }

    /**
     * Tells whether the customer has not been served yet and therefore
     * loses satisfaction at the end of the turn.
     *
     * @return {@code true} while WAITING, SEATED or ORDERED
     */
    public boolean isAwaitingService() {
        return status.isAwaitingService();
    }

    void seatAt(Table assignedTable) {
        this.table = assignedTable;
        this.status = CustomerStatus.SEATED;
    }

    void placeOrder(Order newOrder) {
        this.order = newOrder;
        this.status = CustomerStatus.ORDERED;
    }

    void serve(int turn) {
        this.servedTurn = turn;
        this.status = CustomerStatus.EATING;
        onServed(turn);
    }

    void finishEating(int turn) {
        this.readyToPayTurn = turn;
        this.status = CustomerStatus.READY_TO_PAY;
    }

    void pay() {
        this.status = CustomerStatus.PAID;
        this.table = null;
    }

    void leave() {
        this.status = CustomerStatus.LEFT;
        this.table = null;
    }

    /**
     * Returns the customer number.
     *
     * @return the id
     */
    public int getId() {
        return id;
    }

    /**
     * Returns the turn the customer arrived.
     *
     * @return the arrival turn
     */
    public int getArrivalTurn() {
        return arrivalTurn;
    }

    /**
     * Returns the current satisfaction from 0 to 100.
     *
     * @return the satisfaction
     */
    public int getSatisfaction() {
        return satisfaction;
    }

    /**
     * Returns the current visit stage.
     *
     * @return the status
     */
    public CustomerStatus getStatus() {
        return status;
    }

    /**
     * Returns the table the customer sits at.
     *
     * @return the table, or {@code null} if not seated
     */
    public Table getTable() {
        return table;
    }

    /**
     * Returns the customer's order.
     *
     * @return the order, or {@code null} if nothing has been ordered
     */
    public Order getOrder() {
        return order;
    }

    /**
     * Returns the turn the food was served.
     *
     * @return the turn, or -1 if not served yet
     */
    public int getServedTurn() {
        return servedTurn;
    }

    /**
     * Returns the turn the customer became ready to pay.
     *
     * @return the turn, or -1 if not ready yet
     */
    public int getReadyToPayTurn() {
        return readyToPayTurn;
    }

    /**
     * Returns a short label such as "C3 (Regular)".
     *
     * @return the label
     */
    public String getLabel() {
        return "C" + id + " (" + getTypeLabel() + ")";
    }

    @Override
    public String toString() {
        return getLabel();
    }
}
