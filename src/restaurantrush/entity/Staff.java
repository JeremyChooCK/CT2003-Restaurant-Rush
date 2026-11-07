package restaurantrush.entity;

/**
 * A staff member who can complete at most one task per turn.
 * <p>
 * Subclasses check that an action is valid before calling
 * {@link #completeTask()}, so an invalid choice never uses up the task.
 */
public abstract class Staff {

    private final String role;
    private boolean actedThisTurn;

    /**
     * Creates a staff member.
     *
     * @param role the job title shown to the player, such as "Waiter"
     */
    protected Staff(String role) {
        this.role = role;
    }

    /**
     * Makes the staff member available again at the start of a turn.
     */
    public void resetForTurn() {
        actedThisTurn = false;
    }

    /**
     * Tells whether the staff member has already completed a task this turn.
     *
     * @return {@code true} if the task has been used
     */
    public boolean hasActedThisTurn() {
        return actedThisTurn;
    }

    /**
     * Returns the job title.
     *
     * @return the role
     */
    public String getRole() {
        return role;
    }

    /**
     * Checks that the staff member still has a task left this turn.
     *
     * @throws InvalidActionException if the task has already been used
     */
    protected void ensureAvailable() throws InvalidActionException {
        if (actedThisTurn) {
            throw new InvalidActionException("The " + role + " has already completed a task this turn.");
        }
    }

    /**
     * Records that this turn's task has been used. Call only after the
     * action has succeeded.
     */
    protected void completeTask() {
        actedThisTurn = true;
    }
}
