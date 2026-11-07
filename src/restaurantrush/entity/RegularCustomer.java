package restaurantrush.entity;

/**
 * An ordinary customer: loses 8 satisfaction per waiting turn and pays full price.
 */
public class RegularCustomer extends Customer {

    /** Satisfaction lost per waiting turn. */
    public static final int SATISFACTION_LOSS = 8;

    /**
     * Creates a regular customer.
     *
     * @param id          unique customer number
     * @param arrivalTurn the turn the customer arrived
     * @param seed        the game seed
     */
    public RegularCustomer(int id, int arrivalTurn, long seed) {
        super(id, arrivalTurn, seed);
    }

    @Override
    public int getSatisfactionLoss() {
        return SATISFACTION_LOSS;
    }

    @Override
    public String getTypeLabel() {
        return "Regular";
    }
}
