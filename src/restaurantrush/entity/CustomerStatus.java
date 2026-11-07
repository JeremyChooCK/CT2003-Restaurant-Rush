package restaurantrush.entity;

/**
 * The stages a customer moves through during a visit.
 */
public enum CustomerStatus {
    /** In the waiting queue without a table. */
    WAITING(true),
    /** At a table but has not ordered yet. */
    SEATED(true),
    /** Has ordered and is waiting for the food. */
    ORDERED(true),
    /** Has been served and is eating. */
    EATING(false),
    /** Finished eating and waiting for the Cashier. */
    READY_TO_PAY(false),
    /** Has paid and left happily. */
    PAID(false),
    /** Left without paying because satisfaction reached 0. */
    LEFT(false);

    private final boolean awaitingService;

    CustomerStatus(boolean awaitingService) {
        this.awaitingService = awaitingService;
    }

    /**
     * Tells whether a customer in this state has not been served yet and
     * therefore loses satisfaction at the end of each turn.
     *
     * @return {@code true} for WAITING, SEATED and ORDERED
     */
    public boolean isAwaitingService() {
        return awaitingService;
    }

    /**
     * Tells whether the visit is over.
     *
     * @return {@code true} for PAID and LEFT
     */
    public boolean isFinished() {
        return this == PAID || this == LEFT;
    }
}
