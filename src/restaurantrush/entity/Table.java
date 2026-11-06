package restaurantrush.entity;

/**
 * A dining table that holds at most one customer. It stays occupied until the
 * customer pays or leaves.
 */
public class Table {

    private final int number;
    private Customer occupant;

    /**
     * Creates an empty table.
     *
     * @param number the table number shown to the player, starting at 1
     */
    public Table(int number) {
        this.number = number;
    }

    /**
     * Tells whether nobody is sitting at the table.
     *
     * @return {@code true} if the table is free
     */
    public boolean isFree() {
        return occupant == null;
    }

    void assign(Customer customer) {
        if (!isFree()) {
            throw new IllegalStateException("Table " + number + " is occupied.");
        }
        occupant = customer;
    }

    void release() {
        occupant = null;
    }

    /**
     * Returns the table number.
     *
     * @return the number
     */
    public int getNumber() {
        return number;
    }

    /**
     * Returns the customer at the table.
     *
     * @return the customer, or {@code null} if free
     */
    public Customer getOccupant() {
        return occupant;
    }
}
