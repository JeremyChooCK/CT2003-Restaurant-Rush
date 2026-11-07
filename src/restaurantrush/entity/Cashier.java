package restaurantrush.entity;

import java.util.Optional;

/**
 * The Cashier automatically takes at most one payment per turn, from the
 * customer who has been ready to pay the longest.
 */
public class Cashier extends Staff {

    /** Creates the Cashier. */
    public Cashier() {
        super("Cashier");
    }

    /**
     * Takes payment from the oldest READY_TO_PAY customer. A customer who
     * became ready to pay this turn must wait until next turn.
     *
     * @param restaurant the restaurant
     * @param turn       the current turn
     * @return the customer who paid, or empty if nobody could pay
     */
    public Optional<Customer> processPayment(Restaurant restaurant, int turn) {
        if (hasActedThisTurn()) {
            return Optional.empty();
        }
        Customer oldest = null;
        for (Customer customer : restaurant.getCustomersWithStatus(CustomerStatus.READY_TO_PAY)) {
            boolean eligible = customer.getReadyToPayTurn() < turn;
            if (eligible && (oldest == null || customer.getReadyToPayTurn() < oldest.getReadyToPayTurn())) {
                oldest = customer;
            }
        }
        if (oldest == null) {
            return Optional.empty();
        }
        restaurant.completePayment(oldest);
        completeTask();
        return Optional.of(oldest);
    }
}
