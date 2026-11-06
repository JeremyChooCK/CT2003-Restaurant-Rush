package restaurantrush.entity;

/**
 * A VIP customer: more patient (loses 5 satisfaction per waiting turn) and
 * gets 10% off the bill.
 */
public class VIPCustomer extends Customer {

    /** Satisfaction lost per waiting turn. */
    public static final int SATISFACTION_LOSS = 5;

    /** Percentage of the menu price a VIP pays (10% off). */
    public static final int PRICE_PERCENT = 90;

    /**
     * Creates a VIP customer.
     *
     * @param id          unique customer number
     * @param arrivalTurn the turn the customer arrived
     * @param seed        the game seed
     */
    public VIPCustomer(int id, int arrivalTurn, long seed) {
        super(id, arrivalTurn, seed);
    }

    @Override
    public int getSatisfactionLoss() {
        return SATISFACTION_LOSS;
    }

    /**
     * Applies the VIP discount of 10%, rounded to the nearest cent.
     *
     * @param basePrice the full menu price
     * @return 90% of the price
     */
    @Override
    public Money applyDiscount(Money basePrice) {
        return basePrice.percent(PRICE_PERCENT);
    }

    @Override
    public String getTypeLabel() {
        return "VIP";
    }
}
