package restaurantrush.control;

import java.util.OptionalDouble;

import restaurantrush.entity.Money;

/**
 * Running totals used for the end-of-turn summary and the final result.
 * Revenue only ever includes paid bills.
 */
public class GameStats {

    private Money revenue = Money.ZERO;
    private int paidCount;
    private int paidSatisfactionTotal;
    private int servedCount;
    private int unhappyDepartures;

    /**
     * Records that a dish was served.
     */
    public void recordServed() {
        servedCount++;
    }

    /**
     * Records a payment and the customer's satisfaction at the moment of paying.
     *
     * @param bill         the amount paid
     * @param satisfaction the customer's satisfaction when paying
     */
    public void recordPayment(Money bill, int satisfaction) {
        revenue = revenue.plus(bill);
        paidCount++;
        paidSatisfactionTotal += satisfaction;
    }

    /**
     * Records a customer who left without paying.
     */
    public void recordDeparture() {
        unhappyDepartures++;
    }

    /**
     * Returns the average satisfaction of paid customers.
     *
     * @return the average, or empty if nobody has paid yet
     */
    public OptionalDouble getAverageSatisfaction() {
        if (paidCount == 0) {
            return OptionalDouble.empty();
        }
        return OptionalDouble.of((double) paidSatisfactionTotal / paidCount);
    }

    /**
     * Returns the total revenue from paid bills.
     *
     * @return the revenue
     */
    public Money getRevenue() {
        return revenue;
    }

    /**
     * Returns the number of customers who paid.
     *
     * @return the paid count
     */
    public int getPaidCount() {
        return paidCount;
    }

    /**
     * Returns the number of dishes served.
     *
     * @return the served count
     */
    public int getServedCount() {
        return servedCount;
    }

    /**
     * Returns the number of customers who left unhappy.
     *
     * @return the departure count
     */
    public int getUnhappyDepartures() {
        return unhappyDepartures;
    }
}
