package restaurantrush.control;

import restaurantrush.entity.Customer;
import restaurantrush.entity.MenuItem;
import restaurantrush.entity.Money;

/**
 * Works out the price a customer pays for a menu item at the moment the
 * order is taken. Keeping pricing in one place means the Waiter and Order
 * never need to know about discounts.
 * <p>
 * The price is the menu price after the customer's own discount, which each
 * customer type decides for itself.
 */
public class PriceCalculator {

    /**
     * Quotes the locked price for an order.
     *
     * @param customer the customer ordering
     * @param item     the chosen item
     * @return the price after the customer's discount
     */
    public Money quote(Customer customer, MenuItem item) {
        return customer.applyDiscount(item.getPrice());
    }
}
