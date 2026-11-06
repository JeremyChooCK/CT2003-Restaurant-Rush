package restaurantrush.control;

import restaurantrush.entity.Customer;
import restaurantrush.entity.InvalidActionException;
import restaurantrush.entity.Money;
import restaurantrush.entity.Restaurant;

/**
 * Happy Hour: a promotion the manager may switch on once per game, at the
 * start of a turn. It lasts for that turn and the next.
 * <ul>
 *   <li>Orders taken while it is active get 20% off, applied after any VIP
 *       discount. The price is locked when the order is taken, so earlier
 *       orders are not affected.</li>
 *   <li>At the start of each active turn, customers still waiting for a
 *       table or for food recover 15 satisfaction (maximum 100).</li>
 * </ul>
 */
public class HappyHour implements PriceModifier {

    /** Number of turns Happy Hour lasts, counting the turn it starts. */
    public static final int DURATION = 2;

    /** Percentage of the price paid during Happy Hour (20% off). */
    public static final int PRICE_PERCENT = 80;

    /** Satisfaction recovered by waiting customers at the start of each active turn. */
    public static final int RECOVERY = 15;

    private boolean used;
    private int turnsRemaining;

    /**
     * Tells whether Happy Hour can still be switched on.
     *
     * @return {@code true} if it has not been used this game
     */
    public boolean isAvailable() {
        return !used;
    }

    /**
     * Switches Happy Hour on for the turn that is about to start and the next.
     *
     * @throws InvalidActionException if it has already been used this game
     */
    public void activate() throws InvalidActionException {
        if (used) {
            throw new InvalidActionException("Happy Hour can only be used once per game.");
        }
        used = true;
        turnsRemaining = DURATION;
    }

    /**
     * Tells whether Happy Hour is running this turn.
     *
     * @return {@code true} while active
     */
    public boolean isActive() {
        return turnsRemaining > 0;
    }

    /**
     * Returns how many turns of Happy Hour are left, including the current one.
     *
     * @return turns remaining, 0 if not active
     */
    public int getTurnsRemaining() {
        return turnsRemaining;
    }

    /**
     * Applies the start-of-turn recovery: every customer still waiting for a
     * table or for food gains {@value #RECOVERY} satisfaction.
     *
     * @param restaurant the restaurant
     * @return the number of customers who recovered
     */
    public int applyTurnStartRecovery(Restaurant restaurant) {
        if (!isActive()) {
            return 0;
        }
        int count = 0;
        for (Customer customer : restaurant.getActiveCustomers()) {
            if (customer.isAwaitingService()) {
                customer.recover(RECOVERY);
                count++;
            }
        }
        return count;
    }

    /**
     * Counts down one turn at the end of an active turn.
     */
    public void endTurn() {
        if (turnsRemaining > 0) {
            turnsRemaining--;
        }
    }

    /**
     * Gives 20% off while active.
     *
     * @param price the price after the customer's own discount
     * @return the price to lock into the order
     */
    @Override
    public Money adjust(Money price) {
        return isActive() ? price.percent(PRICE_PERCENT) : price;
    }
}
