package restaurantrush.entity;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * The list of menu items customers can choose from.
 */
public class Menu {

    private final List<MenuItem> items = new ArrayList<>();

    /**
     * Adds an item to the end of the menu.
     *
     * @param item the item to add
     */
    public void addItem(MenuItem item) {
        if (item == null) {
            throw new IllegalArgumentException("Menu item cannot be null.");
        }
        items.add(item);
    }

    /**
     * Returns the items in menu order.
     *
     * @return a read-only list of items
     */
    public List<MenuItem> getItems() {
        return Collections.unmodifiableList(items);
    }

    /**
     * Returns the item at a position.
     *
     * @param index position starting at 0
     * @return the item
     */
    public MenuItem getItem(int index) {
        return items.get(index);
    }

    /**
     * Returns the number of items on the menu.
     *
     * @return the number of items
     */
    public int size() {
        return items.size();
    }

    /**
     * Returns the most expensive item. If two items cost the same, the one
     * listed first is returned.
     *
     * @return the most expensive item
     * @throws IllegalStateException if the menu is empty
     */
    public MenuItem mostExpensive() {
        if (items.isEmpty()) {
            throw new IllegalStateException("The menu is empty.");
        }
        MenuItem best = items.get(0);
        for (MenuItem item : items) {
            if (item.getPrice().compareTo(best.getPrice()) > 0) {
                best = item;
            }
        }
        return best;
    }
}
