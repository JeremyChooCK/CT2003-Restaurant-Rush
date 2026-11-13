package restaurantrush.entity;

/**
 * The Waiter seats customers, takes orders and serves READY dishes, one task
 * per turn.
 */
public class Waiter extends Staff {

    /** Creates the Waiter. */
    public Waiter() {
        super("Waiter");
    }

    /**
     * Seats a queued customer at a free table.
     *
     * @param restaurant the restaurant
     * @param customer   the queued customer
     * @param table      a free table
     * @throws InvalidActionException if the Waiter is busy, the customer is not
     *                                queued or the table is occupied
     */
    public void seat(Restaurant restaurant, Customer customer, Table table) throws InvalidActionException {
        ensureAvailable();
        restaurant.seat(customer, table);
        completeTask();
    }

    /**
     * Checks that the Waiter is able to take this customer's order, without
     * actually taking it. This way the game can check the move before the
     * customer picks their food.
     *
     * @param customer the customer at the table
     * @throws InvalidActionException if the Waiter is busy or the customer
     *                                is not seated and waiting to order
     */
    public void checkCanTakeOrder(Customer customer) throws InvalidActionException {
        ensureAvailable();
        if (customer.getStatus() != CustomerStatus.SEATED) {
            throw new InvalidActionException(customer.getLabel() + " cannot order now (status: "
                    + customer.getStatus() + "). Only SEATED customers who have not ordered can order.");
        }
    }

    /**
     * Takes a seated customer's order at a locked price.
     *
     * @param restaurant the restaurant
     * @param customer   the seated customer
     * @param item       the item the customer chose
     * @param price      the price after all discounts
     * @param turn       the current turn
     * @return the new order
     * @throws InvalidActionException if the order cannot be taken
     */
    public Order takeOrder(Restaurant restaurant, Customer customer, MenuItem item, Money price, int turn)
            throws InvalidActionException {
        checkCanTakeOrder(customer);
        Order order = restaurant.openOrder(customer, item, price, turn);
        completeTask();
        return order;
    }

    /**
     * Serves a READY order. A dish that became READY this turn cannot be
     * served until next turn.
     *
     * @param order the order to serve
     * @param turn  the current turn
     * @throws InvalidActionException if the Waiter is busy or the order is not
     *                                READY from an earlier turn
     */
    public void serve(Order order, int turn) throws InvalidActionException {
        ensureAvailable();
        if (order.getStatus() != OrderStatus.READY) {
            throw new InvalidActionException("Order " + order + " is not READY (status: "
                    + order.getStatus() + ").");
        }
        if (order.getReadyTurn() >= turn) {
            throw new InvalidActionException("Order " + order
                    + " was finished this turn. It can be served next turn.");
        }
        order.markServed();
        order.getCustomer().serve(turn);
        completeTask();
    }
}
