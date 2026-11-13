package restaurantrush.control;

import restaurantrush.entity.Money;

/**
 * A pricing rule for the whole restaurant, such as Happy Hour. It is applied
 * after the customer's own discount. To add a new promotion, implement this
 * interface and add it to {@link PriceCalculator}.
 */
public interface PriceModifier {

    /**
     * Adjusts a price at the moment an order is taken.
     *
     * @param price the price after earlier discounts
     * @return the adjusted price
     */
    Money adjust(Money price);
}
