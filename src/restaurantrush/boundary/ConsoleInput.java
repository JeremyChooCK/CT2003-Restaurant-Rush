package restaurantrush.boundary;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.PrintStream;
import java.nio.charset.StandardCharsets;

/**
 * Reads the manager's choices from the keyboard, or from a script file
 * redirected into the program. This class only checks that the input is a
 * number in the right range. The game rules decide if the move is allowed.
 * <p>
 * If the input runs out (e.g. at the end of a script file) it answers "0"
 * (Wait) or "no" so the run can still finish.
 */
public class ConsoleInput {

    private final BufferedReader reader;
    private final PrintStream out;
    private final boolean echo;
    private boolean ended;

    /**
     * Creates the input reader.
     *
     * @param in   where choices come from
     * @param out  where prompts are written
     * @param echo {@code true} to print each answer after the prompt, which
     *             makes transcripts of scripted runs readable
     */
    public ConsoleInput(InputStream in, PrintStream out, boolean echo) {
        this.reader = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8));
        this.out = out;
        this.echo = echo;
    }

    /**
     * Asks for a whole number between {@code min} and {@code max} and keeps
     * asking until a valid number is entered.
     *
     * @param prompt the question to show
     * @param min    the smallest allowed value
     * @param max    the largest allowed value
     * @return the number entered, or 0 if the input has ended
     */
    public int readInt(String prompt, int min, int max) {
        while (true) {
            String line = readLine(prompt);
            if (line == null) {
                return 0;
            }
            try {
                int value = Integer.parseInt(line.trim());
                if (value >= min && value <= max) {
                    return value;
                }
                out.println("  ! Please enter a number from " + min + " to " + max + ".");
            } catch (NumberFormatException e) {
                out.println("  ! \"" + line.trim() + "\" is not a whole number. Please try again.");
            }
        }
    }

    /**
     * Asks a yes/no question and keeps asking until "y" or "n" is entered.
     *
     * @param prompt the question to show
     * @return {@code true} for yes; {@code false} for no or if input has ended
     */
    public boolean readYesNo(String prompt) {
        while (true) {
            String line = readLine(prompt);
            if (line == null) {
                return false;
            }
            String answer = line.trim().toLowerCase();
            if (answer.equals("y") || answer.equals("yes")) {
                return true;
            }
            if (answer.equals("n") || answer.equals("no")) {
                return false;
            }
            out.println("  ! Please answer y or n.");
        }
    }

    private String readLine(String prompt) {
        out.print(prompt);
        if (ended) {
            out.println("[no more input: using the default]");
            return null;
        }
        try {
            String line = reader.readLine();
            while (line != null && line.trim().startsWith("#")) {
                line = reader.readLine(); // comment lines in script files are skipped
            }
            if (line == null) {
                ended = true;
                out.println("[no more input: using the default]");
                return null;
            }
            if (echo) {
                out.println(line.trim());
            }
            return line;
        } catch (IOException e) {
            ended = true;
            out.println("[input error: " + e.getMessage() + "; using the default]");
            return null;
        }
    }
}
