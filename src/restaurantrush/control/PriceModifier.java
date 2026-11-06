package restaurantrush.control;

import restaurantrush.entity.Money;

/**
 * A restaurant-wide pricing rule applied after the customer's own discount,
 * such as Happy Hour. New promotions can be added by implementing this
 * interface and registering them with {@link PriceCalculator}, without
 * changing the Waiter, Order or existing pricing code.
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
