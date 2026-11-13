package restaurantrush.entity;

/**
 * A food critic. Loses 12 satisfaction per waiting turn (impatient) and pays
 * full price.
 * <p>
 * Special behaviour:
 * <ul>
 *   <li>Always orders the most expensive item on the menu.</li>
 *   <li>When served, checks how fast the food came. If it came on the
 *       earliest possible turn (order turn + preparation units, i.e. the Chef
 *       started straight away and never stopped), the critic gains
 *       {@value #PERFECT_SERVICE_BONUS} satisfaction. If not, the critic
 *       loses {@value #SLOW_SERVICE_PENALTY}.</li>
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
