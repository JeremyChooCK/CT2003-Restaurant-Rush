package restaurantrush.boundary;

import restaurantrush.control.Game;
import restaurantrush.control.Scenario;
import restaurantrush.entity.InvalidActionException;

/**
 * Saved points in the game that we can jump to during the demo in the
 * pixel-art window.
 * <p>
 * A jump creates a new {@link Game} with the default seed and replays the
 * moves from our recorded runs ({@code runs/stage3-victory.txt} or
 * {@code runs/stage3-defeat.txt}) up to the chosen turn. Since the game uses
 * a fixed seed, the same jump always gives the same state. Jumping back just
 * starts a new game again.
 * <p>
 * The replay only calls the normal public {@link Game} methods, so the rules
 * are the same as in a normal game.
 */
public enum DemoJump {

    /** A fresh game, before turn 1 starts. */
    NEW_GAME("Turn 1: new game", false, 0),

    /** Turns 1-3 played; the VIP (C2) arrives when turn 4 starts. */
    VIP_ARRIVES("Turn 4: VIP arrives", false, 3),

    /** Turns 1-9 played; the Critic (C4) arrives when turn 10 starts. */
    CRITIC_ARRIVES("Turn 10: Critic arrives", false, 9),

    /** Turns 1-12 played; the Critic's dish is READY as C5 arrives on turn 13. */
    HAPPY_HOUR_DECISION("Turn 13: Happy Hour decision", false, 12),

    /** All 18 turns of the victory run played. */
    VICTORY("End: victory", false, 18),

    /** All 18 turns of the defeat run played. */
    DEFEAT("End: defeat", true, 18);

    private final String label;
    private final boolean defeatRun;
    private final int turnsPlayed;

    DemoJump(String label, boolean defeatRun, int turnsPlayed) {
        this.label = label;
        this.defeatRun = defeatRun;
        this.turnsPlayed = turnsPlayed;
    }

    /**
     * Returns how many turns the jump plays before handing control back.
     *
     * @return the number of completed turns
     */
    public int getTurnsPlayed() {
        return turnsPlayed;
    }

    /**
     * Creates a new game with the default seed and replays the recorded moves
     * for {@link #getTurnsPlayed()} turns.
     *
     * @return the game, ready for the next turn to start (or finished)
     * @throws InvalidActionException if a recorded move is rejected, which
     *                                would mean the rules no longer match the
     *                                recorded runs
     */
    public Game replay() throws InvalidActionException {
        Game game = new Game(new Scenario(Scenario.DEFAULT_SEED));
        for (int turn = 1; turn <= turnsPlayed; turn++) {
            if (defeatRun) {
                playDefeatTurn(game, turn);
            } else {
                playVictoryTurn(game, turn);
            }
            game.processEatingAndPayment();
            game.processSatisfactionAndDepartures();
            game.drainEvents();
        }
        return game;
    }

    @Override
    public String toString() {
        return label;
    }

    /** One turn of runs/stage3-victory.txt (customers C1-C6, orders #1-#6). */
    private static void playVictoryTurn(Game game, int turn) throws InvalidActionException {
        if (turn == 13) {
            game.activateHappyHour();
        }
        game.startTurn();
        switch (turn) {
            case 1 -> seatOrderAndCook(game, 1, 1, 1);
            case 2 -> game.waiterServe(1);
            case 4 -> seatOrderAndCook(game, 2, 2, 2);
            case 5 -> game.chefPrepare(2);
            case 6 -> game.waiterServe(2);
            case 7 -> seatOrderAndCook(game, 3, 1, 3);
            case 8 -> game.waiterServe(3);
            case 10 -> seatOrderAndCook(game, 4, 2, 4);
            case 11, 12, 15 -> game.chefPrepare(turn == 15 ? 5 : 4);
            case 13 -> seatOrderAndCook(game, 5, 1, 5);
            case 14 -> {
                game.waiterServe(4);
                game.chefPrepare(5);
            }
            case 16 -> game.waiterServe(5);
            case 17 -> seatOrderAndCook(game, 6, 2, 6);
            case 18 -> game.chefPrepare(6);
            default -> {
                // Turns 3 and 9: every staff member waits.
            }
        }
    }

    /** One turn of runs/stage3-defeat.txt: Happy Hour wasted and the Chef never cooks. */
    private static void playDefeatTurn(Game game, int turn) throws InvalidActionException {
        if (turn == 1) {
            game.activateHappyHour();
        }
        game.startTurn();
        if (turn == 1 || turn == 4) {
            int customer = turn == 1 ? 1 : 2;
            game.hostSeat(customer, customer);
            game.waiterTakeOrder(customer);
        }
    }

    /** The Host seats a customer, the Waiter takes the order and the Chef starts it. */
    private static void seatOrderAndCook(Game game, int customerId, int table, int orderId)
            throws InvalidActionException {
        game.hostSeat(customerId, table);
        game.waiterTakeOrder(table);
        game.chefPrepare(orderId);
    }
}
