package restaurantrush;

import restaurantrush.boundary.ConsoleInput;
import restaurantrush.boundary.ConsoleView;
import restaurantrush.boundary.PixelGame;
import restaurantrush.control.Game;
import restaurantrush.control.GameController;
import restaurantrush.control.Scenario;

/**
 * Starts Restaurant Rush.
 * <p>
 * Options: {@code --seed N} changes the seed that decides customers' food
 * choices (default 2003); {@code --echo} prints each answer read from input,
 * which is useful when a script file is redirected into the game.
 */
public final class Main {

    private Main() {
    }

    /**
     * Program entry point.
     *
     * @param args command-line options
     */
    public static void main(String[] args) {
        long seed = Scenario.DEFAULT_SEED;
        boolean echo = false;
        boolean gui = false;
        for (int i = 0; i < args.length; i++) {
            if (args[i].equals("--gui")) {
                gui = true;
            } else if (args[i].equals("--echo")) {
                echo = true;
            } else if (args[i].equals("--seed") && i + 1 < args.length) {
                try {
                    seed = Long.parseLong(args[++i]);
                } catch (NumberFormatException e) {
                    System.err.println("Ignoring invalid seed \"" + args[i] + "\"; using " + seed + ".");
                }
            } else {
                System.err.println("Unknown option \"" + args[i] + "\". Options: --seed N, --echo, --gui");
            }
        }
        if (gui) {
            PixelGame.open(seed);
            return;
        }
        Game game = new Game(new Scenario(seed));
        ConsoleView view = new ConsoleView(System.out);
        ConsoleInput input = new ConsoleInput(System.in, System.out, echo);
        new GameController(game, view, input).run();
    }
}
