package restaurantrush.entity;

/**
 * One customer's order. The price is locked when the order is taken, so later
 * pricing changes never affect it.
 */
public class Order {

    private final int id;
    private final Customer customer;
    private final MenuItem item;
    private final Money price;
    private final int orderedTurn;
    private int unitsRemaining;
    private OrderStatus status = OrderStatus.PREPARING;
    private int readyTurn = -1;

    /**
     * Creates an order. Only the restaurant creates orders.
     *
     * @param id          unique order number
     * @param customer    the customer who ordered
     * @param item        the item ordered
     * @param price       the locked price the customer will pay
     * @param orderedTurn the turn the order was taken
     */
    Order(int id, Customer customer, MenuItem item, Money price, int orderedTurn) {
        this.id = id;
        this.customer = customer;
        this.item = item;
        this.price = price;
        this.orderedTurn = orderedTurn;
        this.unitsRemaining = item.getPrepUnits();
    }

    void prepareOneUnit(int turn) {
        if (status != OrderStatus.PREPARING) {
            throw new IllegalStateException("Order #" + id + " is not being prepared.");
        }
        unitsRemaining--;
        if (unitsRemaining == 0) {
            status = OrderStatus.READY;
            readyTurn = turn;
        }
    }

    void markServed() {
        status = OrderStatus.SERVED;
    }

    void markPaid() {
        status = OrderStatus.PAID;
    }

    void cancel() {
        if (status == OrderStatus.PREPARING || status == OrderStatus.READY) {
            status = OrderStatus.CANCELLED;
        }
    }

    /**
     * Returns the order number.
     *
     * @return the id
     */
    public int getId() {
        return id;
    }

    /**
     * Returns the customer who placed the order.
     *
     * @return the customer
     */
    public Customer getCustomer() {
        return customer;
    }

    /**
     * Returns the item ordered.
     *
     * @return the menu item
     */
    public MenuItem getItem() {
        return item;
    }

    /**
     * Returns the locked bill amount.
     *
     * @return the price
     */
    public Money getPrice() {
        return price;
    }

    /**
     * Returns the turn the order was taken.
     *
     * @return the turn
     */
    public int getOrderedTurn() {
        return orderedTurn;
    }

    /**
     * Returns how many preparation units are still needed.
     *
     * @return remaining units
     */
    public int getUnitsRemaining() {
        return unitsRemaining;
    }

    /**
     * Returns how many preparation units are done.
     *
     * @return completed units
     */
    public int getUnitsDone() {
        return item.getPrepUnits() - unitsRemaining;
    }

    /**
     * Returns the current status.
     *
     * @return the status
     */
    public OrderStatus getStatus() {
        return status;
    }

    /**
     * Returns the turn the order became READY.
     *
     * @return the turn, or -1 if not ready
     */
    public int getReadyTurn() {
        return readyTurn;
    }

    @Override
    public String toString() {
        return "#" + id + " " + item.getName() + " for C" + customer.getId();
    }
}
