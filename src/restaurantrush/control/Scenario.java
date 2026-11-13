package restaurantrush.control;

import java.util.Optional;

import restaurantrush.entity.ComboMeal;
import restaurantrush.entity.CriticCustomer;
import restaurantrush.entity.Customer;
import restaurantrush.entity.Dish;
import restaurantrush.entity.Menu;
import restaurantrush.entity.Money;
import restaurantrush.entity.RegularCustomer;
import restaurantrush.entity.VIPCustomer;

/**
 * The base setting from the brief: 18 turns, 2 tables, the three-dish menu
 * and one arrival on turns 1, 4, 7, 10, 13 and 16.
 * <p>
 * Stage 2 arrivals: a VIP on turn 4 and a Critic on turn 10; the other four
 * are Regular customers, so there are still six arrivals.
 * <p>
 * All the setup is in this class, so adding new customer types or menu items
 * in later stages only needs changes here.
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
     * Pasta $18.00 (2 units) and, from Stage 3, the three two-dish combos.
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
        // Stage 3: every pair of dishes is also offered as a combo at 90% of the combined price.
        menu.addItem(new ComboMeal(salad, burger));
        menu.addItem(new ComboMeal(salad, pasta));
        menu.addItem(new ComboMeal(burger, pasta));
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
            case 4:
                return Optional.of(new VIPCustomer(customerId, turn, seed));
            case 10:
                return Optional.of(new CriticCustomer(customerId, turn, seed));
            case 1: case 7: case 13: case 16:
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
