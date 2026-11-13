package restaurantrush.entity;

/**
 * Thrown when the manager chooses an action that the game rules do not allow,
 * for example seating a customer at an occupied table.
 * <p>
 * The message explains why the action failed so it can be shown to the
 * player. A failed action never uses up a staff member's task.
 */
public class InvalidActionException extends Exception {

    private static final long serialVersionUID = 1L;

    /**
     * Creates the exception.
     *
     * @param message why the action is not allowed (shown to the player)
     */
    public InvalidActionException(String message) {
        super(message);
    }
}
