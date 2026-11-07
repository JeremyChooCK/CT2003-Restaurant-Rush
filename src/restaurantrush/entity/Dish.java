package restaurantrush.entity;

/**
 * A single dish with a fixed price and preparation time, such as a Salad.
 */
public class Dish extends MenuItem {

    private final Money price;
    private final int prepUnits;

    /**
     * Creates a dish.
     *
     * @param name      the display name
     * @param price     the full menu price
     * @param prepUnits the preparation units, at least 1
     */
    public Dish(String name, Money price, int prepUnits) {
        super(name);
        if (price == null) {
            throw new IllegalArgumentException("A dish needs a price.");
        }
        if (prepUnits < 1) {
            throw new IllegalArgumentException("A dish needs at least one preparation unit.");
        }
        this.price = price;
        this.prepUnits = prepUnits;
    }

    @Override
    public Money getPrice() {
        return price;
    }

    @Override
    public int getPrepUnits() {
        return prepUnits;
    }
}
