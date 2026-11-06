package restaurantrush.entity;

/**
 * The Chef completes one preparation unit of one order per turn.
 */
public class Chef extends Staff {

    /** Creates the Chef. */
    public Chef() {
        super("Chef");
    }

    /**
     * Completes one preparation unit of an order. When the last unit is done
     * the order becomes READY.
     *
     * @param order the order to work on
     * @param turn  the current turn
     * @throws InvalidActionException if the Chef is busy or the order is not
     *                                being prepared
     */
    public void prepare(Order order, int turn) throws InvalidActionException {
        ensureAvailable();
        if (order.getStatus() != OrderStatus.PREPARING) {
            throw new InvalidActionException("Order " + order + " does not need cooking (status: "
                    + order.getStatus() + ").");
        }
        order.prepareOneUnit(turn);
        completeTask();
    }
}
