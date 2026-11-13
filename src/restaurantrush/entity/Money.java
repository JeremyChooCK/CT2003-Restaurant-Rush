package restaurantrush.entity;

/**
 * An immutable, non-negative amount of money stored as whole cents.
 * <p>
 * Storing integer cents avoids floating-point rounding errors. All
 * arithmetic returns a new {@code Money} object, so a price can be shared
 * safely between orders without being changed by accident.
 */
public final class Money implements Comparable<Money> {

    /** A zero amount, used as the starting revenue. */
    public static final Money ZERO = new Money(0);

    private final long cents;

    private Money(long cents) {
        if (cents < 0) {
            throw new IllegalArgumentException("Money cannot be negative: " + cents);
        }
        this.cents = cents;
    }

    /**
     * Creates an amount from whole cents.
     *
     * @param cents number of cents, must not be negative
     * @return the amount
     */
    public static Money ofCents(long cents) {
        return new Money(cents);
    }

    /**
     * Creates an amount from whole dollars.
     *
     * @param dollars number of dollars, must not be negative
     * @return the amount
     */
    public static Money ofDollars(long dollars) {
        return new Money(dollars * 100L);
    }

    /**
     * Adds another amount to this one.
     *
     * @param other the amount to add
     * @return a new amount equal to the sum
     */
    public Money plus(Money other) {
        return new Money(cents + other.cents);
    }

    /**
     * Returns the given percentage of this amount, rounded half-up to the
     * nearest cent. For example, 90 percent of $27.00 is $24.30.
     *
     * @param percent the percentage to keep, from 0 to 100
     * @return a new amount
     */
    public Money percent(int percent) {
        if (percent < 0) {
            throw new IllegalArgumentException("Percent cannot be negative: " + percent);
        }
        return new Money((cents * percent + 50) / 100);
    }

    /**
     * Checks whether this amount is greater than or equal to another.
     *
     * @param other the amount to compare against
     * @return {@code true} if this amount is at least {@code other}
     */
    public boolean isAtLeast(Money other) {
        return cents >= other.cents;
    }

    @Override
    public int compareTo(Money other) {
        return Long.compare(cents, other.cents);
    }

    @Override
    public boolean equals(Object obj) {
        return obj instanceof Money && ((Money) obj).cents == cents;
    }

    @Override
    public int hashCode() {
        return Long.hashCode(cents);
    }

    /**
     * Formats the amount in dollars with two decimals, for example {@code $9.00}.
     *
     * @return the formatted amount
     */
    @Override
    public String toString() {
        return String.format("$%d.%02d", cents / 100, cents % 100);
    }
}
