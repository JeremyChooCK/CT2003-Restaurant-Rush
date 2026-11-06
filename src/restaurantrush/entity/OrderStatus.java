package restaurantrush.entity;

/**
 * The stages an order moves through.
 */
public enum OrderStatus {
    /** Being cooked; some preparation units remain. */
    PREPARING,
    /** All preparation units are done; the Waiter can serve it. */
    READY,
    /** Delivered to the customer. */
    SERVED,
    /** The bill has been paid. */
    PAID,
    /** The customer left before eating, so the order was dropped. */
    CANCELLED
}
