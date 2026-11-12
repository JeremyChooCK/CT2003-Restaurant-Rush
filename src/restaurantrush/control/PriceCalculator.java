package restaurantrush.control;

import java.util.ArrayList;
import java.util.List;

import restaurantrush.entity.Customer;
import restaurantrush.entity.MenuItem;
import restaurantrush.entity.Money;

/**
 * Works out the price a customer pays for a menu item at the moment the
 * order is taken. Keeping pricing in one place means the Waiter and Order
 * never need to know about discounts.
 * <p>
 * The customer's own discount (for example VIP) is applied first, then each
 * registered {@link PriceModifier} (for example Happy Hour) in order.
 */
public class PriceCalculator {

    private final List<PriceModifier> modifiers = new ArrayList<>();

    /**
     * Registers a restaurant-wide pricing rule.
     *
     * @param modifier the rule to apply after customer discounts
     */
    public void addModifier(PriceModifier modifier) {
        modifiers.add(modifier);
    }

    /**
     * Quotes the locked price for an order.
     *
     * @param customer the customer ordering
     * @param item     the chosen item
     * @return the price after the customer's discount and every modifier
     */
    public Money quote(Customer customer, MenuItem item) {
        Money price = customer.applyDiscount(item.getPrice());
        for (PriceModifier modifier : modifiers) {
            price = modifier.adjust(price);
        }
        return price;
    }
}
