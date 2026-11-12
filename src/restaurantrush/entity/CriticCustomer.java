package restaurantrush.entity;

/**
 * A food critic: impatient (loses 12 satisfaction per waiting turn) and pays
 * full price.
 * <p>
 * Special behaviour:
 * <ul>
 *   <li><b>Order preference:</b> always orders the most expensive item on the
 *       menu, to test the kitchen.</li>
 *   <li><b>Reaction to service:</b> when served, the critic judges the
 *       kitchen's speed. If the dish arrives on the earliest possible turn
 *       (order turn + preparation units, meaning the Chef started at once and
 *       never paused), the critic is impressed and gains
 *       {@value #PERFECT_SERVICE_BONUS} satisfaction. Otherwise the critic
 *       writes a harsh note and loses {@value #SLOW_SERVICE_PENALTY}.</li>
 * </ul>
 */
public class CriticCustomer extends Customer {

    /** Satisfaction lost per waiting turn. */
    public static final int SATISFACTION_LOSS = 12;

    /** Satisfaction gained for perfectly timed service. */
    public static final int PERFECT_SERVICE_BONUS = 10;

    /** Satisfaction lost for any delay in service. */
    public static final int SLOW_SERVICE_PENALTY = 10;

    /**
     * Creates a critic.
     *
     * @param id          unique customer number
     * @param arrivalTurn the turn the customer arrived
     * @param seed        the game seed
     */
    public CriticCustomer(int id, int arrivalTurn, long seed) {
        super(id, arrivalTurn, seed);
    }

    @Override
    public int getSatisfactionLoss() {
        return SATISFACTION_LOSS;
    }

    /**
     * Always picks the most expensive item on the menu.
     *
     * @param menu the restaurant menu
     * @return the most expensive item
     */
    @Override
    public MenuItem chooseItem(Menu menu) {
        return menu.mostExpensive();
    }

    /**
     * Tells whether a dish served on {@code turn} came as fast as possible.
     *
     * @param turn the serving turn
     * @return {@code true} if served no later than order turn + preparation units
     */
    public boolean isPerfectService(int turn) {
        Order order = getOrder();
        return turn <= order.getOrderedTurn() + order.getItem().getPrepUnits();
    }

    /**
     * Judges the speed of service: +10 if perfect, otherwise -10.
     *
     * @param turn the serving turn
     */
    @Override
    protected void onServed(int turn) {
        if (isPerfectService(turn)) {
            changeSatisfaction(PERFECT_SERVICE_BONUS);
        } else {
            changeSatisfaction(-SLOW_SERVICE_PENALTY);
        }
    }

    @Override
    public String getTypeLabel() {
        return "Critic";
    }
}
