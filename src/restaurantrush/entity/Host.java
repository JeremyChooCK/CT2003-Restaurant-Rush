package restaurantrush.entity;

/**
 * The Host greets customers and seats at most one queued customer per turn,
 * in addition to whatever the Waiter does. The Host acts before the Waiter,
 * so the Waiter can take the order of a customer the Host has just seated.
 */
public class Host extends Staff {

    /** Creates the Host. */
    public Host() {
        super("Host");
    }

    /**
     * Seats a queued customer at a free table.
     *
     * @param restaurant the restaurant
     * @param customer   the queued customer
     * @param table      a free table
     * @throws InvalidActionException if the Host is busy, the customer is not
     *                                queued or the table is occupied
     */
    public void seat(Restaurant restaurant, Customer customer, Table table) throws InvalidActionException {
        ensureAvailable();
        restaurant.seat(customer, table);
        completeTask();
    }
}
