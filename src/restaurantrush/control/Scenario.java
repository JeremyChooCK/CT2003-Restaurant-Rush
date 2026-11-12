package restaurantrush.control;

import java.util.Optional;

import restaurantrush.entity.Customer;
import restaurantrush.entity.Dish;
import restaurantrush.entity.Menu;
import restaurantrush.entity.Money;
import restaurantrush.entity.RegularCustomer;

/**
 * The base setting from the brief: 18 turns, 2 tables, the three-dish menu
 * and one Regular customer arriving on turns 1, 4, 7, 10, 13 and 16.
 * <p>
 * All setup lives here, so later stages register new customer types or menu
 * items by changing this class only.
 */
public class Scenario {

    /** The seed used when none is given, so every run is reproducible. */
    public static final long DEFAULT_SEED = 2003;

    private static final int MAX_TURNS = 18;
    private static final int TABLE_COUNT = 2;

    private final long seed;

    /**
     * Creates the base scenario.
     *
     * @param seed the seed that decides every customer's food choices
     */
    public Scenario(long seed) {
        this.seed = seed;
    }

    /**
     * Builds the menu: Salad $9.00 (1 unit), Burger $15.00 (1 unit),
     * Pasta $18.00 (2 units).
     *
     * @return a new menu
     */
    public Menu createMenu() {
        Menu menu = new Menu();
        Dish salad = new Dish("Salad", Money.ofDollars(9), 1);
        Dish burger = new Dish("Burger", Money.ofDollars(15), 1);
        Dish pasta = new Dish("Pasta", Money.ofDollars(18), 2);
        menu.addItem(salad);
        menu.addItem(burger);
        menu.addItem(pasta);
        return menu;
    }

    /**
     * Creates the customer scheduled to arrive at the start of a turn.
     *
     * @param turn       the current turn
     * @param customerId the number to give the new customer
     * @return the arriving customer, or empty if nobody arrives this turn
     */
    public Optional<Customer> createArrival(int turn, int customerId) {
        switch (turn) {
            case 1: case 4: case 7: case 10: case 13: case 16:
                return Optional.of(new RegularCustomer(customerId, turn, seed));
            default:
                return Optional.empty();
        }
    }

    /**
     * Returns the number of turns in a game.
     *
     * @return 18
     */
    public int getMaxTurns() {
        return MAX_TURNS;
    }

    /**
     * Returns the number of tables.
     *
     * @return 2
     */
    public int getTableCount() {
        return TABLE_COUNT;
    }

    /**
     * Returns the seed.
     *
     * @return the seed
     */
    public long getSeed() {
        return seed;
    }
}
