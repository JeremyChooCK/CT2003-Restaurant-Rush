package restaurantrush.control;

import restaurantrush.boundary.ConsoleInput;
import restaurantrush.boundary.ConsoleView;
import restaurantrush.entity.InvalidActionException;

/**
 * Runs the turn loop. For each turn it shows the state, asks the manager for
 * each staff member's task, passes the choice to {@link Game} and, if the
 * game rejects it, shows the reason and asks again.
 */
public class GameController {

    private static final int WAIT = 0;
    private static final int MAX_ID = 999;

    private final Game game;
    private final ConsoleView view;
    private final ConsoleInput input;

    /**
     * Creates the controller.
     *
     * @param game  the game to run
     * @param view  the display
     * @param input the source of the manager's choices
     */
    public GameController(Game game, ConsoleView view, ConsoleInput input) {
        this.game = game;
        this.view = view;
        this.input = input;
    }

    /**
     * Plays every turn and then shows the result.
     */
    public void run() {
        view.showWelcome(game);
        while (game.hasNextTurn()) {
            playTurn();
        }
        view.showFinalResult(game);
    }

    private void playTurn() {
        game.startTurn();
        view.showTurnHeader(game);
        view.showEvents(game.drainEvents());
        view.showState(game);

        view.showSection("Waiter (one task)");
        waiterStep();
        view.showSection("Chef (one preparation unit)");
        chefStep();

        view.showSection("Eating, payment and waiting");
        game.processEatingAndPayment();
        game.processSatisfactionAndDepartures();
        view.showEvents(game.drainEvents());
        view.showEndOfTurn(game);
    }

    private void waiterStep() {
        while (true) {
            int choice = input.readInt("Waiter: 1) Seat a customer  2) Take an order  3) Serve a READY order  0) Wait > ",
                    0, 3);
            try {
                switch (choice) {
                    case 1:
                        game.waiterSeat(input.readInt("  Customer number to seat (e.g. 2 for C2) > ", 0, MAX_ID),
                                input.readInt("  Table number > ", 0, MAX_ID));
                        break;
                    case 2:
                        game.waiterTakeOrder(input.readInt("  Table number to take the order from > ", 0, MAX_ID));
                        break;
                    case 3:
                        game.waiterServe(input.readInt("  Order number to serve > ", 0, MAX_ID));
                        break;
                    default:
                        view.showMessage("The Waiter waits this turn.");
                        return;
                }
                view.showEvents(game.drainEvents());
                return;
            } catch (InvalidActionException e) {
                view.showError(e.getMessage());
            }
        }
    }

    private void chefStep() {
        while (true) {
            int choice = input.readInt("Chef: 1) Cook one unit of an order  0) Wait > ", 0, 1);
            if (choice == WAIT) {
                view.showMessage("The Chef waits this turn.");
                return;
            }
            try {
                game.chefPrepare(input.readInt("  Order number to cook > ", 0, MAX_ID));
                view.showEvents(game.drainEvents());
                return;
            } catch (InvalidActionException e) {
                view.showError(e.getMessage());
            }
        }
    }
}
