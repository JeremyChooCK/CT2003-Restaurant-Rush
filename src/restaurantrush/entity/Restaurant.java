package restaurantrush.entity;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Deque;
import java.util.List;

/**
 * The restaurant floor: the menu, the tables, the waiting queue, every
 * customer who has arrived and every order taken.
 * <p>
 * It creates its own tables and makes sure the queue, tables, customers and
 * orders stay in sync. Staff use its methods to seat customers, create orders
 * and take payments.
 */
public class Restaurant {

    private final Menu menu;
    private final List<Table> tables = new ArrayList<>();
    private final Deque<Customer> waitingQueue = new ArrayDeque<>();
    private final List<Customer> customers = new ArrayList<>();
    private final List<Order> orders = new ArrayList<>();
    private int nextOrderId = 1;

    /**
     * Creates a restaurant with empty tables.
     *
     * @param menu       the menu customers order from
     * @param tableCount the number of tables, at least 1
     */
    public Restaurant(Menu menu, int tableCount) {
        if (tableCount < 1) {
            throw new IllegalArgumentException("A restaurant needs at least one table.");
        }
        this.menu = menu;
        for (int i = 1; i <= tableCount; i++) {
            tables.add(new Table(i));
        }
    }

    /**
     * Adds a newly arrived customer to the back of the waiting queue.
     *
     * @param customer the customer
     */
    public void admit(Customer customer) {
        customers.add(customer);
        waitingQueue.addLast(customer);
    }

    /**
     * Moves a queued customer to a free table.
     *
     * @param customer the customer to seat
     * @param table    the table to use
     * @throws InvalidActionException if the customer is not queued or the table is taken
     */
    void seat(Customer customer, Table table) throws InvalidActionException {
        if (!waitingQueue.contains(customer)) {
            throw new InvalidActionException(customer.getLabel() + " is not in the waiting queue.");
        }
        if (!table.isFree()) {
            throw new InvalidActionException("Table " + table.getNumber() + " is occupied by "
                    + table.getOccupant().getLabel() + ".");
        }
        waitingQueue.remove(customer);
        table.assign(customer);
        customer.seatAt(table);
    }

    /**
     * Creates and records a new order for a seated customer.
     *
     * @param customer the customer ordering
     * @param item     the chosen item
     * @param price    the locked price
     * @param turn     the current turn
     * @return the new order
     */
    Order openOrder(Customer customer, MenuItem item, Money price, int turn) {
        Order order = new Order(nextOrderId++, customer, item, price, turn);
        orders.add(order);
        customer.placeOrder(order);
        return order;
    }

    /**
     * Completes a customer's payment: marks the order and customer PAID and
     * frees the table.
     *
     * @param customer the paying customer
     */
    void completePayment(Customer customer) {
        Table table = customer.getTable();
        customer.getOrder().markPaid();
        customer.pay();
        if (table != null) {
            table.release();
        }
    }

    /**
     * Moves every customer who was served on an earlier turn from EATING to
     * READY_TO_PAY.
     *
     * @param turn the current turn
     * @return the customers who finished eating this turn
     */
    public List<Customer> finishEating(int turn) {
        List<Customer> finished = new ArrayList<>();
        for (Customer customer : customers) {
            if (customer.getStatus() == CustomerStatus.EATING && customer.getServedTurn() < turn) {
                customer.finishEating(turn);
                finished.add(customer);
            }
        }
        return finished;
    }

    /**
     * Removes an unhappy customer: they leave without paying, any unfinished
     * order is cancelled and their table or queue place is freed.
     *
     * @param customer the customer who is leaving
     */
    public void handleDeparture(Customer customer) {
        Order order = customer.getOrder();
        if (order != null) {
            order.cancel();
        }
        Table table = customer.getTable();
        if (table != null) {
            table.release();
        }
        waitingQueue.remove(customer);
        customer.leave();
    }

    /**
     * Finds a customer in the waiting queue.
     *
     * @param id the customer number
     * @return the customer
     * @throws InvalidActionException if no queued customer has that number
     */
    public Customer findQueuedCustomer(int id) throws InvalidActionException {
        for (Customer customer : waitingQueue) {
            if (customer.getId() == id) {
                return customer;
            }
        }
        throw new InvalidActionException("There is no customer C" + id + " in the waiting queue.");
    }

    /**
     * Finds a table by number.
     *
     * @param number the table number
     * @return the table
     * @throws InvalidActionException if the table does not exist
     */
    public Table findTable(int number) throws InvalidActionException {
        if (number < 1 || number > tables.size()) {
            throw new InvalidActionException("There is no Table " + number
                    + ". Tables are numbered 1 to " + tables.size() + ".");
        }
        return tables.get(number - 1);
    }

    /**
     * Finds an order by number.
     *
     * @param id the order number
     * @return the order
     * @throws InvalidActionException if no order has that number
     */
    public Order findOrder(int id) throws InvalidActionException {
        for (Order order : orders) {
            if (order.getId() == id) {
                return order;
            }
        }
        throw new InvalidActionException("There is no order #" + id + ".");
    }

    /**
     * Tells whether any table is free.
     *
     * @return {@code true} if at least one table is free
     */
    public boolean hasFreeTable() {
        for (Table table : tables) {
            if (table.isFree()) {
                return true;
            }
        }
        return false;
    }

    /**
     * Returns the customers who are still in the restaurant.
     *
     * @return customers who have not paid or left, in arrival order
     */
    public List<Customer> getActiveCustomers() {
        List<Customer> active = new ArrayList<>();
        for (Customer customer : customers) {
            if (!customer.getStatus().isFinished()) {
                active.add(customer);
            }
        }
        return active;
    }

    /**
     * Returns customers in a given state, in arrival order.
     *
     * @param status the state to look for
     * @return the matching customers
     */
    public List<Customer> getCustomersWithStatus(CustomerStatus status) {
        List<Customer> matching = new ArrayList<>();
        for (Customer customer : customers) {
            if (customer.getStatus() == status) {
                matching.add(customer);
            }
        }
        return matching;
    }

    /**
     * Returns orders in a given state, in order number.
     *
     * @param status the state to look for
     * @return the matching orders
     */
    public List<Order> getOrdersWithStatus(OrderStatus status) {
        List<Order> matching = new ArrayList<>();
        for (Order order : orders) {
            if (order.getStatus() == status) {
                matching.add(order);
            }
        }
        return matching;
    }

    /**
     * Returns the menu.
     *
     * @return the menu
     */
    public Menu getMenu() {
        return menu;
    }

    /**
     * Returns the tables in number order.
     *
     * @return a read-only list of tables
     */
    public List<Table> getTables() {
        return Collections.unmodifiableList(tables);
    }

    /**
     * Returns the waiting queue from front to back.
     *
     * @return a copy of the queue
     */
    public List<Customer> getWaitingQueue() {
        return new ArrayList<>(waitingQueue);
    }

    /**
     * Returns every customer who has arrived.
     *
     * @return a read-only list in arrival order
     */
    public List<Customer> getCustomers() {
        return Collections.unmodifiableList(customers);
    }

    /**
     * Returns every order taken.
     *
     * @return a read-only list in order number
     */
    public List<Order> getOrders() {
        return Collections.unmodifiableList(orders);
    }
}
