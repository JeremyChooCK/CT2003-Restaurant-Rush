package restaurantrush.control;

import restaurantrush.entity.Money;

/**
 * The targets the manager must reach by the final turn.
 */
public class Objective {

    private final int minPaidCustomers;
    private final Money minRevenue;
    private final int minAverageSatisfaction;

    /**
     * Creates an objective.
     *
     * @param minPaidCustomers       customers who must pay
     * @param minRevenue             revenue that must be reached
     * @param minAverageSatisfaction average satisfaction of paid customers that must be reached
     */
    public Objective(int minPaidCustomers, Money minRevenue, int minAverageSatisfaction) {
        this.minPaidCustomers = minPaidCustomers;
        this.minRevenue = minRevenue;
        this.minAverageSatisfaction = minAverageSatisfaction;
    }

    /**
     * Returns the base-setting objective: at least 4 paid customers, at
     * least $45.00 revenue and an average satisfaction of at least 60.
     *
     * @return the base objective
     */
    public static Objective base() {
        return new Objective(4, Money.ofDollars(45), 60);
    }

    /**
     * Checks the paid-customer target.
     *
     * @param stats the current totals
     * @return {@code true} if met
     */
    public boolean isPaidTargetMet(GameStats stats) {
        return stats.getPaidCount() >= minPaidCustomers;
    }

    /**
     * Checks the revenue target.
     *
     * @param stats the current totals
     * @return {@code true} if met
     */
    public boolean isRevenueTargetMet(GameStats stats) {
        return stats.getRevenue().isAtLeast(minRevenue);
    }

    /**
     * Checks the satisfaction target. It is not met if nobody has paid.
     *
     * @param stats the current totals
     * @return {@code true} if met
     */
    public boolean isSatisfactionTargetMet(GameStats stats) {
        return stats.getAverageSatisfaction().orElse(0) >= minAverageSatisfaction;
    }

    /**
     * Decides the result: victory only if all three targets are met.
     *
     * @param stats the final totals
     * @return the result
     */
    public GameResult evaluate(GameStats stats) {
        boolean allMet = isPaidTargetMet(stats) && isRevenueTargetMet(stats) && isSatisfactionTargetMet(stats);
        return allMet ? GameResult.VICTORY : GameResult.DEFEAT;
    }

    /**
     * Returns the paid-customer target.
     *
     * @return the target
     */
    public int getMinPaidCustomers() {
        return minPaidCustomers;
    }

    /**
     * Returns the revenue target.
     *
     * @return the target
     */
    public Money getMinRevenue() {
        return minRevenue;
    }

    /**
     * Returns the average satisfaction target.
     *
     * @return the target
     */
    public int getMinAverageSatisfaction() {
        return minAverageSatisfaction;
    }
}
