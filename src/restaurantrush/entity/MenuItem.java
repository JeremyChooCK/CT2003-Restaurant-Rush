package restaurantrush.entity;

/**
 * Something a customer can order. Every menu item has a name, a price and
 * a number of preparation units the Chef must complete.
 * <p>
 * Orders and the Chef only depend on this abstraction, so new kinds of menu
 * item can be added without changing them.
 */
public abstract class MenuItem {

    private final String name;

    /**
     * Creates a menu item.
     *
     * @param name the display name, must not be blank
     */
    protected MenuItem(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("A menu item needs a name.");
        }
        this.name = name;
    }

    /**
     * Returns the display name.
     *
     * @return the name
     */
    public String getName() {
        return name;
    }

    /**
     * Returns the full menu price before any discount.
     *
     * @return the price
     */
    public abstract Money getPrice();

    /**
     * Returns how many preparation units the Chef must complete.
     *
     * @return the number of preparation units, at least 1
     */
    public abstract int getPrepUnits();

    @Override
    public String toString() {
        return name + " (" + getPrice() + ", " + getPrepUnits()
                + (getPrepUnits() == 1 ? " unit)" : " units)");
    }
}
