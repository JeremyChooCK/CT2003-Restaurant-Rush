package restaurantrush.entity;

/**
 * A combo made of two existing menu items.
 * <p>
 * Its preparation units are the sum of both components, and its price is
 * 90% of their combined price, rounded to the nearest cent. For example,
 * Salad + Pasta costs ($9.00 + $18.00) x 0.9 = $24.30 and needs 3 units.
 * <p>
 * A combo is made up of other menu items. It is also a {@link MenuItem}
 * itself, so orders, the Chef and pricing treat it like a normal dish.
 */
public class ComboMeal extends MenuItem {

    /** Percentage of the combined component price that a combo costs. */
    public static final int PRICE_PERCENT = 90;

    private final MenuItem first;
    private final MenuItem second;

    /**
     * Creates a combo named after its two components, for example
     * "Salad + Pasta Combo".
     *
     * @param first  the first component
     * @param second the second component
     */
    public ComboMeal(MenuItem first, MenuItem second) {
        super(nameOf(first, second));
        this.first = first;
        this.second = second;
    }

    private static String nameOf(MenuItem first, MenuItem second) {
        if (first == null || second == null) {
            throw new IllegalArgumentException("A combo needs two menu items.");
        }
        return first.getName() + " + " + second.getName() + " Combo";
    }

    /**
     * Returns 90% of the two components' combined price.
     *
     * @return the combo price
     */
    @Override
    public Money getPrice() {
        return first.getPrice().plus(second.getPrice()).percent(PRICE_PERCENT);
    }

    /**
     * Returns the sum of the two components' preparation units.
     *
     * @return the preparation units
     */
    @Override
    public int getPrepUnits() {
        return first.getPrepUnits() + second.getPrepUnits();
    }

    /**
     * Returns the first component.
     *
     * @return the first item
     */
    public MenuItem getFirst() {
        return first;
    }

    /**
     * Returns the second component.
     *
     * @return the second item
     */
    public MenuItem getSecond() {
        return second;
    }
}
